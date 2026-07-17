/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import BackLink from "@/components/BackLink";

export const metadata: Metadata = { title: "Politique de confidentialité — L'Ardoise" };

export default function Confidentialite() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <BackLink />
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-inksoft">Dernière mise à jour : juillet 2026 · <i>Modèle à compléter et à faire valider par un juriste avant le lancement.</i></p>

      <div className="mt-6 flex flex-col gap-6 text-[15px] leading-relaxed text-ink">
        <Section title="1. Responsable du traitement">
          Le responsable du traitement est l'éditeur de L'Ardoise (voir les{" "}
          <a href="/legal/mentions" className="font-semibold text-accent">mentions légales</a> — identité à compléter).
          Pour toute question relative à tes données : <b>bonjour@l-ardoise.fr</b>.
        </Section>

        <Section title="2. Données que nous traitons">
          <ul className="ml-5 list-disc space-y-1">
            <li><b>Identité</b> : prénom, nom, date de naissance, adresse.</li>
            <li><b>Contact</b> : adresse email, numéro de mobile, photo de profil (facultative).</li>
            <li><b>Reconnaissances de dette</b> : montants, moyen de paiement, dates, motif, identité des parties, remboursements.</li>
            <li><b>Signature électronique</b> : horodatage et faisceau de preuves (adresse IP, navigateur, identité déclarée du signataire), et, pour la signature avancée, données transmises à notre prestataire de signature.</li>
            <li><b>Données techniques</b> : données de connexion, de session et journaux de sécurité.</li>
          </ul>
          <p className="mt-2">Nous ne traitons pas de données dites « sensibles » (santé, opinions, etc.).</p>
        </Section>

        <Section title="3. Finalités et bases légales">
          <ul className="ml-5 list-disc space-y-1">
            <li><b>Créer ton compte et fournir le service</b> (créer/suivre les reconnaissances, signature, calcul des soldes) — <i>exécution du contrat</i>.</li>
            <li><b>Transmettre la reconnaissance à l'autre partie et gérer la signature</b> — <i>exécution du contrat / intérêt légitime</i>.</li>
            <li><b>Envoyer des rappels et notifications liés à tes reconnaissances</b> — <i>intérêt légitime</i> (tu peux t'y opposer).</li>
            <li><b>Sécuriser le service et prévenir la fraude</b> — <i>intérêt légitime</i>.</li>
            <li><b>Respecter nos obligations légales</b> (conservation, valeur probante) — <i>obligation légale</i>.</li>
            <li><b>Communications non essentielles / marketing</b>, le cas échéant — <i>consentement</i>.</li>
          </ul>
        </Section>

        <Section title="4. Données concernant une autre personne (le proche)">
          Lorsque tu crées une reconnaissance, tu peux saisir les données d'un tiers (le prêteur ou l'emprunteur). En les
          saisissant, tu confirmes être en droit de le faire et d'informer cette personne. Nous informons le tiers de ce
          traitement au moment où il reçoit le lien de signature ou un email, et il dispose des mêmes droits (voir §7).
        </Section>

        <Section title="5. Destinataires et sous-traitants">
          Nous ne vendons jamais tes données. Nous faisons appel à des sous-traitants encadrés par contrat :
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li><b>Supabase</b> — hébergement de la base de données et des fichiers, dans l'Union européenne (région Paris).</li>
            <li><b>Vercel</b> — hébergement et diffusion de l'application (société établie aux États-Unis).</li>
            <li><b>Brevo</b> — envoi des emails (et SMS le cas échéant), société établie en France.</li>
            <li><b>Yousign</b> — signature électronique avancée (eIDAS), société établie en France.</li>
            <li><b>Stripe</b> — le cas échéant, encaissement des options payantes.</li>
          </ul>
        </Section>

        <Section title="6. Transferts hors Union européenne">
          Tes données sont principalement hébergées dans l'UE. Certains prestataires (par ex. Vercel, Stripe) peuvent
          impliquer un transfert hors UE ; ces transferts sont encadrés par des garanties appropriées (clauses
          contractuelles types de la Commission européenne et/ou mécanismes équivalents).
        </Section>

        <Section title="7. Durées de conservation">
          <ul className="ml-5 list-disc space-y-1">
            <li><b>Compte</b> : pendant toute la durée d'utilisation, puis suppression après une période d'inactivité prolongée.</li>
            <li><b>Reconnaissances et preuves de signature</b> : conservées pour leur valeur probante, en principe jusqu'à 5 ans après le solde ou l'échéance (délai de prescription civile), sauf litige en cours.</li>
            <li><b>Journaux de connexion</b> : conservés conformément à la réglementation (généralement 12 mois).</li>
          </ul>
        </Section>

        <Section title="8. Sécurité">
          Accès chiffrés (HTTPS), cloisonnement des données par compte, stockage des fichiers en accès restreint,
          hébergement dans l'UE et sous-traitants sélectionnés pour leurs garanties. Aucun système n'étant infaillible,
          nous t'invitons à protéger tes identifiants.
        </Section>

        <Section title="9. Tes droits (RGPD)">
          Tu disposes des droits d'<b>accès</b>, de <b>rectification</b>, d'<b>effacement</b>, de <b>portabilité</b>, de
          <b> limitation</b> et d'<b>opposition</b>, ainsi que du droit de définir des directives post-mortem. Tu peux les
          exercer depuis ton profil ou en écrivant à <b>bonjour@l-ardoise.fr</b>. Tu peux aussi introduire une réclamation
          auprès de la CNIL (www.cnil.fr, 3 place de Fontenoy, 75007 Paris).
        </Section>

        <Section title="10. Cookies et stockage">
          Nous utilisons uniquement les cookies et le stockage local <b>strictement nécessaires</b> à ton authentification
          et au fonctionnement du service. Aucun cookie publicitaire ni de suivi tiers à des fins marketing.
        </Section>

        <Section title="11. Mineurs">
          Le service est réservé aux personnes <b>majeures</b> (18 ans et plus). Nous ne collectons pas sciemment de
          données de mineurs.
        </Section>

        <Section title="12. Modifications">
          Cette politique peut évoluer. En cas de changement important, nous t'en informerons par un moyen adapté.
        </Section>
      </div>

      <p className="mt-10 text-sm text-inksoft">
        <a href="/legal/cgu" className="font-semibold text-accent">Conditions d'utilisation</a>{" · "}
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
