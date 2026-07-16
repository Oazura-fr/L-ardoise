import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité — L'Ardoise" };

export default function Confidentialite() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <a href="/" className="text-sm font-semibold text-accent">← Accueil</a>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-inksoft">Dernière mise à jour : juillet 2026 · <i>Modèle à faire valider par un juriste avant le lancement.</i></p>

      <div className="mt-6 flex flex-col gap-6 text-[15px] leading-relaxed text-ink">
        <Section title="1. Responsable du traitement">
          L&apos;Ardoise (à compléter : raison sociale, SIREN, adresse de l&apos;éditeur). Pour toute question :
          <b> confidentialite@lardoise.fr</b> (adresse à créer).
        </Section>
        <Section title="2. Données que nous collectons">
          <ul className="ml-5 list-disc space-y-1">
            <li><b>Identité</b> : prénom, nom, date de naissance, adresse.</li>
            <li><b>Contact</b> : adresse email, numéro de mobile, photo de profil (facultative).</li>
            <li><b>Reconnaissances de dette</b> : montants, moyens de paiement, dates, motifs, identité des parties, remboursements.</li>
            <li><b>Signatures</b> : horodatage, faisceau de preuves (adresse IP, navigateur, identité du signataire).</li>
            <li><b>Techniques</b> : données de connexion et de session.</li>
          </ul>
        </Section>
        <Section title="3. Finalités et base légale">
          Ces données servent à fournir le service (créer et suivre les reconnaissances, permettre la signature, calculer les
          soldes, envoyer des rappels), à authentifier ton compte et à sécuriser le service. La base légale est
          l&apos;<b>exécution du contrat</b> (nos conditions d&apos;utilisation) et, le cas échéant, ton <b>consentement</b>.
        </Section>
        <Section title="4. Destinataires et sous-traitants">
          Tes données sont hébergées dans l&apos;Union européenne (Supabase, région Paris) et servies via Vercel. Selon les
          fonctionnalités activées, nous faisons appel à des prestataires : envoi d&apos;emails/SMS (Brevo), signature
          électronique (Yousign), paiement (Stripe). Nous ne vendons jamais tes données.
        </Section>
        <Section title="5. Durée de conservation">
          Tes données sont conservées tant que ton compte est actif, puis archivées le temps requis pour la valeur probante
          des reconnaissances et le respect de nos obligations légales, avant suppression.
        </Section>
        <Section title="6. Tes droits (RGPD)">
          Tu disposes d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de portabilité, de limitation et
          d&apos;opposition. Tu peux les exercer depuis ton profil ou en écrivant à l&apos;adresse ci-dessus. Tu peux aussi
          saisir la CNIL.
        </Section>
        <Section title="7. Cookies">
          Nous utilisons uniquement les cookies/stockage nécessaires à ton authentification et au fonctionnement du service.
          Aucun cookie publicitaire.
        </Section>
      </div>

      <p className="mt-10 text-sm text-inksoft"><a href="/legal/cgu" className="font-semibold text-accent">Conditions d&apos;utilisation →</a></p>
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
