import { isLive } from "@/lib/supabase";
import { ArrowRight, FileSignature, Bell, ScrollText } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Bandeau d'état (démo vs branché) */}
      <div className="w-full text-center text-xs py-1.5 bg-slate2 text-chalk">
        {isLive
          ? "Supabase branché ✓"
          : "Mode démo — Supabase non configuré (renseigne .env.local)"}
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        {/* Marque */}
        <div className="flex items-center gap-3 mb-14">
          <div className="w-11 h-11 rounded-xl bg-slate2 grid place-items-center text-chalk font-display font-bold text-2xl">
            €
          </div>
          <div>
            <div className="font-display text-xl font-bold">L&apos;Ardoise</div>
            <div className="text-xs text-inksoft">
              Tout est marqué sur l&apos;ardoise. Personne n&apos;oublie.
            </div>
          </div>
        </div>

        {/* Hero */}
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight text-balance">
          Prête à tes proches
          <br />
          sans jamais te fâcher.
        </h1>
        <p className="mt-5 text-lg text-inksoft max-w-xl">
          Une reconnaissance de dette signée en un clic, une échéance, des
          relances qui évitent le malaise. Fun à utiliser, sérieuse sur le fond.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-ink text-white font-semibold px-5 py-3 rounded-xl shadow-card transition-colors"
          >
            Créer ma première ardoise <ArrowRight size={18} />
          </a>
          <a
            href="#comment"
            className="inline-flex items-center gap-2 border border-line bg-card text-ink font-semibold px-5 py-3 rounded-xl"
          >
            Comment ça marche
          </a>
        </div>

        {/* Piliers */}
        <div id="comment" className="mt-20 grid sm:grid-cols-3 gap-4">
          <Feature
            icon={<FileSignature size={20} />}
            title="Signée par lien"
            text="Ton proche signe en un clic, sans installer l'app. Gratuit."
          />
          <Feature
            icon={<Bell size={20} />}
            title="Relances sans malaise"
            text="Rappels automatiques à l'échéance : push et email."
          />
          <Feature
            icon={<ScrollText size={20} />}
            title="Preuve opposable"
            text="Montant en toutes lettres, date, horodatage. eIDAS au-dessus de 500 €."
          />
        </div>

        <p className="mt-20 text-xs text-inksoft">
          Projet en construction — étape actuelle : socle technique (Next.js +
          Supabase).
        </p>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-card border border-line rounded-2xl p-5 shadow-card">
      <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent grid place-items-center">
        {icon}
      </div>
      <div className="mt-3 font-semibold">{title}</div>
      <div className="mt-1 text-sm text-inksoft">{text}</div>
    </div>
  );
}
