import "server-only";

const KEY = process.env.YOUSIGN_API_KEY;
const BASE = process.env.YOUSIGN_API_URL || "https://api-sandbox.yousign.app/v3";

export const yousignConfigured = Boolean(KEY);

async function yjson(path: string, method: string, body?: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Yousign ${method} ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

export type YousignSigner = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
};

/** Crée une demande de signature Yousign à partir du PDF, l'active et renvoie le lien de signature. */
export async function createSignatureLink(opts: {
  ackId: string;
  name: string;
  pdf: Uint8Array;
  signer: YousignSigner;
}): Promise<{ link: string; requestId: string }> {
  // 1) Demande de signature (external_id = id de la reconnaissance → mapping au webhook)
  const sr = await yjson("/signature_requests", "POST", {
    name: opts.name,
    delivery_mode: "none",
    timezone: "Europe/Paris",
    external_id: opts.ackId,
  });

  // 2) Document (multipart)
  const fd = new FormData();
  fd.append("nature", "signable_document");
  fd.append("file", new Blob([opts.pdf as unknown as BlobPart], { type: "application/pdf" }), "reconnaissance.pdf");
  const docRes = await fetch(`${BASE}/signature_requests/${sr.id}/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: fd,
  });
  if (!docRes.ok) throw new Error(`Yousign upload → ${docRes.status}: ${await docRes.text()}`);
  const doc = await docRes.json();

  // 3) Signataire + champ de signature
  const info: Record<string, unknown> = {
    first_name: opts.signer.first_name || "—",
    last_name: opts.signer.last_name || "—",
    email: opts.signer.email,
    locale: "fr",
  };
  if (opts.signer.phone_number) info.phone_number = opts.signer.phone_number;
  const signer = await yjson(`/signature_requests/${sr.id}/signers`, "POST", {
    info,
    signature_level: "electronic_signature",
    signature_authentication_mode: "no_otp",
    // Positionné pour tomber dans la case "SIGNATURE DE L'EMPRUNTEUR" réservée par /api/pdf
    // (origine Yousign = coin haut-gauche, y vers le bas, en points ; page A4 h=841.89).
    // Case PDF x[50..350] y[140..214] → champ dans sa moitié basse, sous le libellé.
    fields: [{ document_id: doc.id, type: "signature", page: 1, x: 64, y: 660, width: 272, height: 40 }],
  });

  // 4) Activation
  await yjson(`/signature_requests/${sr.id}/activate`, "POST", {});

  // 5) Lien de signature (peuplé après activation, en mode "none")
  const full = await yjson(`/signature_requests/${sr.id}/signers/${signer.id}`, "GET");
  return { link: full.signature_link as string, requestId: sr.id as string };
}

/** Vérifie qu'une demande de signature est bien terminée (pour le webhook). */
export async function isSignatureDone(signatureRequestId: string): Promise<{ done: boolean; external_id: string | null }> {
  const sr = await yjson(`/signature_requests/${signatureRequestId}`, "GET");
  return { done: sr.status === "done", external_id: sr.external_id ?? null };
}
