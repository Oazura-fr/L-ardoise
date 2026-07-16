import "server-only";

const KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "bonjour@l-ardoise.fr";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "L'Ardoise";

export const brevoConfigured = Boolean(KEY);

export type BrevoAttachment = { name: string; content: string /* base64 */ };

/** Envoie un email transactionnel via l'API Brevo v3. Renvoie true si accepté (2xx). */
export async function sendEmail(opts: {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  attachments?: BrevoAttachment[];
  replyTo?: { email: string; name?: string };
}): Promise<boolean> {
  if (!KEY) return false;
  const to = opts.to.filter((r) => r.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email));
  if (!to.length) return false;

  const body: Record<string, unknown> = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to,
    subject: opts.subject,
    htmlContent: opts.html,
  };
  if (opts.attachments?.length) body.attachment = opts.attachments;
  if (opts.replyTo) body.replyTo = opts.replyTo;

  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    console.error(`Brevo send → ${r.status}: ${await r.text()}`);
    return false;
  }
  return true;
}

/**
 * Gabarit d'email premium à la charte L'Ardoise : bandeau illustré, carte du
 * montant façon app (badge signé + avatars des parties), bouton, pied de page pub.
 */
export function brandedEmail(opts: {
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  bannerUrl?: string;
  amount?: string;
  amountLabel?: string;
  fromLabel?: string;
  fromName?: string;
  toLabel?: string;
  toName?: string;
  motif?: string | null;
  attachmentNote?: string;
}): string {
  const banner = opts.bannerUrl ?? "https://l-ardoise.fr/email-signed.png";
  const bannerRow = banner
    ? `<tr><td style="padding:14px 18px 0"><img src="${banner}" width="564" alt="" style="display:block;width:100%;max-width:564px;border-radius:16px"/></td></tr>`
    : "";

  const av = (n?: string) => (n && n.trim() ? n.trim()[0].toUpperCase() : "?");
  const motifHtml = opts.motif
    ? `<div style="margin-top:12px;font-size:13px;color:#6b6a7d">Motif&nbsp;: <span style="color:#2b2a3d">${opts.motif}</span></div>`
    : "";
  const card = opts.amount
    ? `<tr><td style="padding:18px 30px 4px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2fe;border:1px solid #e4e0fb;border-radius:16px"><tr><td style="padding:20px 22px">
<div style="display:inline-block;background:#e2f4ef;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700;color:#0a6f5c">&#10003;&nbsp;&nbsp;${opts.amountLabel ?? "Reconnaissance signée"}</div>
<div style="margin-top:12px;font-family:Georgia,serif;font-size:34px;font-weight:700;color:#3a2bc0;letter-spacing:-0.5px">${opts.amount}</div>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px"><tr>
<td width="30" height="30" align="center" valign="middle" style="width:30px;height:30px;background:#0E9E82;border-radius:9px;color:#fff;font-size:13px;font-weight:700">${av(opts.fromName)}</td>
<td style="padding:0 10px 0 8px"><div style="font-size:11px;color:#8a8996">${opts.fromLabel ?? "Prêteur"}</div><div style="font-size:14px;font-weight:600;color:#1b1a2e">${opts.fromName ?? ""}</div></td>
<td style="padding:0 12px;color:#b7b6c2;font-size:18px">&rarr;</td>
<td width="30" height="30" align="center" valign="middle" style="width:30px;height:30px;background:#4C3AE3;border-radius:9px;color:#fff;font-size:13px;font-weight:700">${av(opts.toName)}</td>
<td style="padding-left:8px"><div style="font-size:11px;color:#8a8996">${opts.toLabel ?? "Emprunteur"}</div><div style="font-size:14px;font-weight:600;color:#1b1a2e">${opts.toName ?? ""}</div></td>
</tr></table>
${motifHtml}
</td></tr></table>
</td></tr>`
    : "";
  const chip = opts.attachmentNote
    ? `<tr><td style="padding:14px 30px 0"><div style="background:#f5f5f2;border-radius:10px;padding:10px 14px;font-size:13px;color:#4a4963">&#128206;&nbsp;&nbsp;${opts.attachmentNote}</div></td></tr>`
    : "";
  const cta = opts.ctaLabel && opts.ctaUrl
    ? `<tr><td style="padding:20px 30px 26px"><a href="${opts.ctaUrl}" style="display:inline-block;background:#4C3AE3;border-radius:14px;padding:14px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${opts.ctaLabel}&nbsp;&nbsp;&rarr;</a></td></tr>`
    : `<tr><td style="padding:8px 30px 26px"></td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#efe8d9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b1a2e">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.heading}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe8d9"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 18px 44px -20px rgba(27,26,46,0.28)">
<tr><td style="padding:22px 30px 6px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td width="40" height="40" align="center" valign="middle" style="width:40px;height:40px;background:#2c3142;border-radius:12px;color:#f3f1ea;font-size:22px;font-weight:700;font-family:Georgia,serif">&euro;</td>
<td style="padding-left:12px;font-family:Georgia,serif;font-size:21px;font-weight:700;color:#1b1a2e">L'Ardoise</td>
</tr></table>
</td></tr>
${bannerRow}
<tr><td style="padding:22px 30px 4px">
<div style="font-family:Georgia,serif;font-size:23px;line-height:1.25;font-weight:700;color:#1b1a2e">${opts.heading}</div>
<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#3a3950">${opts.bodyHtml}</p>
</td></tr>
${card}
${chip}
${cta}
<tr><td style="background:#4C3AE3;padding:20px 30px">
<div style="font-family:Georgia,serif;color:#fff;font-size:15px;font-weight:700">Créé gratuitement avec L'Ardoise</div>
<div style="color:#e5e3fb;font-size:12.5px;margin-top:3px">Gardez vos amitiés, pas vos ardoises &middot; <a href="https://l-ardoise.fr" style="color:#fff;font-weight:600">l-ardoise.fr</a> &middot; 100&nbsp;% gratuit</div>
</td></tr>
</table>
<div style="color:#8a8996;font-size:11px;margin-top:14px;max-width:560px">Vous recevez cet email car une reconnaissance de dette vous concerne sur L'Ardoise.</div>
</td></tr></table></body></html>`;
}
