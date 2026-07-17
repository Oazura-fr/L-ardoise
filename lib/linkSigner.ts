import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* eslint-disable @typescript-eslint/no-explicit-any */

function digits(p?: string | null): string | null {
  if (!p) return null;
  let d = p.replace(/\D/g, "");
  if (d.startsWith("33")) d = "0" + d.slice(2);
  return d.length >= 9 ? d.slice(-9) : null; // 9 derniers chiffres = comparable 06.. / +33..
}

/**
 * Rattache le signataire à son compte L'Ardoise.
 *
 * Sans ça, une reconnaissance signée reste liée à un simple *contact* : le
 * signataire ne la voit JAMAIS dans son ardoise (la policy SELECT exige
 * auth.uid() in (creator_id, creditor_user_id, debtor_user_id)).
 *
 * On garde le contact (affichage côté créateur) ET on pose l'id du compte :
 * la contrainte one_debtor/one_creditor accepte désormais les deux.
 */
export async function linkSignerToAccount(ackId: string, email?: string | null, phone?: string | null): Promise<boolean> {
  if (!supabaseAdmin || (!email && !phone)) return false;

  // Le compte du signataire existe-t-il déjà ?
  let profile: any = null;
  if (email) {
    const { data } = await supabaseAdmin
      .from("profiles").select("id, email, phone").ilike("email", email.trim()).maybeSingle();
    profile = data;
  }
  if (!profile && phone) {
    const d = digits(phone);
    if (d) {
      const { data } = await supabaseAdmin.from("profiles").select("id, email, phone");
      profile = (data || []).find((p: any) => digits(p.phone) === d) || null;
    }
  }
  if (!profile) return false; // pas (encore) de compte → rattrapé à l'inscription

  const { data: ack } = await supabaseAdmin
    .from("acknowledgments")
    .select("id, creator_id, creditor_user_id, creditor_contact_id, debtor_user_id, debtor_contact_id")
    .eq("id", ackId).single();
  if (!ack) return false;
  const a = ack as any;

  // Le signataire est la partie qui n'est pas le créateur.
  const patch: Record<string, string> = {};
  if (!a.debtor_user_id && a.debtor_contact_id && a.creditor_user_id && a.creditor_user_id !== profile.id) {
    patch.debtor_user_id = profile.id;
  } else if (!a.creditor_user_id && a.creditor_contact_id && a.debtor_user_id && a.debtor_user_id !== profile.id) {
    patch.creditor_user_id = profile.id;
  }
  if (!Object.keys(patch).length) return false;

  await supabaseAdmin.from("acknowledgments").update(patch).eq("id", ackId);
  // On mémorise aussi le lien dans le carnet d'adresses du créateur.
  const contactId = patch.debtor_user_id ? a.debtor_contact_id : a.creditor_contact_id;
  if (contactId) await supabaseAdmin.from("contacts").update({ linked_user_id: profile.id }).eq("id", contactId);
  return true;
}
