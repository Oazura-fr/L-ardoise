-- L'Ardoise — schéma de base de données (Supabase / Postgres) — v0.1
-- À exécuter dans Supabase → SQL Editor.
-- Principes : montants en CENTIMES, email+tél obligatoires, RLS partout.

-- ============================================================
-- 1. Extensions & types
-- ============================================================
create extension if not exists "pgcrypto";

create type ack_sens         as enum ('pret','emprunt');
create type ack_status       as enum ('brouillon','a_signer','signee','en_retard','reglee','litige');
create type sig_type         as enum ('lien_otp','eidas_avancee','eidas_qualifiee');
create type reminder_level   as enum ('rappel','ferme','mise_en_demeure');
create type reminder_channel as enum ('push','email','sms');
create type msg_type         as enum ('texte','systeme');
create type plan_type        as enum ('gratuit','premium');
create type payment_kind     as enum ('frais_creation','reconnaissance_legale','recouvrement','abonnement');

-- ============================================================
-- 2. Profils (email + tél obligatoires, photo facultative)
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  phone       text not null,
  first_name  text not null default 'Moi',
  last_name   text,
  birth_date  date,
  address     text,
  photo_url   text,
  plan        plan_type not null default 'gratuit',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- 3. Contacts
-- ============================================================
create table contacts (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references profiles(id) on delete cascade,
  first_name     text not null,
  phone          text,
  email          text,
  linked_user_id uuid references profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index on contacts(owner_id);

-- ============================================================
-- 4. Reconnaissances de dette
-- ============================================================
create table acknowledgments (
  id                  uuid primary key default gen_random_uuid(),
  creator_id          uuid not null references profiles(id) on delete cascade,
  creditor_user_id    uuid references profiles(id) on delete set null,
  creditor_contact_id uuid references contacts(id) on delete set null,
  debtor_user_id      uuid references profiles(id) on delete set null,
  debtor_contact_id   uuid references contacts(id) on delete set null,
  amount_cents        integer not null check (amount_cents > 0),
  amount_words        text not null,
  currency            text not null default 'EUR',
  method              text not null,
  loan_date           date not null,
  due_date            date,
  motif               text,
  status              ack_status not null default 'a_signer',
  signature_required  sig_type not null default 'lien_otp',
  yousign_request_id  text,
  signer_identity     jsonb,
  signed_notified_at  timestamptz,
  signed_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint one_creditor check (num_nonnulls(creditor_user_id, creditor_contact_id) = 1),
  constraint one_debtor   check (num_nonnulls(debtor_user_id,   debtor_contact_id)   = 1)
);
create index on acknowledgments(creator_id);
create index on acknowledgments(creditor_user_id);
create index on acknowledgments(debtor_user_id);
create index on acknowledgments(status);
create index on acknowledgments(due_date);

-- ============================================================
-- 5. Remboursements + vue des soldes
-- ============================================================
create table repayments (
  id           uuid primary key default gen_random_uuid(),
  ack_id       uuid not null references acknowledgments(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  method       text not null,
  paid_on      date not null,
  note         text,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index on repayments(ack_id);

create view ack_balances as
select
  a.id                             as ack_id,
  a.amount_cents,
  coalesce(sum(r.amount_cents), 0) as repaid_cents,
  a.amount_cents - coalesce(sum(r.amount_cents), 0) as remaining_cents
from acknowledgments a
left join repayments r on r.ack_id = a.id
group by a.id;

-- ============================================================
-- 6. Signatures & liens de signature
-- ============================================================
create table sign_links (
  id         uuid primary key default gen_random_uuid(),
  ack_id     uuid not null references acknowledgments(id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null default (now() + interval '30 days'),
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create table signatures (
  id                uuid primary key default gen_random_uuid(),
  ack_id            uuid not null references acknowledgments(id) on delete cascade,
  signer_user_id    uuid references profiles(id) on delete set null,
  signer_contact_id uuid references contacts(id) on delete set null,
  type              sig_type not null,
  signed_at         timestamptz not null default now(),
  proof             jsonb,
  provider_ref      text
);
create index on signatures(ack_id);

-- ============================================================
-- 7. Messagerie interne
-- ============================================================
create table conversations (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table conversation_participants (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade,
  contact_id      uuid references contacts(id) on delete cascade,
  last_read_at    timestamptz not null default now()
);
create unique index on conversation_participants (conversation_id, coalesce(user_id, contact_id));

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_user_id  uuid references profiles(id) on delete set null,
  type            msg_type not null default 'texte',
  body            text not null,
  created_at      timestamptz not null default now()
);
create index on messages(conversation_id, created_at);

-- Messagerie simplifiée : un fil par reconnaissance (accès via les parties)
create table ack_messages (
  id             uuid primary key default gen_random_uuid(),
  ack_id         uuid not null references acknowledgments(id) on delete cascade,
  sender_user_id uuid references profiles(id) on delete set null,
  body           text not null,
  created_at     timestamptz not null default now()
);
create index ack_messages_ack_idx on ack_messages(ack_id, created_at);
alter table ack_messages enable row level security;
create policy "ack_messages via ack" on ack_messages for all
  using (can_access_ack(ack_id)) with check (can_access_ack(ack_id));

-- ============================================================
-- 8. Relances & facturation
-- ============================================================
create table reminders (
  id           uuid primary key default gen_random_uuid(),
  ack_id       uuid not null references acknowledgments(id) on delete cascade,
  level        reminder_level not null,
  channel      reminder_channel not null,
  scheduled_at timestamptz not null,
  sent_at      timestamptz,
  status       text not null default 'planifie',
  created_at   timestamptz not null default now()
);
create index on reminders(scheduled_at) where sent_at is null;

create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references profiles(id) on delete cascade,
  plan                   plan_type not null default 'premium',
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text not null default 'active',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now()
);

create table payments (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references profiles(id) on delete cascade,
  ack_id                   uuid references acknowledgments(id) on delete set null,
  kind                     payment_kind not null,
  amount_cents             integer not null,
  stripe_payment_intent_id text,
  status                   text not null default 'pending',
  created_at               timestamptz not null default now()
);

-- ============================================================
-- 9. Triggers
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, phone, first_name, last_name, birth_date, address)
  values (new.id, coalesce(new.email, ''),
          coalesce(new.phone, new.raw_user_meta_data->>'phone', ''),
          coalesce(new.raw_user_meta_data->>'first_name', 'Moi'),
          new.raw_user_meta_data->>'last_name',
          nullif(new.raw_user_meta_data->>'birth_date', '')::date,
          new.raw_user_meta_data->>'address');
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger t_profiles_touch before update on profiles        for each row execute function touch_updated_at();
create trigger t_ack_touch      before update on acknowledgments for each row execute function touch_updated_at();

create or replace function on_signature()
returns trigger language plpgsql as $$
begin
  update acknowledgments set status = 'signee', signed_at = coalesce(signed_at, now())
   where id = new.ack_id and status = 'a_signer';
  return new;
end; $$;
create trigger t_on_signature after insert on signatures
  for each row execute function on_signature();

-- ============================================================
-- 10. Sécurité par ligne (RLS)
-- ============================================================
alter table profiles                  enable row level security;
alter table contacts                  enable row level security;
alter table acknowledgments           enable row level security;
alter table repayments                enable row level security;
alter table signatures                enable row level security;
alter table conversations             enable row level security;
alter table conversation_participants enable row level security;
alter table messages                  enable row level security;
alter table reminders                 enable row level security;
alter table subscriptions             enable row level security;
alter table payments                  enable row level security;

create policy "profil visible par soi"    on profiles for select using (id = auth.uid());
create policy "profil modifiable par soi" on profiles for update using (id = auth.uid());

create policy "contacts à soi" on contacts for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "ack lisible par les parties" on acknowledgments for select
  using (auth.uid() in (creator_id, creditor_user_id, debtor_user_id));
create policy "ack créée par soi" on acknowledgments for insert
  with check (creator_id = auth.uid());
create policy "ack modifiable par créateur/créancier" on acknowledgments for update
  using (auth.uid() in (creator_id, creditor_user_id));

-- Suppression réservée au créateur (corriger une erreur de saisie).
-- Remboursements / signatures / messages / relances partent en cascade.
create policy "ack suppression par createur" on acknowledgments for delete
  using (creator_id = auth.uid());

create or replace function can_access_ack(a uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from acknowledgments
    where id = a and auth.uid() in (creator_id, creditor_user_id, debtor_user_id)
  );
$$;

create policy "repayments via ack" on repayments for all
  using (can_access_ack(ack_id)) with check (can_access_ack(ack_id));
create policy "signatures via ack" on signatures for select using (can_access_ack(ack_id));
create policy "reminders via ack"  on reminders  for select using (can_access_ack(ack_id));

create policy "conversations des participants" on conversations for select using (
  exists (select 1 from conversation_participants p
          where p.conversation_id = id and p.user_id = auth.uid()));
create policy "participants visibles" on conversation_participants for select using (
  user_id = auth.uid() or exists (
    select 1 from conversation_participants me
    where me.conversation_id = conversation_id and me.user_id = auth.uid()));
create policy "messages des participants" on messages for select using (
  exists (select 1 from conversation_participants p
          where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()));
create policy "envoyer un message" on messages for insert with check (
  sender_user_id = auth.uid() and exists (
    select 1 from conversation_participants p
    where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()));

create policy "abo à soi"       on subscriptions for select using (user_id = auth.uid());
create policy "paiements à soi"  on payments      for select using (user_id = auth.uid());

-- ============================================================
-- 11. Stockage des photos de profil
-- ============================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', false)
  on conflict (id) do nothing;

create policy "avatar lisible par soi" on storage.objects for select
  using (bucket_id = 'avatars' and owner = auth.uid());
create policy "uploader son avatar" on storage.objects for insert
  with check (bucket_id = 'avatars' and owner = auth.uid());
create policy "remplacer son avatar" on storage.objects for update
  using (bucket_id = 'avatars' and owner = auth.uid());
