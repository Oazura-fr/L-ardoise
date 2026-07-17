import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { euros, ADV_FEE_CENTS } from "@/lib/montant";

export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-explicit-any */

function frDate(d: string | null): string {
  if (!d) return "à première demande";
  const [y, m, day] = d.split("-").map(Number);
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${day} ${mois[m - 1]} ${y}`;
}

// WinAnsi ne code pas les espaces fines/insécables ni les guillemets typographiques → on nettoie.
function clean(s: string): string {
  return s
    .replace(/[   ​‑⁠]/g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-");
}

function idFromParts(p: any, phone?: string | null): string | null {
  if (!p) return null;
  const nom = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  if (!nom) return null;
  const parts = [nom];
  if (p.birth_date) parts.push(`né(e) le ${frDate(p.birth_date)}`);
  if (p.address) parts.push(`demeurant ${p.address}`);
  const tel = p.phone || phone;
  if (tel) parts.push(`tél. ${tel}`);
  return parts.join(", ");
}

// Palette de marque L'Ardoise
const C = {
  slate: rgb(0x2c / 255, 0x31 / 255, 0x42 / 255),
  ink: rgb(0x1b / 255, 0x1a / 255, 0x2e / 255),
  inksoft: rgb(0x4a / 255, 0x49 / 255, 0x63 / 255),
  accent: rgb(0x4c / 255, 0x3a / 255, 0xe3 / 255),
  accentInk: rgb(0x3a / 255, 0x2b / 255, 0xc0 / 255),
  accentSoft: rgb(0xee / 255, 0xec / 255, 0xfd / 255),
  chalk: rgb(0xf3 / 255, 0xf1 / 255, 0xea / 255),
  line: rgb(0xdf / 255, 0xde / 255, 0xda / 255),
  credit: rgb(0x0e / 255, 0x9e / 255, 0x82 / 255),
  creditSoft: rgb(0xe2 / 255, 0xf4 / 255, 0xef / 255),
  amber: rgb(0xe8 / 255, 0x91 / 255, 0x2d / 255),
  amberSoft: rgb(0xfd / 255, 0xf1 / 255, 0xe2 / 255),
  faint: rgb(0.62, 0.62, 0.66),
  white: rgb(1, 1, 1),
  lightOnDark: rgb(0.78, 0.79, 0.85),
};

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ error: "indisponible" }, { status: 503 });

  const { data: ack } = await supabaseAdmin
    .from("acknowledgments")
    .select("id, amount_cents, amount_words, method, loan_date, due_date, motif, status, signature_required, creditor_user_id, debtor_user_id, repayments(amount_cents, method, paid_on, confirmed_at), creditor_contact:contacts!creditor_contact_id(first_name,phone), debtor_contact:contacts!debtor_contact_id(first_name,phone), creditor_profile:profiles!creditor_user_id(first_name,last_name,birth_date,address,phone), debtor_profile:profiles!debtor_user_id(first_name,last_name,birth_date,address,phone)")
    .eq("id", params.token)
    .single();
  if (!ack) return NextResponse.json({ error: "introuvable" }, { status: 404 });

  const a = ack as any;
  const { data: sig } = await supabaseAdmin
    .from("signatures").select("proof, signed_at, type").eq("ack_id", params.token)
    .order("signed_at", { ascending: false }).limit(1).maybeSingle();

  const creditor =
    idFromParts(a.creditor_profile, a.creditor_contact?.phone) ||
    a.creditor_contact?.first_name ||
    "le prêteur";
  const debtor =
    idFromParts(a.debtor_profile, a.debtor_contact?.phone) ||
    idFromParts(sig?.proof?.signataire, a.debtor_contact?.phone) ||
    a.debtor_contact?.first_name ||
    "l'emprunteur";
  const creditorName = creditor.split(",")[0];
  const debtorName = debtor.split(",")[0];

  const isAdv = a.signature_required === "eidas_avancee";
  const fee = isAdv ? ADV_FEE_CENTS : 0;
  const principal = a.amount_cents - fee;
  // Le document ne mentionne que les remboursements attestés par le créancier :
  // une simple déclaration du débiteur n'a aucune valeur probante.
  const reps = ((a.repayments || []) as any[])
    .filter((r) => r.confirmed_at)
    .slice().sort((x, y) => (x.paid_on || "").localeCompare(y.paid_on || ""));
  const repaid = reps.reduce((s, r) => s + r.amount_cents, 0);
  const remaining = a.amount_cents - repaid;
  const signed = a.status === "signee";
  const signedAt = sig?.signed_at ? new Date(sig.signed_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : null;

  const pdf = await PDFDocument.create();
  const PW = 595.28, PH = 841.89;
  const page: PDFPage = pdf.addPage([PW, PH]);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);
  const timesB = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const timesI = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  const M = 50, CW = PW - M * 2;

  // --- helpers de dessin ---
  const at = (text: string, x: number, yy: number, f: PDFFont, size: number, color = C.ink) =>
    page.drawText(clean(text), { x, y: yy, size, font: f, color });
  const rightAt = (text: string, xRight: number, yy: number, f: PDFFont, size: number, color = C.ink) => {
    const t = clean(text); const w = f.widthOfTextAtSize(t, size);
    page.drawText(t, { x: xRight - w, y: yy, size, font: f, color });
  };
  const spaced = (text: string, x: number, yy: number, f: PDFFont, size: number, color: any, ls: number) => {
    let cx = x;
    for (const ch of clean(text)) { page.drawText(ch, { x: cx, y: yy, size, font: f, color }); cx += f.widthOfTextAtSize(ch, size) + ls; }
  };
  const wrapW = (text: string, f: PDFFont, size: number, width: number): string[] => {
    const words = clean(text).split(" ");
    const lines: string[] = []; let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (f.widthOfTextAtSize(test, size) > width) { if (line) lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };
  const roundRect = (x: number, topY: number, w: number, h: number, r: number, opts: { color?: any; borderColor?: any; borderWidth?: number }) => {
    const path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
    page.drawSvgPath(path, { x, y: topY, color: opts.color, borderColor: opts.borderColor, borderWidth: opts.borderWidth });
  };

  // ====================== EN-TÊTE (bandeau ardoise) ======================
  const hdrH = 98;
  page.drawRectangle({ x: 0, y: PH - hdrH, width: PW, height: hdrH, color: C.slate });
  const lcy = PH - hdrH / 2;
  const ls = 46;
  roundRect(M, lcy + ls / 2, ls, ls, 12, { color: C.accent });
  const euroW = helvB.widthOfTextAtSize("€", 26);
  at("€", M + (ls - euroW) / 2, lcy - 9, helvB, 26, C.chalk);
  at("L'Ardoise", M + ls + 15, lcy + 3, timesB, 23, C.white);
  at("l'appli des potes qui se prêtent — et qui se remboursent", M + ls + 16, lcy - 15, helv, 8.5, C.lightOnDark);
  // méta à droite
  const shortId = String(a.id).slice(0, 8).toUpperCase();
  rightAt(`Reconnaissance n° ${shortId}`, PW - M, lcy + 4, helvB, 9.5, C.white);
  rightAt(`établie le ${frDate(a.loan_date)}`, PW - M, lcy - 12, helv, 8.5, C.lightOnDark);

  let y = PH - hdrH - 40;

  // ====================== TITRE ======================
  {
    const raw = "RECONNAISSANCE DE DETTE";
    const chars = clean(raw).split("");
    const total = chars.reduce((s, ch) => s + timesB.widthOfTextAtSize(ch, 17) + 2, -2);
    spaced(raw, (PW - total) / 2, y, timesB, 17, C.ink, 2);
  }
  y -= 10;
  page.drawLine({ start: { x: PW / 2 - 26, y }, end: { x: PW / 2 + 26, y }, thickness: 2, color: C.accent });
  y -= 30;

  // ====================== CARTE MONTANT ======================
  const wordsLines = wrapW(`« ${a.amount_words} »`, timesI, 11.5, CW - 40);
  const cardH = 66 + (wordsLines.length - 1) * 15;
  roundRect(M, y, CW, cardH, 14, { color: C.accentSoft, borderColor: C.accent, borderWidth: 1 });
  spaced("MONTANT DE LA DETTE", M + 20, y - 23, helvB, 8, C.accentInk, 1);
  at(euros(a.amount_cents), M + 20, y - 51, helvB, 27, C.accentInk);
  {
    let wy = y - 51 + 1;
    // aligner les lettres à droite de la carte
    for (const l of wordsLines) { rightAt(l, PW - M - 20, wy, timesI, 11.5, C.inksoft); wy -= 15; }
  }
  y -= cardH + 26;

  // ====================== ENGAGEMENT ======================
  const para = (text: string, f: PDFFont, size: number, color = C.ink, gap = 8, lh = 15.5) => {
    for (const l of wrapW(text, f, size, CW)) { at(l, M, y, f, size, color); y -= lh; }
    y -= gap;
  };
  para(`Je soussigné(e) ${debtor}, reconnais devoir à ${creditor} la somme de ${euros(a.amount_cents)} (${a.amount_words}), qui m'a été remise par ${a.method} en date du ${frDate(a.loan_date)}.`, helv, 11);
  para(`Je m'engage à la rembourser ${a.due_date ? `au plus tard le ${frDate(a.due_date)}` : "à première demande"}${a.motif ? `, au titre de : ${a.motif}` : ""}.`, helv, 11);
  if (isAdv) {
    para(`Dont frais de signature électronique : ${euros(fee)} — soit un principal prêté de ${euros(principal)} pour un total dû de ${euros(a.amount_cents)}.`, helv, 9.5, C.inksoft, 8, 13);
  }

  // ====================== CARTE PARTIES ======================
  y -= 2;
  const credLines = wrapW(creditor, helv, 10.5, CW - 130);
  const debtLines = wrapW(debtor, helv, 10.5, CW - 130);
  const pRowH = 15;
  const partiesH = 30 + credLines.length * pRowH + 8 + debtLines.length * pRowH + 12;
  roundRect(M, y, CW, partiesH, 12, { color: C.white, borderColor: C.line, borderWidth: 1 });
  spaced("LES PARTIES", M + 18, y - 22, helvB, 8, C.faint, 1);
  let py = y - 40;
  // créancier
  page.drawCircle({ x: M + 22, y: py + 3.5, size: 3, color: C.credit });
  at("Créancier", M + 32, py, helvB, 9.5, C.ink);
  at("(a prêté)", M + 32 + helvB.widthOfTextAtSize("Créancier ", 9.5), py, helv, 8.5, C.faint);
  for (let i = 0; i < credLines.length; i++) at(credLines[i], M + 130, py - i * pRowH, helv, 10.5, C.inksoft);
  py -= Math.max(1, credLines.length) * pRowH + 8;
  // débiteur
  page.drawCircle({ x: M + 22, y: py + 3.5, size: 3, color: C.accent });
  at("Débiteur", M + 32, py, helvB, 9.5, C.ink);
  at("(doit)", M + 32 + helvB.widthOfTextAtSize("Débiteur ", 9.5), py, helv, 8.5, C.faint);
  for (let i = 0; i < debtLines.length; i++) at(debtLines[i], M + 130, py - i * pRowH, helv, 10.5, C.inksoft);
  y -= partiesH + 20;

  // ====================== REMBOURSEMENTS ======================
  if (repaid > 0) {
    spaced("SUIVI DES REMBOURSEMENTS", M, y, helvB, 8, C.faint, 1);
    y -= 16;
    for (const r of reps) {
      at(`Le ${frDate(r.paid_on)}`, M + 4, y, helv, 10, C.inksoft);
      at(`(${r.method})`, M + 160, y, helv, 9.5, C.faint);
      rightAt(euros(r.amount_cents), PW - M, y, helv, 10, C.ink);
      y -= 14;
    }
    y -= 4;
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: PW - M, y: y + 4 }, thickness: 0.6, color: C.line });
    y -= 10;
    at(`Déjà remboursé : ${euros(repaid)}`, M + 4, y, helv, 10, C.inksoft);
    rightAt(`Restant dû : ${euros(remaining)}`, PW - M, y, helvB, 11, remaining <= 0 ? C.credit : C.ink);
    y -= 22;
  }

  // ====================== CLAUSE LÉGALE ======================
  for (const l of wrapW("Somme exprimée en chiffres et en toutes lettres. Conformément à l'article 1376 du Code civil, en cas de différence, la somme exprimée en toutes lettres prévaut. Fait pour valoir ce que de droit.", helv, 9, CW)) {
    at(l, M, y, helv, 9, C.faint); y -= 12;
  }
  y -= 12;

  // ====================== ZONE DE SIGNATURE (position FIXE = cible du champ Yousign) ======================
  // Le champ de signature Yousign (lib/yousign.ts) est placé pour tomber EXACTEMENT dans cette
  // case réservée → il ne recouvre jamais le texte. Coordonnées PDF (origine en bas à gauche) :
  //   case : x=[M .. M+SIG_W], y=[SIG_BOTTOM .. SIG_TOP]. Champ Yousign : voir SIGN_FIELD ci-dessous.
  const ftH = 74;
  const SIG_W = 300, SIG_H = 74, SIG_TOP = 214, SIG_BOTTOM = SIG_TOP - SIG_H;

  at(`Fait le ${frDate(a.loan_date)}, pour valoir ce que de droit.`, M, SIG_TOP + 16, helv, 9.5, C.inksoft);
  // rappel de marque, centré dans l'espace à droite de la case de signature
  {
    const rc = (M + SIG_W + 20 + PW - M) / 2; // centre de la zone à droite de la case
    const cAtX = (t: string, yy: number, f: PDFFont, size: number, color: any) =>
      page.drawText(clean(t), { x: rc - f.widthOfTextAtSize(clean(t), size) / 2, y: yy, size, font: f, color });
    page.drawCircle({ x: rc, y: SIG_TOP - 20, size: 20, color: C.chalk, borderColor: C.line, borderWidth: 1 });
    cAtX("€", SIG_TOP - 27, helvB, 20, C.accent);
    cAtX("l-ardoise.fr", SIG_TOP - 56, helvB, 11, C.inksoft);
    cAtX("gardez vos amitiés,", SIG_TOP - 69, helv, 8, C.faint);
    cAtX("pas vos ardoises", SIG_TOP - 80, helv, 8, C.faint);
  }

  if (signed) {
    roundRect(M, SIG_TOP, SIG_W, SIG_H, 12, { color: C.creditSoft, borderColor: C.credit, borderWidth: 1.2 });
    spaced("SIGNATURE DE L'EMPRUNTEUR", M + 16, SIG_TOP - 18, helvB, 7.5, C.credit, 1);
    const cx = M + 26, cyc = SIG_TOP - 44;
    page.drawCircle({ x: cx, y: cyc, size: 11, color: C.credit });
    page.drawSvgPath("M -4 0 L -1.2 3 L 5 -4.5", { x: cx, y: cyc, borderColor: C.white, borderWidth: 2 });
    at(`Signé électroniquement${signedAt ? ` le ${signedAt}` : ""}`, M + 46, SIG_TOP - 40, helvB, 10.5, C.credit);
    const mode = sig?.type === "eidas_avancee" ? "signature avancée eIDAS · empreinte conservée par L'Ardoise" : "signature par lien horodaté · L'Ardoise";
    at(mode, M + 46, SIG_TOP - 54, helv, 8, C.inksoft);
  } else {
    roundRect(M, SIG_TOP, SIG_W, SIG_H, 12, { color: C.white, borderColor: C.line, borderWidth: 1 });
    spaced("SIGNATURE DE L'EMPRUNTEUR", M + 16, SIG_TOP - 18, helvB, 7.5, C.faint, 1);
    rightAt(`(${debtorName})`, M + SIG_W - 16, SIG_TOP - 18, helv, 7.5, C.faint);
    // l'intérieur de la case reste VIDE : le champ Yousign y dessine la signature
    at("Signature électronique horodatée via L'Ardoise", M + 16, SIG_BOTTOM - 13, helv, 7.5, C.faint);
  }

  // ====================== BANDEAU PUB (pied de page) ======================
  page.drawRectangle({ x: 0, y: 0, width: PW, height: ftH, color: C.accent });
  page.drawRectangle({ x: 0, y: ftH, width: PW, height: 3, color: C.accentInk });
  at("Créé gratuitement avec L'Ardoise", M, 46, timesB, 14, C.white);
  {
    const pitch = wrapW("Marre de courir après l'argent qu'on vous doit ? Créez une reconnaissance en 30 secondes, faites-la signer, suivez les remboursements — sans vous fâcher.", helv, 8.5, CW - 150);
    for (let i = 0; i < pitch.length; i++) at(pitch[i], M, 30 - i * 11, helv, 8.5, rgb(0.9, 0.9, 0.98));
  }
  // CTA URL à droite
  rightAt("l-ardoise.fr", PW - M, 40, helvB, 16, C.white);
  rightAt("100 % gratuit", PW - M, 24, helv, 9, rgb(0.9, 0.9, 0.98));

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="reconnaissance-lardoise.pdf"`,
    },
  });
}
