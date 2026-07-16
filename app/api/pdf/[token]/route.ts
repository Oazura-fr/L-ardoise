import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

function fullFromProfile(p: any): string | null {
  if (!p) return null;
  const nom = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  const parts = [nom];
  if (p.birth_date) parts.push(`né(e) le ${frDate(p.birth_date)}`);
  if (p.address) parts.push(`demeurant ${p.address}`);
  return parts.filter(Boolean).join(", ");
}

function fullFromProof(s: any): string | null {
  if (!s) return null;
  const nom = `${s.first_name || ""} ${s.last_name || ""}`.trim();
  const parts = [nom];
  if (s.birth_date) parts.push(`né(e) le ${frDate(s.birth_date)}`);
  if (s.address) parts.push(`demeurant ${s.address}`);
  return parts.filter(Boolean).join(", ");
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ error: "indisponible" }, { status: 503 });

  const { data: ack } = await supabaseAdmin
    .from("acknowledgments")
    .select("id, amount_cents, amount_words, method, loan_date, due_date, motif, status, signature_required, creditor_user_id, debtor_user_id, creditor_contact:contacts!creditor_contact_id(first_name), debtor_contact:contacts!debtor_contact_id(first_name), creditor_profile:profiles!creditor_user_id(first_name,last_name,birth_date,address), debtor_profile:profiles!debtor_user_id(first_name,last_name,birth_date,address)")
    .eq("id", params.token)
    .single();
  if (!ack) return NextResponse.json({ error: "introuvable" }, { status: 404 });

  const a = ack as any;
  const { data: sig } = await supabaseAdmin
    .from("signatures").select("proof, signed_at").eq("ack_id", params.token)
    .order("signed_at", { ascending: false }).limit(1).maybeSingle();

  const creditor = fullFromProfile(a.creditor_profile) || a.creditor_contact?.first_name || "le prêteur";
  const debtor =
    fullFromProfile(a.debtor_profile) ||
    fullFromProof(sig?.proof?.signataire) ||
    a.debtor_contact?.first_name ||
    "l'emprunteur";

  const isAdv = a.signature_required === "eidas_avancee";
  const fee = isAdv ? ADV_FEE_CENTS : 0;
  const principal = a.amount_cents - fee;

  // ---- PDF ----
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const ink = rgb(0.11, 0.1, 0.18);
  const grey = rgb(0.42, 0.41, 0.44);
  const M = 60;
  const W = 595.28 - M * 2;
  let y = 780;

  const wrap = (text: string, f: typeof font, size: number): string[] => {
    const words = text.split(" ");
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
  const para = (text: string, f: typeof font, size: number, color = ink, gap = 6, lh = 16) => {
    for (const l of wrap(text, f, size)) { page.drawText(l, { x: M, y, size, font: f, color }); y -= lh; }
    y -= gap;
  };
  const center = (text: string, f: typeof font, size: number, color = ink) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (595.28 - w) / 2, y, size, font: f, color });
  };

  center("RECONNAISSANCE DE DETTE", bold, 15);
  y -= 8;
  page.drawLine({ start: { x: 265, y }, end: { x: 330, y }, thickness: 1.5, color: ink });
  y -= 28;

  para(`Je soussigné(e) ${debtor}, reconnais devoir à ${creditor} la somme de ${euros(a.amount_cents)} (${a.amount_words}), remise par ${a.method} en date du ${frDate(a.loan_date)}.`, font, 12);
  para(`Je m'engage à rembourser cette somme ${a.due_date ? `au plus tard le ${frDate(a.due_date)}` : "à première demande"}${a.motif ? `, au titre de : ${a.motif}` : ""}.`, font, 12);

  if (isAdv) {
    y -= 4;
    para(`Détail : principal prêté ${euros(principal)} + frais de signature électronique ${euros(fee)} = total dû ${euros(a.amount_cents)}.`, font, 11, grey, 8, 15);
  }

  y -= 6;
  para("Identité des parties", bold, 11, ink, 2, 15);
  para(`Créancier : ${creditor}.`, font, 11, ink, 2, 15);
  para(`Débiteur : ${debtor}.`, font, 11, ink, 10, 15);

  para("Somme exprimée en chiffres et en toutes lettres. Conformément à l'article 1376 du Code civil, en cas de différence, la somme exprimée en toutes lettres prévaut.", font, 9.5, grey, 14, 13);

  // Bloc signature
  const signedAt = sig?.signed_at ? new Date(sig.signed_at).toLocaleString("fr-FR") : null;
  if (a.status === "signee") {
    page.drawRectangle({ x: M, y: y - 46, width: W, height: 46, borderColor: rgb(0.05, 0.62, 0.51), borderWidth: 1.2, color: rgb(0.89, 0.96, 0.94) });
    page.drawText(`Signée électroniquement${signedAt ? ` le ${signedAt}` : ""}`, { x: M + 12, y: y - 20, size: 11, font: bold, color: rgb(0.04, 0.49, 0.4) });
    page.drawText(`Validée par ${debtor.split(",")[0]} — empreinte horodatée conservée par L'Ardoise.`, { x: M + 12, y: y - 35, size: 9.5, font, color: grey });
    y -= 60;
  } else {
    page.drawText("En attente de signature électronique.", { x: M, y: y - 16, size: 11, font, color: rgb(0.91, 0.29, 0.18) });
    y -= 30;
  }

  page.drawText("L'Ardoise — reconnaissance de dette entre proches", { x: M, y: 40, size: 8, font, color: grey });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="reconnaissance-lardoise.pdf"`,
    },
  });
}
