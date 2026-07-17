import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { phoneKey } from "@/lib/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Reconnaît un proche déjà inscrit à partir de son numéro, et (si ackId est
 * fourni) rattache la reconnaissance à son compte DÈS LA CRÉATION.
 *
 * Pourquoi ici et pas à la signature : rattacher au moment de signer est trop
 * tard — le proche doit voir la reconnaissance arriver dans son ardoise avant
 * même de signer. C'est ça qui rend l'outil fluide.
 *
 * Confidentialité : on ne renvoie que « ce numéro a un compte » + le prénom, à
 * un utilisateur connecté qui connaît déjà le numéro (il vient de le saisir).
 * Jamais d'email, d'adresse, ni d'id de compte.
 */
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ onApp: false });

  // Appelant authentifié obligatoire (évite d'exposer un annuaire de numéros).
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  const me = auth?.user?.id;
  if (!me) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const key = phoneKey(body.phone);
  if (!key) return NextResponse.json({ onApp: false });

  // Recherche du compte correspondant au numéro
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id, first_name, phone");
  const match = (profiles || []).find((p: any) => phoneKey(p.phone) === key && p.id !== me);
  if (!match) return NextResponse.json({ onApp: false });

  let linked = false;
  if (body.ackId) {
    const { data: ack } = await supabaseAdmin
      .from("acknowledgments")
      .select("id, creator_id, creditor_user_id, creditor_contact_id, debtor_user_id, debtor_contact_id")
      .eq("id", body.ackId).single();
    const a = ack as any;
    // On ne rattache que sa propre création, et seulement le côté encore vide.
    if (a && a.creator_id === me) {
      const patch: Record<string, string> = {};
      if (!a.debtor_user_id && a.debtor_contact_id && a.creditor_user_id === me) patch.debtor_user_id = match.id;
      else if (!a.creditor_user_id && a.creditor_contact_id && a.debtor_user_id === me) patch.creditor_user_id = match.id;
      if (Object.keys(patch).length) {
        await supabaseAdmin.from("acknowledgments").update(patch).eq("id", body.ackId);
        const contactId = patch.debtor_user_id ? a.debtor_contact_id : a.creditor_contact_id;
        if (contactId) await supabaseAdmin.from("contacts").update({ linked_user_id: match.id }).eq("id", contactId);
        linked = true;
      }
    }
  }

  return NextResponse.json({ onApp: true, first_name: match.first_name, linked });
}
