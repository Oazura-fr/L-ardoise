import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
  const ackId = params.token;

  const { data: ack, error } = await supabaseAdmin
    .from("acknowledgments")
    .select("id, status")
    .eq("id", ackId)
    .single();

  if (error || !ack) {
    return NextResponse.json({ error: "Reconnaissance introuvable" }, { status: 404 });
  }
  if (ack.status === "signee") {
    return NextResponse.json({ ok: true, already: true });
  }

  let identity: Record<string, unknown> = {};
  try {
    identity = await req.json();
  } catch {
    identity = {};
  }

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

  const { error: e2 } = await supabaseAdmin
    .from("signatures")
    .insert({ ack_id: ackId, type: "lien_otp", proof });

  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }
  // le trigger on_signature passe la reconnaissance en 'signee'
  return NextResponse.json({ ok: true });
}
