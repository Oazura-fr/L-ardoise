import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignatureLink, yousignConfigured } from "@/lib/yousign";
import { notifySigned } from "@/lib/notifySigned";
import { linkSignerToAccount } from "@/lib/linkSigner";

export const runtime = "nodejs";

// Le jeton de signature n'est PAS un UUID : comparer id.eq.<jeton> fait echouer
// toute la requete PostgREST. On choisit donc la colonne selon la forme de la cle.
const EST_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* eslint-disable @typescript-eslint/no-explicit-any */

function toE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "33" + d.slice(1);
  if (!d.startsWith("33")) return null;
  return "+" + d;
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  // Le lien porte un jeton SECRET (sign_token). On accepte encore l'id pour les
  // liens deja partages, mais le jeton est desormais la voie normale.
  const key = params.token;
  const { data: ack, error } = await supabaseAdmin
    .from("acknowledgments")
    .select("id, status, signature_required, motif, creator_id, sign_expires_at, debtor_contact:contacts!debtor_contact_id(phone), creditor_contact:contacts!creditor_contact_id(phone)")
    .eq(EST_UUID.test(key) ? "id" : "sign_token", key)
    .maybeSingle();
  if (error || !ack) return NextResponse.json({ error: "Reconnaissance introuvable" }, { status: 404 });
  const ackId = (ack as any).id;
  if (ack.status === "signee") return NextResponse.json({ ok: true, already: true });

  // Lien expire : on ne signe plus.
  const exp = (ack as any).sign_expires_at;
  if (exp && new Date(exp) < new Date()) {
    return NextResponse.json({ error: "Ce lien de signature a expiré. Demande à ton proche de t'en renvoyer un." }, { status: 410 });
  }

  // AUTO-SIGNATURE INTERDITE : le createur ne peut pas signer a la place de son
  // proche (sinon il fabrique une dette contre quelqu'un qui n'a rien signe).
  const authz = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (authz) {
    const { data: auth } = await supabaseAdmin.auth.getUser(authz);
    if (auth?.user?.id && auth.user.id === (ack as any).creator_id) {
      return NextResponse.json({ error: "Tu ne peux pas signer une reconnaissance que tu as créée toi-même." }, { status: 403 });
    }
  }

  let identity: Record<string, any> = {};
  try { identity = await req.json(); } catch { identity = {}; }

  // --- Signature avancée eIDAS → Yousign ---
  if (ack.signature_required === "eidas_avancee" && yousignConfigured) {
    if (!identity.email) return NextResponse.json({ error: "Email requis pour la signature avancée." }, { status: 400 });
    try {
      const pdfRes = await fetch(new URL(`/api/pdf/${ackId}`, req.url));
      const pdf = new Uint8Array(await pdfRes.arrayBuffer());
      const a = ack as any;
      const phone = toE164(a.debtor_contact?.phone || a.creditor_contact?.phone);
      const { link, requestId } = await createSignatureLink({
        ackId,
        name: `Reconnaissance de dette${ack.motif ? " — " + ack.motif : ""}`,
        pdf,
        signer: {
          first_name: identity.first_name || "",
          last_name: identity.last_name || "",
          email: identity.email,
          phone_number: phone,
        },
      });
      // On mémorise l'identité du signataire (dont l'email) pour la notification + le PDF signé.
      await supabaseAdmin.from("acknowledgments").update({
        yousign_request_id: requestId,
        signer_identity: {
          first_name: identity.first_name || null,
          last_name: identity.last_name || null,
          birth_date: identity.birth_date || null,
          address: identity.address || null,
          email: identity.email || null,
          phone: identity.phone || null,
        },
      }).eq("id", ackId);
      return NextResponse.json({ yousign_link: link });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur signature avancée" }, { status: 500 });
    }
  }

  // --- Signature simple par lien (< 200 € ou eIDAS non configuré) ---
  const proof = {
    via: "lien",
    signed_at: new Date().toISOString(),
    user_agent: req.headers.get("user-agent") || null,
    ip: req.headers.get("x-forwarded-for") || null,
    signataire: {
      first_name: identity.first_name || null,
      last_name: identity.last_name || null,
      birth_date: identity.birth_date || null,
      address: identity.address || null,
      email: identity.email || null,
      phone: identity.phone || null,
    },
  };
  const { error: e2 } = await supabaseAdmin.from("signatures").insert({ ack_id: ackId, type: "lien_otp", proof });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  // Rattacher le signataire à son compte : sans ça il ne verra jamais la
  // reconnaissance dans son ardoise (policy SELECT sur les user_id).
  await linkSignerToAccount(ackId, identity.email, identity.phone);
  // Envoi du PDF signé aux deux parties (best-effort, ne bloque pas la réponse).
  await notifySigned(ackId, new URL(req.url).origin);
  return NextResponse.json({ ok: true });
}
