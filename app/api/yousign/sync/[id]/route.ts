import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { reconcileYousign } from "@/lib/reconcileSignature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Secours au webhook : réconcilie l'état d'une signature avancée à la demande
// (appelé au chargement de la reconnaissance tant qu'elle est "à signer").
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ signed: false });
  const ackId = params.id;

  const { data: ack } = await supabaseAdmin
    .from("acknowledgments")
    .select("status, signature_required, yousign_request_id")
    .eq("id", ackId)
    .single();

  if (!ack || ack.status === "signee" || ack.signature_required !== "eidas_avancee" || !ack.yousign_request_id) {
    return NextResponse.json({ signed: ack?.status === "signee" });
  }

  const signed = await reconcileYousign(ackId, ack.yousign_request_id, new URL(req.url).origin);
  return NextResponse.json({ signed });
}
