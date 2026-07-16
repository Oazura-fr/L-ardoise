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

/** Gabarit d'email à la charte L'Ardoise (bandeau ardoise + contenu + pied de page pub). */
export function brandedEmail(opts: { heading: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }): string {
  const cta = opts.ctaLabel && opts.ctaUrl
    ? `<tr><td style="padding:8px 0 4px"><a href="${opts.ctaUrl}" style="display:inline-block;background:#4C3AE3;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px;font-size:15px">${opts.ctaLabel}</a></td></tr>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#F5F5F2;font-family:Helvetica,Arial,sans-serif;color:#1B1A2E">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F2;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px -14px rgba(27,26,46,0.18)">
        <tr><td style="background:#2c3142;padding:20px 26px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:40px"><div style="width:40px;height:40px;background:#4C3AE3;border-radius:11px;color:#f3f1ea;font-weight:700;font-size:22px;text-align:center;line-height:40px">&euro;</div></td>
            <td style="padding-left:12px"><div style="color:#fff;font-size:20px;font-weight:700;font-family:Georgia,serif">L'Ardoise</div>
            <div style="color:#c8c9d2;font-size:11px">l'appli des potes qui se pr&ecirc;tent</div></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:26px 26px 8px">
          <div style="font-size:19px;font-weight:700;font-family:Georgia,serif;margin-bottom:10px">${opts.heading}</div>
          <div style="font-size:15px;line-height:1.55;color:#2b2a3d">${opts.bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:6px 26px 22px"><table role="presentation" cellpadding="0" cellspacing="0">${cta}</table></td></tr>
        <tr><td style="background:#4C3AE3;padding:18px 26px">
          <div style="color:#fff;font-weight:700;font-size:14px;font-family:Georgia,serif">Cr&eacute;&eacute; gratuitement avec L'Ardoise</div>
          <div style="color:#e5e3fb;font-size:12px;margin-top:2px">Gardez vos amiti&eacute;s, pas vos ardoises &middot; <a href="https://l-ardoise.fr" style="color:#fff">l-ardoise.fr</a> &middot; 100&nbsp;% gratuit</div>
        </td></tr>
      </table>
      <div style="color:#8a8996;font-size:11px;margin-top:14px">Vous recevez cet email car une reconnaissance de dette vous concerne sur L'Ardoise.</div>
    </td></tr>
  </table></body></html>`;
}
