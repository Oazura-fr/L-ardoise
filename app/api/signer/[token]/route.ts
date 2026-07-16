import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignatureLink, yousignConfigured } from "@/lib/yousign";

export const runtime = "nodejs";

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
  const ackId = params.token;

  const { data: ack, error } = await supabaseAdmin
    .from("acknowledgments")
    .select("id, status, signature_required, motif, debtor_contact:contacts!debtor_contact_id(phone), creditor_contact:contacts!creditor_contact_id(phone)")
    .eq("id", ackId)
    .single();
  if (error || !ack) return NextResponse.json({ error: "Reconnaissance introuvable" }, { status: 404 });
  if (ack.status === "signee") return NextResponse.json({ ok: true, already: true });

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
      await supabaseAdmin.from("acknowledgments").update({ yousign_request_id: requestId }).eq("id", ackId);
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
    },
  };
  const { error: e2 } = await supabaseAdmin.from("signatures").insert({ ack_id: ackId, type: "lien_otp", proof });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
