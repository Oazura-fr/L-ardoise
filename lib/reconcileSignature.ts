import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isSignatureDone } from "@/lib/yousign";
import { notifySigned } from "@/lib/notifySigned";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Réconcilie l'état d'une signature avancée avec Yousign.
 * Idempotent : insère la signature eIDAS (→ statut "signee" via trigger) une seule fois,
 * puis notifie les deux parties par email (une seule fois via signed_notified_at).
 * Sert de secours au webhook (utile car le webhook Sandbox ne se crée qu'à la main).
 */
export async function reconcileYousign(ackId: string, requestId: string, origin?: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  let done = false;
  try {
    done = (await isSignatureDone(requestId)).done;
  } catch {
    return false;
  }
  if (!done) return false;

  const { data: existing } = await supabaseAdmin
    .from("signatures")
    .select("id")
    .eq("ack_id", ackId)
    .eq("type", "eidas_avancee")
    .limit(1);
  if (existing && existing.length) return true;

  // Identité du signataire capturée au moment de la demande (SignForm → /api/signer).
  const { data: ackRow } = await supabaseAdmin
    .from("acknowledgments").select("signer_identity").eq("id", ackId).single();
  const signataire = (ackRow as any)?.signer_identity || null;

  await supabaseAdmin.from("signatures").insert({
    ack_id: ackId,
    type: "eidas_avancee",
    proof: {
      via: "yousign",
      provider: "yousign",
      signature_request_id: requestId,
      signed_at: new Date().toISOString(),
      ...(signataire ? { signataire } : {}),
    },
  });

  if (origin) await notifySigned(ackId, origin);
  return true;
}
