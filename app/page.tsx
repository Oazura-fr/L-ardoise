import { ArrowRight, Check, Share2, Sparkles } from "lucide-react";
import AuthCta from "@/components/AuthCta";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* Blobs décoratifs */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-[42rem] -left-24 h-80 w-80 rounded-full bg-credit/10 blur-3xl" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate2 font-display text-2xl font-bold text-chalk shadow-card">
            €
          </div>
          <span className="font-display text-xl font-bold tracking-tight">L&apos;Ardoise</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <AuthCta variant="login" className="text-sm font-semibold text-inksoft transition-colors hover:text-accent" />
          <AuthCta className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pb-8 pt-8 sm:px-8 md:grid-cols-2 md:pt-14">
        <div className="animate-fadeup">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-semibold text-inksoft">
            <Sparkles size={13} className="text-accent" /> 100 % gratuit · l&apos;appli des potes qui se prêtent
          </span>
          <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.03] tracking-tight sm:text-6xl">
            Prête à tes proches{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">sans te fâcher</span>
              <span aria-hidden className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 bg-amber2/40" />
            </span>
            .
          </h1>
          <p className="mt-5 max-w-md text-lg text-inksoft">
            Une reconnaissance de dette signée en un clic, une échéance, et des
            relances qui évitent le malaise. Fun à utiliser, sérieuse sur le fond.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/inscription"
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-pop transition-transform hover:-translate-y-0.5"
            >
              Créer ma première ardoise <ArrowRight size={18} />
            </a>
            <a
              href="#comment"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-6 py-3.5 font-semibold text-ink transition-colors hover:border-accent"
            >
              Comment ça marche
            </a>
          </div>
          <div className="mt-7 flex items-center gap-3 text-sm text-inksoft">
            <div className="flex -space-x-2">
              {["bg-accent", "bg-credit", "bg-amber2", "bg-debit"].map((c, i) => (
                <span key={i} className={`h-7 w-7 rounded-full border-2 border-[#f6f0e1] ${c}`} />
              ))}
            </div>
            <span>
              Déjà entre les mains de potes qui{" "}
              <span className="font-semibold text-ink">n&apos;oublient plus rien</span>.
            </span>
          </div>
        </div>

        <div className="animate-fadeup [animation-delay:120ms]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero.webp"
            alt="Deux amis, l'un prête un billet à l'autre, une ardoise note la dette"
            className="floaty w-full rounded-3xl shadow-pop"
          />
        </div>
      </section>

      {/* Bandeau confiance */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-line bg-white/60 px-6 py-4 text-sm font-medium text-inksoft">
          <span className="flex items-center gap-2"><Check size={16} className="text-credit" /> Signature en un clic</span>
          <span className="flex items-center gap-2"><Check size={16} className="text-credit" /> Gratuit pour signer</span>
          <span className="flex items-center gap-2"><Check size={16} className="text-credit" /> Montant en toutes lettres</span>
          <span className="flex items-center gap-2"><Check size={16} className="text-credit" /> Signature eIDAS dès 200 €</span>
        </div>
      </section>

      {/* Features */}
      <section id="comment" className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Prêter devient un jeu d&apos;enfant
          </h2>
          <p className="mt-3 text-inksoft">
            Trois étapes, zéro prise de tête, et tout le monde reste ami.
          </p>
        </div>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          <Feature
            img="/feat-sign.webp"
            title="Signée par lien"
            text="Ton proche reçoit le lien sur WhatsApp et signe en un clic, sans installer l'app. Gratuit, 10 secondes."
            badge={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/10 px-3 py-1 text-xs font-semibold text-[#128C4A]">
                <WhatsApp className="h-3.5 w-3.5" /> Envoyée sur WhatsApp
              </span>
            }
          />
          <Feature
            img="/feat-relance.webp"
            title="Relances sans malaise"
            text="L'app relance à ta place, gentiment, à l'échéance : par notification et par email. Fini le SMS gênant."
          />
          <Feature
            img="/feat-preuve.webp"
            title="Une vraie preuve"
            text="Montant en toutes lettres, date, horodatage. Dès 200 €, signature électronique opposable."
          />
        </div>
      </section>

      {/* Aperçu produit + partage social */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="grid items-center gap-10 rounded-3xl border border-line bg-white/70 p-6 sm:p-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              <Share2 size={13} /> Fait pour se partager
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">
              Ton ardoise, d&apos;un coup d&apos;œil
            </h2>
            <p className="mt-3 text-inksoft">
              Qui te doit quoi, ce que tu dois, et depuis combien de temps. Et
              quand un pote traîne un peu trop… tu peux même le taquiner d&apos;une
              petite carte à partager. 🐌
            </p>
            <a
              href="/inscription"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-pop transition-transform hover:-translate-y-0.5"
            >
              Commencer gratuitement <ArrowRight size={18} />
            </a>
          </div>

          <div className="grid gap-4">
            {/* Mini ardoise */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-inksoft">Ton solde</span>
                <span className="font-display text-2xl font-bold text-credit tabular-nums">+ 895 €</span>
              </div>
              <Line color="credit" name="Pierre" note="Avance loyer" amount="+ 200 €" />
              <Line color="credit" name="Julie" note="Billets d'avion" amount="+ 500 €" />
              <Line color="debit" name="Mami" note="Les courses ❤️" amount="− 50 €" />
            </div>

            {/* Carte partageable */}
            <div className="relative overflow-hidden rounded-2xl bg-slate2 p-5 text-chalk shadow-card">
              <div aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
              <div className="text-xs font-semibold uppercase tracking-wide text-chalk/60">Avis de recherche 🔎</div>
              <div className="mt-1 font-display text-xl font-bold">
                Karim te doit 45 € depuis 47 jours 🐌
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-chalk/70">Envoyé avec le sourire</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-3.5 py-1.5 text-sm font-semibold text-white">
                  <WhatsApp className="h-4 w-4" /> Envoyer
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-accent px-6 py-14 text-center text-white shadow-pop sm:px-10">
          <div aria-hidden className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-white/10" />
          <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Tout est marqué sur l&apos;ardoise.
            <br />
            Personne n&apos;oublie.
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-white/85">
            Prête, emprunte, et reste ami. C&apos;est gratuit, et ça le reste.
          </p>
          <a
            href="/inscription"
            className="relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-semibold text-accent transition-transform hover:-translate-y-0.5"
          >
            Créer mon ardoise <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-line pt-8 text-sm text-inksoft sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate2 text-xs font-bold text-chalk">€</div>
            <span className="font-semibold text-ink">L&apos;Ardoise</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <a href="/legal/mentions" className="hover:text-accent">Mentions légales</a>
            <a href="/legal/cgu" className="hover:text-accent">Conditions d&apos;utilisation</a>
            <a href="/legal/confidentialite" className="hover:text-accent">Confidentialité</a>
            <span>Fait avec ❤️ pour les potes honnêtes.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  img,
  title,
  text,
  badge,
}: {
  img: string;
  title: string;
  text: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto overflow-hidden rounded-3xl border border-line bg-white shadow-card transition-transform hover:-translate-y-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="aspect-square w-full object-cover" />
      </div>
      <h3 className="mt-5 font-display text-xl font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-inksoft">{text}</p>
      {badge ? <div className="mt-3 flex justify-center">{badge}</div> : null}
    </div>
  );
}

function WhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function Line({
  color,
  name,
  note,
  amount,
}: {
  color: "credit" | "debit";
  name: string;
  note: string;
  amount: string;
}) {
  const dot = color === "credit" ? "bg-credit" : "bg-debit";
  const amt = color === "credit" ? "text-credit" : "text-debit";
  return (
    <div className="flex items-center gap-3 py-2">
      <span className={`h-9 w-9 rounded-xl ${dot} grid place-items-center text-sm font-bold text-white`}>
        {name[0]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold leading-tight">{name}</div>
        <div className="text-xs text-inksoft">{note}</div>
      </div>
      <div className={`text-sm font-bold tabular-nums ${amt}`}>{amount}</div>
    </div>
  );
}
