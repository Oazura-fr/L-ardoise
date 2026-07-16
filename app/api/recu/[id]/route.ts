import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { euros, enLettres } from "@/lib/montant";

export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-explicit-any */

function frDate(d: string | null): string {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${day} ${mois[m - 1]} ${y}`;
}
function clean(s: string): string {
  return s.replace(/[   ​‑⁠]/g, " ").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-");
}
function nameOf(profile: any, contact: any): string {
  if (profile) return `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  return contact?.first_name || "—";
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ error: "indisponible" }, { status: 503 });

  const { data: rep } = await supabaseAdmin
    .from("repayments").select("id, ack_id, amount_cents, method, paid_on, created_at")
    .eq("id", params.id).single();
  if (!rep) return NextResponse.json({ error: "introuvable" }, { status: 404 });

  const { data: ack } = await supabaseAdmin
    .from("acknowledgments")
    .select("amount_cents, loan_date, motif, creditor_user_id, debtor_user_id, repayments(amount_cents, created_at), creditor_contact:contacts!creditor_contact_id(first_name), debtor_contact:contacts!debtor_contact_id(first_name), creditor_profile:profiles!creditor_user_id(first_name,last_name), debtor_profile:profiles!debtor_user_id(first_name,last_name)")
    .eq("id", rep.ack_id).single();
  if (!ack) return NextResponse.json({ error: "introuvable" }, { status: 404 });

  const a = ack as any;
  const r = rep as any;
  const creditor = nameOf(a.creditor_profile, a.creditor_contact);
  const debtor = nameOf(a.debtor_profile, a.debtor_contact);

  // Restant dû après CE versement (remboursements jusqu'à celui-ci inclus).
  const upTo = ((a.repayments || []) as any[])
    .filter((x) => (x.created_at || "") <= (r.created_at || ""))
    .reduce((s, x) => s + x.amount_cents, 0);
  const remainingAfter = a.amount_cents - upTo;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const ink = rgb(0.11, 0.1, 0.18);
  const grey = rgb(0.42, 0.41, 0.44);
  const M = 60;
  const W = 595.28 - M * 2;
  let y = 780;

  const wrap = (text: string, f: PDFFont, size: number): string[] => {
    const words = clean(text).split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (f.widthOfTextAtSize(test, size) > W) { if (line) lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };
  const para = (text: string, f: PDFFont, size: number, color = ink, gap = 6, lh = 16) => {
    for (const l of wrap(text, f, size)) { page.drawText(l, { x: M, y, size, font: f, color }); y -= lh; }
    y -= gap;
  };
  const center = (text: string, f: PDFFont, size: number, color = ink) => {
    const t = clean(text);
    const w = f.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (595.28 - w) / 2, y, size, font: f, color });
  };

  center("REÇU DE REMBOURSEMENT", bold, 15);
  y -= 8;
  page.drawLine({ start: { x: 255, y }, end: { x: 340, y }, thickness: 1.5, color: ink });
  y -= 28;

  para(`Je soussigné(e) ${creditor}, reconnais avoir reçu de ${debtor} la somme de ${euros(r.amount_cents)} (${enLettres(Math.floor(r.amount_cents / 100))} euros), réglée par ${r.method}, le ${frDate(r.paid_on)}.`, font, 12);
  para(`Ce versement vient en remboursement de la reconnaissance de dette établie le ${frDate(a.loan_date)}${a.motif ? ` (au titre de : ${a.motif})` : ""}.`, font, 12);

  y -= 6;
  page.drawRectangle({ x: M, y: y - 44, width: W, height: 44, color: rgb(0.95, 0.95, 0.92) });
  page.drawText(clean(`Restant dû après ce versement : ${euros(remainingAfter)}`), { x: M + 12, y: y - 22, size: 12, font: bold, color: remainingAfter <= 0 ? rgb(0.05, 0.62, 0.51) : ink });
  if (remainingAfter <= 0) page.drawText("Dette intégralement soldée.", { x: M + 12, y: y - 36, size: 10, font, color: rgb(0.05, 0.62, 0.51) });
  y -= 64;

  para(`Fait pour valoir ce que de droit.`, font, 10.5, grey, 6, 14);
  page.drawText("L'Ardoise — reçu de remboursement", { x: M, y: 40, size: 8, font, color: grey });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recu-remboursement.pdf"`,
    },
  });
}
