import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail, brandedEmail, brevoConfigured } from "@/lib/brevo";
import { euros } from "@/lib/montant";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Envoie le PDF de reconnaissance signé aux deux parties (créancier + emprunteur).
 * Idempotent : "réclame" la notification via un UPDATE conditionnel sur signed_notified_at
 * (une seule exécution gagne, même si le webhook ET la synchro se déclenchent).
 */
export async function notifySigned(ackId: string, origin: string): Promise<void> {
  if (!supabaseAdmin || !brevoConfigured) return;

  // Réservation atomique : un seul appelant passe.
  const { data: claimed } = await supabaseAdmin
    .from("acknowledgments")
    .update({ signed_notified_at: new Date().toISOString() })
    .eq("id", ackId)
    .is("signed_notified_at", null)
    .select("id");
  if (!claimed || !claimed.length) return;

  const { data: ack } = await supabaseAdmin
    .from("acknowledgments")
    .select("id, amount_cents, motif, creditor_profile:profiles!creditor_user_id(email,first_name), debtor_profile:profiles!debtor_user_id(email,first_name), creditor_contact:contacts!creditor_contact_id(email,first_name), debtor_contact:contacts!debtor_contact_id(email,first_name)")
    .eq("id", ackId)
    .single();
  if (!ack) return;
  const a = ack as any;

  const { data: sig } = await supabaseAdmin
    .from("signatures").select("proof").eq("ack_id", ackId)
    .order("signed_at", { ascending: false }).limit(1).maybeSingle();
  const signataire = (sig as any)?.proof?.signataire || {};

  const creditorEmail = a.creditor_profile?.email || a.creditor_contact?.email || null;
  const creditorName = a.creditor_profile?.first_name || a.creditor_contact?.first_name || "le prêteur";
  const debtorEmail = a.debtor_profile?.email || signataire.email || a.debtor_contact?.email || null;
  const debtorName = a.debtor_profile?.first_name || signataire.first_name || a.debtor_contact?.first_name || "l'emprunteur";

  // PDF signé en pièce jointe
  let attachments: { name: string; content: string }[] | undefined;
  try {
    const res = await fetch(`${origin}/api/pdf/${ackId}`);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      attachments = [{ name: "reconnaissance-lardoise.pdf", content: buf.toString("base64") }];
    }
  } catch { /* on envoie sans PJ si le PDF échoue */ }

  const montant = euros(a.amount_cents);
  const appUrl = `${origin}/r/${ackId}`;

  const jobs: Promise<boolean>[] = [];

  const cardCommon = {
    amount: montant,
    amountLabel: "Reconnaissance signée",
    fromLabel: "Prêteur",
    fromName: creditorName,
    toLabel: "Emprunteur",
    toName: debtorName,
    motif: a.motif || null,
    ctaLabel: "Voir la reconnaissance",
    ctaUrl: appUrl,
  };

  if (creditorEmail) {
    jobs.push(sendEmail({
      to: [{ email: creditorEmail, name: creditorName }],
      subject: `${debtorName} a signé la reconnaissance de ${montant}`,
      html: brandedEmail({
        ...cardCommon,
        heading: "La reconnaissance est signée 🎉",
        bodyHtml: `Bonne nouvelle ${creditorName} : <b>${debtorName}</b> vient de signer électroniquement la reconnaissance. Le document a valeur de preuve — garde-le précieusement, et suis les remboursements quand tu veux sur ton ardoise.`,
        attachmentNote: "Le PDF signé (valeur de preuve) est en <b>pièce jointe</b>.",
      }),
      attachments,
    }));
  }

  if (debtorEmail && debtorEmail !== creditorEmail) {
    jobs.push(sendEmail({
      to: [{ email: debtorEmail, name: debtorName }],
      subject: `Ta signature est enregistrée — reconnaissance de ${montant}`,
      html: brandedEmail({
        ...cardCommon,
        heading: "Merci, ta signature est enregistrée ✅",
        bodyHtml: `${debtorName}, ta signature de la reconnaissance envers <b>${creditorName}</b> est bien enregistrée. Voici <b>ton exemplaire</b>. Quand tu rembourses (même en plusieurs fois), tout est suivi automatiquement — pas de mauvaise surprise entre vous.`,
        attachmentNote: "Ton exemplaire signé est en <b>pièce jointe</b>.",
      }),
      attachments,
    }));
  }

  await Promise.allSettled(jobs);
}
