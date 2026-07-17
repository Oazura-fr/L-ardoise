/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions d'utilisation — L'Ardoise" };

export default function CGU() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <a href="/" className="text-sm font-semibold text-accent">← Accueil</a>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Conditions d'utilisation</h1>
      <p className="mt-2 text-sm text-inksoft">Dernière mise à jour : juillet 2026 · <i>Modèle à compléter et à faire valider par un juriste avant le lancement.</i></p>

      <div className="mt-6 flex flex-col gap-6 text-[15px] leading-relaxed text-ink">
        <Section title="1. Objet du service">
          L'Ardoise est un outil permettant à des particuliers de <b>formaliser et suivre des reconnaissances de dette</b>
          entre proches : créer un document, le faire signer, suivre les remboursements, envoyer des rappels. En utilisant
          le service, tu acceptes les présentes conditions.
        </Section>
        <Section title="2. Éditeur">
          Le service est édité par l'éditeur identifié dans les{" "}
          <a href="/legal/mentions" className="font-semibold text-accent">mentions légales</a>.
        </Section>
        <Section title="3. Ce que L'Ardoise n'est pas">
          L'Ardoise <b>n'est pas un établissement de crédit ni de paiement</b>. Nous ne prêtons pas d'argent, ne détenons
          pas les fonds et n'intervenons pas dans les transferts d'argent entre utilisateurs. Les prêts sont conclus
          <b> directement entre les parties</b>, sous leur seule responsabilité. L'Ardoise ne fournit ni conseil juridique,
          ni conseil financier.
        </Section>
        <Section title="4. Ton compte">
          Le service est réservé aux personnes <b>majeures</b>. Tu t'engages à fournir des informations exactes (identité,
          coordonnées) et à préserver la confidentialité de tes identifiants. Tu peux supprimer ton compte à tout moment.
        </Section>
        <Section title="5. Données concernant un proche">
          Lorsque tu renseignes les informations d'un tiers (le prêteur ou l'emprunteur), tu <b>garantis</b> être en droit
          de le faire, que ces informations sont exactes et que tu es autorisé à les partager sur le service. Tu es seul
          responsable des données que tu saisis.
        </Section>
        <Section title="6. Valeur des documents">
          Les reconnaissances et reçus générés sont fournis comme <b>outils</b>. Leur portée juridique dépend du respect des
          mentions légales applicables et de la qualité de la signature choisie. Pour les montants importants, la signature
          électronique avancée (eIDAS) et l'avis d'un professionnel sont recommandés. Tu es responsable de l'exactitude des
          informations saisies.
        </Section>
        <Section title="7. Tarifs et rétractation">
          Le suivi et la signature par lien sont gratuits. Certaines options (signature électronique avancée, envois
          automatiques, offres Premium) peuvent être payantes ; leur prix est indiqué avant toute validation. Pour ces
          services numériques exécutés immédiatement à ta demande, tu reconnais que ton droit de rétractation de 14 jours
          peut ne plus s'appliquer une fois l'exécution commencée avec ton accord.
        </Section>
        <Section title="8. Propriété intellectuelle">
          La marque, le nom, le logo, les illustrations et l'interface de L'Ardoise sont protégés et restent notre propriété.
          Les documents que tu génères t'appartiennent.
        </Section>
        <Section title="9. Responsabilité">
          Nous mettons tout en œuvre pour assurer la disponibilité et la sécurité du service, sans garantie d'absence
          d'interruption. Notre responsabilité ne saurait être engagée pour les litiges, retards ou impayés entre
          utilisateurs, ni pour un usage non conforme du service.
        </Section>
        <Section title="10. Suspension et résiliation">
          Nous pouvons suspendre ou fermer un compte en cas de manquement aux présentes conditions ou d'usage frauduleux.
          Tu peux résilier à tout moment en supprimant ton compte.
        </Section>
        <Section title="11. Médiation de la consommation">
          Conformément au Code de la consommation, en cas de litige tu peux recourir gratuitement à un médiateur de la
          consommation. Le médiateur compétent sera précisé ici <b>[à compléter]</b>.
        </Section>
        <Section title="12. Droit applicable et modifications">
          Les présentes conditions sont soumises au <b>droit français</b>. Nous pouvons les faire évoluer ; la version
          applicable est celle en ligne au moment de ton utilisation. Si une clause était jugée invalide, les autres
          resteraient applicables.
        </Section>
      </div>

      <p className="mt-10 text-sm text-inksoft">
        <a href="/legal/confidentialite" className="font-semibold text-accent">Politique de confidentialité</a>{" · "}
        <a href="/legal/mentions" className="font-semibold text-accent">Mentions légales</a>
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
