/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import BackLink from "@/components/BackLink";

export const metadata: Metadata = { title: "Mentions légales — L'Ardoise" };

export default function Mentions() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <BackLink />
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Mentions légales</h1>
      <p className="mt-2 text-sm text-inksoft">Dernière mise à jour : juillet 2026 · <i>Modèle à compléter et à faire valider par un juriste avant le lancement.</i></p>

      <div className="mt-6 flex flex-col gap-6 text-[15px] leading-relaxed text-ink">
        <Section title="1. Éditeur du site">
          Le site et l'application <b>L'Ardoise</b> (l-ardoise.fr) sont édités par :
          <ul className="ml-5 mt-2 list-disc space-y-1 text-inksoft">
            <li><b>[à compléter]</b> : nom et prénom (si particulier) ou raison sociale et forme juridique (si société).</li>
            <li><b>[à compléter]</b> : capital social (si société), numéro SIREN / RCS, numéro de TVA intracommunautaire le cas échéant.</li>
            <li><b>[à compléter]</b> : adresse du siège / domiciliation.</li>
            <li><b>Contact</b> : bonjour@l-ardoise.fr.</li>
            <li><b>Directeur / directrice de la publication</b> : <b>[à compléter]</b>.</li>
          </ul>
        </Section>
        <Section title="2. Hébergement">
          <b>Application et site</b> : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — vercel.com.
          <br />
          <b>Base de données et fichiers</b> : hébergés dans l'Union européenne (région Paris) via Supabase — supabase.com.
        </Section>
        <Section title="3. Propriété intellectuelle">
          La marque, le nom « L'Ardoise », le logo, les textes, illustrations et l'interface sont protégés. Toute
          reproduction ou réutilisation sans autorisation est interdite. Les documents que tu génères (reconnaissances,
          reçus) t'appartiennent et relèvent de ta responsabilité.
        </Section>
        <Section title="4. Signalement">
          Pour signaler un contenu ou un problème : bonjour@l-ardoise.fr.
        </Section>
      </div>

      <p className="mt-10 text-sm text-inksoft">
        <a href="/legal/cgu" className="font-semibold text-accent">Conditions d'utilisation</a>{" · "}
        <a href="/legal/confidentialite" className="font-semibold text-accent">Politique de confidentialité</a>
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-1.5 text-inksoft">{children}</div>
    </section>
  );
}
