import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isSignatureDone } from "@/lib/yousign";

/**
 * Réconcilie l'état d'une signature avancée avec Yousign.
 * Idempotent : insère la signature eIDAS (→ statut "signee" via trigger) une seule fois.
 * Sert de secours au webhook (utile car le webhook Sandbox ne se crée qu'à la main).
 */
export async function reconcileYousign(ackId: string, requestId: string): Promise<boolean> {
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

  await supabaseAdmin.from("signatures").insert({
    ack_id: ackId,
    type: "eidas_avancee",
    proof: { via: "yousign", provider: "yousign", signature_request_id: requestId, signed_at: new Date().toISOString() },
  });
  return true;
}
