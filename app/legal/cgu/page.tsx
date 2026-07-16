import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions d'utilisation — L'Ardoise" };

export default function CGU() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <a href="/" className="text-sm font-semibold text-accent">← Accueil</a>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Conditions d&apos;utilisation</h1>
      <p className="mt-2 text-sm text-inksoft">Dernière mise à jour : juillet 2026 · <i>Modèle à faire valider par un juriste avant le lancement.</i></p>

      <div className="mt-6 flex flex-col gap-6 text-[15px] leading-relaxed text-ink">
        <Section title="1. Objet du service">
          L&apos;Ardoise est un outil permettant à des particuliers de <b>formaliser et suivre des reconnaissances de dette</b>
          entre proches (créer un document, le faire signer, suivre les remboursements, envoyer des rappels).
        </Section>
        <Section title="2. Ce que L'Ardoise n'est pas">
          L&apos;Ardoise <b>n&apos;est pas un établissement de crédit ni de paiement</b>. Nous ne prêtons pas d&apos;argent,
          nous ne détenons pas les fonds et nous n&apos;intervenons pas dans les transferts d&apos;argent entre utilisateurs.
          Les prêts sont conclus directement entre les parties, sous leur seule responsabilité.
        </Section>
        <Section title="3. Valeur des documents">
          Les reconnaissances et reçus générés sont fournis comme <b>outils</b>. Leur portée juridique dépend du respect des
          mentions légales et de la qualité de la signature choisie. Pour les montants importants, la signature électronique
          avancée (eIDAS) et l&apos;avis d&apos;un professionnel sont recommandés. Tu es responsable de l&apos;exactitude des
          informations saisies.
        </Section>
        <Section title="4. Ton compte">
          Tu t&apos;engages à fournir des informations exactes (identité, coordonnées) et à préserver la confidentialité de
          tes identifiants. Tu peux supprimer ton compte à tout moment.
        </Section>
        <Section title="5. Tarifs">
          Le suivi et la signature par lien sont gratuits. Certaines options (signature électronique avancée, envois
          automatiques, offres Premium) peuvent être payantes ; leur prix est indiqué avant toute validation.
        </Section>
        <Section title="6. Responsabilité">
          Nous mettons tout en œuvre pour assurer la disponibilité et la sécurité du service, sans garantie d&apos;absence
          d&apos;interruption. Notre responsabilité ne saurait être engagée pour les litiges ou impayés entre utilisateurs.
        </Section>
        <Section title="7. Droit applicable">
          Les présentes conditions sont soumises au droit français. Tout litige relève des tribunaux compétents.
        </Section>
      </div>

      <p className="mt-10 text-sm text-inksoft"><a href="/legal/confidentialite" className="font-semibold text-accent">Politique de confidentialité →</a></p>
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
