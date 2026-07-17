import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { cleanPdfText as clean } from "@/lib/pdfText";
import { euros, enLettres } from "@/lib/montant";

export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-explicit-any */

function frDate(d: string | null): string {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${day} ${mois[m - 1]} ${y}`;
}
function nameOf(profile: any, contact: any): string {
  if (profile) { const n = `${profile.first_name || ""} ${profile.last_name || ""}`.trim(); if (n) return n; }
  return contact?.first_name || "—";
}

const C = {
  slate: rgb(0x2c / 255, 0x31 / 255, 0x42 / 255),
  ink: rgb(0x1b / 255, 0x1a / 255, 0x2e / 255),
  inksoft: rgb(0x4a / 255, 0x49 / 255, 0x63 / 255),
  accent: rgb(0x4c / 255, 0x3a / 255, 0xe3 / 255),
  accentInk: rgb(0x3a / 255, 0x2b / 255, 0xc0 / 255),
  chalk: rgb(0xf3 / 255, 0xf1 / 255, 0xea / 255),
  line: rgb(0xdf / 255, 0xde / 255, 0xda / 255),
  credit: rgb(0x0e / 255, 0x9e / 255, 0x82 / 255),
  creditInk: rgb(0x0a / 255, 0x6f / 255, 0x5c / 255),
  creditSoft: rgb(0xe2 / 255, 0xf4 / 255, 0xef / 255),
  faint: rgb(0.62, 0.62, 0.66),
  white: rgb(1, 1, 1),
  lightOnDark: rgb(0.78, 0.79, 0.85),
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ error: "indisponible" }, { status: 503 });

  const { data: rep } = await supabaseAdmin
    .from("repayments").select("id, ack_id, amount_cents, method, paid_on, created_at")
    .eq("id", params.id).single();
  if (!rep) return NextResponse.json({ error: "introuvable" }, { status: 404 });

  const { data: ack } = await supabaseAdmin
    .from("acknowledgments")
    .select("id, amount_cents, loan_date, motif, creditor_user_id, debtor_user_id, repayments(amount_cents, created_at), creditor_contact:contacts!creditor_contact_id(first_name), debtor_contact:contacts!debtor_contact_id(first_name), creditor_profile:profiles!creditor_user_id(first_name,last_name), debtor_profile:profiles!debtor_user_id(first_name,last_name)")
    .eq("id", rep.ack_id).single();
  if (!ack) return NextResponse.json({ error: "introuvable" }, { status: 404 });

  const a = ack as any;
  const r = rep as any;
  const creditor = nameOf(a.creditor_profile, a.creditor_contact);
  const debtor = nameOf(a.debtor_profile, a.debtor_contact);

  const upTo = ((a.repayments || []) as any[])
    .filter((x) => (x.created_at || "") <= (r.created_at || ""))
    .reduce((s, x) => s + x.amount_cents, 0);
  const remainingAfter = a.amount_cents - upTo;
  const soldee = remainingAfter <= 0;
  const words = `${enLettres(Math.floor(r.amount_cents / 100))} euros`;

  const pdf = await PDFDocument.create();
  const PW = 595.28, PH = 841.89;
  const page: PDFPage = pdf.addPage([PW, PH]);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);
  const timesB = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const timesI = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const M = 50, CW = PW - M * 2;

  const at = (text: string, x: number, yy: number, f: PDFFont, size: number, color = C.ink) =>
    page.drawText(clean(text), { x, y: yy, size, font: f, color });
  const rightAt = (text: string, xRight: number, yy: number, f: PDFFont, size: number, color = C.ink) => {
    const t = clean(text); page.drawText(t, { x: xRight - f.widthOfTextAtSize(t, size), y: yy, size, font: f, color });
  };
  const centerAt = (text: string, yy: number, f: PDFFont, size: number, color = C.ink) => {
    const t = clean(text); page.drawText(t, { x: (PW - f.widthOfTextAtSize(t, size)) / 2, y: yy, size, font: f, color });
  };
  const spaced = (text: string, x: number, yy: number, f: PDFFont, size: number, color: any, ls: number) => {
    let cx = x; for (const ch of clean(text)) { page.drawText(ch, { x: cx, y: yy, size, font: f, color }); cx += f.widthOfTextAtSize(ch, size) + ls; }
  };
  const wrapW = (text: string, f: PDFFont, size: number, width: number): string[] => {
    const wds = clean(text).split(" "); const lines: string[] = []; let line = "";
    for (const w of wds) { const t = line ? line + " " + w : w; if (f.widthOfTextAtSize(t, size) > width) { if (line) lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  };
  const roundRect = (x: number, topY: number, w: number, h: number, rr: number, opts: { color?: any; borderColor?: any; borderWidth?: number }) => {
    const path = `M ${rr} 0 H ${w - rr} Q ${w} 0 ${w} ${rr} V ${h - rr} Q ${w} ${h} ${w - rr} ${h} H ${rr} Q 0 ${h} 0 ${h - rr} V ${rr} Q 0 0 ${rr} 0 Z`;
    page.drawSvgPath(path, { x, y: topY, color: opts.color, borderColor: opts.borderColor, borderWidth: opts.borderWidth });
  };

  // ===== EN-TÊTE =====
  const hdrH = 98;
  page.drawRectangle({ x: 0, y: PH - hdrH, width: PW, height: hdrH, color: C.slate });
  const lcy = PH - hdrH / 2, ls = 46;
  roundRect(M, lcy + ls / 2, ls, ls, 12, { color: C.accent });
  at("€", M + (ls - helvB.widthOfTextAtSize("€", 26)) / 2, lcy - 9, helvB, 26, C.chalk);
  at("L'Ardoise", M + ls + 15, lcy + 3, timesB, 23, C.white);
  at("l'appli des potes qui se prêtent — et qui se remboursent", M + ls + 16, lcy - 15, helv, 8.5, C.lightOnDark);
  rightAt("REÇU DE REMBOURSEMENT", PW - M, lcy + 4, helvB, 9.5, C.white);
  rightAt(`émis le ${frDate(r.paid_on)}`, PW - M, lcy - 12, helv, 8.5, C.lightOnDark);

  let y = PH - hdrH - 40;

  // ===== TITRE =====
  {
    const raw = "REÇU DE REMBOURSEMENT";
    const total = clean(raw).split("").reduce((s, ch) => s + timesB.widthOfTextAtSize(ch, 17) + 2, -2);
    spaced(raw, (PW - total) / 2, y, timesB, 17, C.ink, 2);
  }
  y -= 10;
  page.drawLine({ start: { x: PW / 2 - 26, y }, end: { x: PW / 2 + 26, y }, thickness: 2, color: C.credit });
  y -= 30;

  // ===== CARTE MONTANT (vert = reçu) =====
  const wl = wrapW(`« ${words} »`, timesI, 11.5, CW - 40);
  const cardH = 66 + (wl.length - 1) * 15;
  roundRect(M, y, CW, cardH, 14, { color: C.creditSoft, borderColor: C.credit, borderWidth: 1 });
  spaced("MONTANT REÇU", M + 20, y - 23, helvB, 8, C.creditInk, 1);
  at(euros(r.amount_cents), M + 20, y - 51, helvB, 27, C.creditInk);
  { let wy = y - 51 + 1; for (const l of wl) { rightAt(l, PW - M - 20, wy, timesI, 11.5, C.inksoft); wy -= 15; } }
  y -= cardH + 26;

  // ===== CORPS =====
  const para = (text: string, f: PDFFont, size: number, color = C.ink, gap = 8, lh = 15.5) => {
    for (const l of wrapW(text, f, size, CW)) { at(l, M, y, f, size, color); y -= lh; }
    y -= gap;
  };
  para(`Je soussigné(e) ${creditor}, reconnais avoir reçu de ${debtor} la somme de ${euros(r.amount_cents)} (${words}), réglée par ${r.method}, le ${frDate(r.paid_on)}.`, helv, 11);
  para(`Ce versement vient en remboursement de la reconnaissance de dette établie le ${frDate(a.loan_date)}${a.motif ? ` (au titre de : ${a.motif})` : ""}.`, helv, 11);

  // ===== CARTE RESTANT DÛ =====
  y -= 2;
  const boxH = soldee ? 58 : 44;
  roundRect(M, y, CW, boxH, 12, { color: soldee ? C.creditSoft : C.chalk, borderColor: soldee ? C.credit : C.line, borderWidth: 1 });
  at("Restant dû après ce versement", M + 18, y - 26, helv, 11, C.inksoft);
  rightAt(euros(remainingAfter), PW - M - 18, y - 27, helvB, 14, soldee ? C.credit : C.ink);
  if (soldee) at("Dette intégralement soldée — merci !", M + 18, y - 44, helvB, 9.5, C.creditInk);
  y -= boxH + 18;

  para("Fait pour valoir ce que de droit.", helv, 9, C.faint, 0, 12);

  // ===== MÉDAILLON =====
  const ftH = 74;
  if (y - ftH > 130) {
    const cyw = (y + ftH) / 2 + 6;
    page.drawCircle({ x: PW / 2, y: cyw + 14, size: 22, color: C.chalk, borderColor: C.line, borderWidth: 1 });
    at("€", PW / 2 - helvB.widthOfTextAtSize("€", 22) / 2, cyw + 6, helvB, 22, C.accent);
    centerAt("l-ardoise.fr", cyw - 22, helvB, 12, C.inksoft);
    centerAt("gardez vos amitiés, pas vos ardoises", cyw - 37, helv, 8.5, C.faint);
  }

  // ===== BANDEAU PUB =====
  page.drawRectangle({ x: 0, y: 0, width: PW, height: ftH, color: C.accent });
  page.drawRectangle({ x: 0, y: ftH, width: PW, height: 3, color: C.accentInk });
  at("Créé gratuitement avec L'Ardoise", M, 46, timesB, 14, C.white);
  {
    const pitch = wrapW("Prêtez, suivez les remboursements et gardez une preuve — sans jamais vous fâcher avec vos proches.", helv, 8.5, CW - 150);
    for (let i = 0; i < pitch.length; i++) at(pitch[i], M, 30 - i * 11, helv, 8.5, rgb(0.9, 0.9, 0.98));
  }
  rightAt("l-ardoise.fr", PW - M, 40, helvB, 16, C.white);
  rightAt("100 % gratuit", PW - M, 24, helv, 9, rgb(0.9, 0.9, 0.98));

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recu-remboursement-lardoise.pdf"`,
    },
  });
}
