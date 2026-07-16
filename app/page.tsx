import { ArrowRight, Check, Share2, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* Blobs décoratifs */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-[38rem] -left-24 h-96 w-96 rounded-full bg-credit/15 blur-3xl" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate2 font-display text-2xl font-bold text-chalk shadow-card">
            €
          </div>
          <span className="font-display text-xl font-bold tracking-tight">L&apos;Ardoise</span>
        </div>
        <a
          href="#creer"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Créer mon ardoise
        </a>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pb-8 pt-8 sm:px-8 md:grid-cols-2 md:pt-14">
        <div className="animate-fadeup">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-semibold text-inksoft">
            <Sparkles size={13} className="text-accent" /> L&apos;appli des potes qui se prêtent
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
              id="creer"
              href="#"
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
            src="/hero.png"
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
          <span className="flex items-center gap-2"><Check size={16} className="text-credit" /> Signature eIDAS dès 500 €</span>
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
            img="/feat-sign.png"
            title="Signée par lien"
            text="Ton proche signe en un clic depuis un lien, sans installer l'app. C'est gratuit et ça prend 10 secondes."
          />
          <Feature
            img="/feat-relance.png"
            title="Relances sans malaise"
            text="L'app relance à ta place, gentiment, à l'échéance : par notification et par email. Fini le SMS gênant."
          />
          <Feature
            img="/feat-preuve.png"
            title="Une vraie preuve"
            text="Montant en toutes lettres, date, horodatage. Au-dessus de 500 €, signature électronique opposable."
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
              href="#"
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
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
                  <Share2 size={14} /> Partager
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
            Prête, emprunte, et reste ami. La première ardoise est gratuite.
          </p>
          <a
            href="#"
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
          <span>Fait avec ❤️ pour les potes honnêtes.</span>
        </div>
      </footer>
    </main>
  );
}

function Feature({ img, title, text }: { img: string; title: string; text: string }) {
  return (
    <div className="text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" className="mx-auto h-40 w-40 object-contain" />
      <h3 className="mt-2 font-display text-xl font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-inksoft">{text}</p>
    </div>
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
