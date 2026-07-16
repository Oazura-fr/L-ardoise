import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isSignatureDone } from "@/lib/yousign";
import { reconcileYousign } from "@/lib/reconcileSignature";

export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Yousign appelle cette URL quand une demande de signature évolue.
// On ne fait confiance qu'à l'état réel côté Yousign (re-fetch via isSignatureDone),
// jamais aux données brutes du payload.
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false }, { status: 503 });

  let payload: any = {};
  try { payload = await req.json(); } catch { payload = {}; }

  const sr = payload?.data?.signature_request ?? payload?.signature_request ?? {};
  const srId: string | undefined = sr.id;
  if (!srId) return NextResponse.json({ ok: true, ignored: "no_signature_request_id" });

  let done = false;
  let ackId: string | null = null;
  try {
    const check = await isSignatureDone(srId);
    done = check.done;
    ackId = check.external_id;
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "yousign" }, { status: 502 });
  }

  if (!done || !ackId) return NextResponse.json({ ok: true, done, ackId });

  const signed = await reconcileYousign(ackId, srId);
  return NextResponse.json({ ok: true, signed });
}
