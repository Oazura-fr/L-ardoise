# L'Ardoise

La reconnaissance de dette entre proches — signée, datée, jamais oubliée. Fun à utiliser, sérieuse sur le fond.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Supabase** (Postgres, Auth, Storage, RLS) — voir `supabase/schema.sql`
- **Stripe** (frais de création 0,99 €, Premium, actes légaux)
- **Brevo** (SMS Premium + emails de relance)
- **Yousign** (signature électronique eIDAS ≥ 500 €)

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner les clés Supabase
npm run dev                  # http://localhost:3000
```

Sans clés Supabase, l'app tourne en **mode démo** (bandeau « Mode démo »).

## Base de données

Exécuter `supabase/schema.sql` dans **Supabase → SQL Editor** (une fois le projet créé).

## Modèle produit (rappels)

- **Inscription** : email + mobile obligatoires, photo facultative.
- **Signature** : par lien gratuit (le proche signe sans compte) ; envoi SMS et eIDAS = payants.
- **Coût zéro** : aucune action gratuite ne déclenche un coût payant.
- **Seuil 500 €** : au-dessus, signature avancée eIDAS fortement recommandée.
- **Montants** : stockés en centimes (exact).

## Structure

```
app/            Pages (App Router)
lib/            supabase.ts (public), supabaseAdmin.ts (service_role), montant.ts
supabase/       schema.sql (tables, vues, triggers, RLS, storage)
```
