"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { euros } from "@/lib/montant";
import { ArrowLeft, Loader2, FileText, Check, MessageCircle } from "lucide-react";

const METHODS = ["Espèces", "Virement", "Chèque", "PayPal", "Lydia"];

type Ack = {
  id: string;
  amount_cents: number;
  method: string;
  loan_date: string;
  due_date: string | null;
  motif: string | null;
  status: string;
  creditor_user_id: string | null;
  debtor_user_id: string | null;
  repayments: { id: string; amount_cents: number; method: string; paid_on: string }[];
  debtor_contact: { first_name: string } | null;
  creditor_contact: { first_name: string } | null;
};

export default function ReconnaissanceDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [uid, setUid] = useState<string | null>(null);
  const [ack, setAck] = useState<Ack | null>(null);
  const [ready, setReady] = useState(false);
  const [msgs, setMsgs] = useState<{ id: string; sender_user_id: string | null; body: string; created_at: string }[]>([]);
  const [text, setText] = useState("");

  // form remboursement
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState("");
  const [method, setMethod] = useState("Virement");
  const [date, setDate] = useState("2026-07-16");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setReady(true); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/connexion"); return; }
    setUid(session.user.id);
    const { data } = await supabase
      .from("acknowledgments")
      .select("id, amount_cents, method, loan_date, due_date, motif, status, creditor_user_id, debtor_user_id, repayments(id, amount_cents, method, paid_on), debtor_contact:contacts!debtor_contact_id(first_name), creditor_contact:contacts!creditor_contact_id(first_name)")
      .eq("id", id).single();
    setAck((data as unknown as Ack) || null);
    const { data: m } = await supabase
      .from("ack_messages").select("id, sender_user_id, body, created_at")
      .eq("ack_id", id).order("created_at", { ascending: true });
    setMsgs(m || []);
    setReady(true);
  }, [id, router]);

  async function sendMsg(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !supabase || !ack) return;
    setText("");
    await supabase.from("ack_messages").insert({ ack_id: ack.id, sender_user_id: uid, body });
    const { data: m } = await supabase
      .from("ack_messages").select("id, sender_user_id, body, created_at")
      .eq("ack_id", ack.id).order("created_at", { ascending: true });
    setMsgs(m || []);
  }

  useEffect(() => { load(); }, [load]);

  if (!ready) return <main className="grid min-h-screen place-items-center text-inksoft">Chargement…</main>;
  if (!ack) return <main className="grid min-h-screen place-items-center text-inksoft">Reconnaissance introuvable.</main>;

  const iAmCreditor = ack.creditor_user_id === uid;
  const cp = (iAmCreditor ? ack.debtor_contact : ack.creditor_contact)?.first_name || "—";
  const repaid = ack.repayments.reduce((s, r) => s + r.amount_cents, 0);
  const remaining = ack.amount_cents - repaid;
  const settled = remaining <= 0;
  const pct = Math.min(100, Math.round((repaid / ack.amount_cents) * 100));
  const color = iAmCreditor ? "credit" : "debit";

  async function saveRepayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cents = Math.round((parseFloat((amt || "").replace(",", ".")) || 0) * 100);
    if (cents <= 0) return setError("Montant invalide.");
    if (!supabase || !ack) return;
    const capped = Math.min(cents, remaining);
    setBusy(true);
    const { error: err } = await supabase.from("repayments").insert({
      ack_id: ack.id, amount_cents: capped, method, paid_on: date, created_by: uid,
    });
    setBusy(false);
    if (err) return setError(err.message);
    setOpen(false); setAmt("");
    await load();
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-6">
      <a href="/app" className="inline-flex items-center gap-1 text-sm font-semibold text-inksoft"><ArrowLeft size={15} /> Mon ardoise</a>

      <div className="mt-4 rounded-3xl border border-line bg-card p-6 shadow-card">
        <div className="flex items-center gap-3">
          <span className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold text-white ${iAmCreditor ? "bg-credit" : "bg-debit"}`}>{cp[0]}</span>
          <div>
            <div className="font-display text-xl font-bold">{cp}</div>
            <div className="text-sm text-inksoft">{iAmCreditor ? `${cp} te doit` : `Tu dois à ${cp}`}</div>
          </div>
        </div>

        <div className={`mt-5 rounded-2xl p-4 ${color === "credit" ? "bg-credit-soft" : "bg-debit-soft"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-inksoft">Restant dû</div>
          <div className={`font-display text-3xl font-bold tabular-nums ${color === "credit" ? "text-credit" : "text-debit"}`}>
            {euros(settled ? 0 : remaining)}
          </div>
          {repaid > 0 && (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60">
                <div className="h-full rounded-full bg-credit" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 text-xs text-inksoft">{euros(repaid)} remboursés sur {euros(ack.amount_cents)} ({pct}%)</div>
            </>
          )}
        </div>

        {/* Timeline */}
        <div className="mt-5 space-y-3">
          <Event mk="€" bg={iAmCreditor ? "bg-credit" : "bg-debit"} t={iAmCreditor ? "Prêt accordé" : "Emprunt"} d={`${frDate(ack.loan_date)} · ${ack.method}`} v={euros(ack.amount_cents)} />
          {[...ack.repayments].sort((a, b) => a.paid_on.localeCompare(b.paid_on)).map((r) => (
            <Event key={r.id} mk="↩" bg="bg-credit" t="Remboursement" d={`${frDate(r.paid_on)} · ${r.method}`} v={`− ${euros(r.amount_cents)}`} />
          ))}
          {settled && <Event mk="✓" bg="bg-credit" t="Soldé 🎉" d="Ardoise effacée" v="" />}
        </div>

        {/* Actions */}
        {!settled && !open && (
          <button onClick={() => { setAmt(String(Math.round(remaining / 100))); setOpen(true); }}
            className="mt-5 w-full rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-pop">
            💸 Enregistrer un remboursement
          </button>
        )}
        {settled && (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-credit-soft py-3 font-bold text-credit">
            <Check size={18} /> Réglé
          </div>
        )}

        {open && (
          <form onSubmit={saveRepayment} className="mt-5 rounded-2xl border border-line bg-paper p-4">
            <div className="text-sm font-bold">Enregistrer un remboursement</div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setAmt(String(Math.round(remaining / 200)))} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-inksoft">La moitié</button>
              <button type="button" onClick={() => setAmt(String(Math.round(remaining / 100)))} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-inksoft">Tout solder</button>
            </div>
            <label className="mt-2 block text-xs font-semibold text-inksoft">Montant (€)
              <input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} className={inp} /></label>
            <label className="mt-2 block text-xs font-semibold text-inksoft">Moyen
              <div className="mt-1 flex flex-wrap gap-1.5">
                {METHODS.map((m) => (
                  <button type="button" key={m} onClick={() => setMethod(m)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${method === m ? "border-transparent bg-accent text-white" : "border-line bg-white text-inksoft"}`}>{m}</button>
                ))}
              </div>
            </label>
            <label className="mt-2 block text-xs font-semibold text-inksoft">Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} /></label>
            {error && <p className="mt-2 text-sm font-medium text-debit">{error}</p>}
            <div className="mt-3 flex gap-2">
              <button type="submit" disabled={busy} className="flex-1 rounded-xl bg-accent py-2.5 font-semibold text-white disabled:opacity-60">
                {busy ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Valider"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-line bg-white px-4 py-2.5 font-semibold text-inksoft">Annuler</button>
            </div>
          </form>
        )}

        <a href={`/signer/${ack.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          <FileText size={15} /> Voir la reconnaissance
        </a>
      </div>

      {/* Discussion */}
      <section className="mt-5 rounded-3xl border border-line bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2 font-bold"><MessageCircle size={17} className="text-accent" /> Discussion avec {cp}</div>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {msgs.length === 0 ? (
            <p className="py-4 text-center text-sm text-inksoft">Pas encore de message. Écris un mot à {cp} 👋</p>
          ) : (
            msgs.map((m) => {
              const mine = m.sender_user_id === uid;
              return (
                <div key={m.id} className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "self-end bg-accent text-white" : "self-start border border-line bg-white"}`}>
                  {!mine && <div className="mb-0.5 text-xs font-semibold text-inksoft">{cp}</div>}
                  {m.body}
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={sendMsg} className="mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écris un message…"
            className="flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent" />
          <button type="submit" className="grid h-10 w-10 flex-none place-items-center rounded-full bg-accent text-white">➤</button>
        </form>
      </section>
    </main>
  );
}

function Event({ mk, bg, t, d, v }: { mk: string; bg: string; t: string; d: string; v: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-6 w-6 flex-none place-items-center rounded-full text-xs text-white ${bg}`}>{mk}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold leading-tight">{t}</div>
        <div className="text-xs text-inksoft">{d}</div>
      </div>
      <div className="text-sm font-bold tabular-nums">{v}</div>
    </div>
  );
}

function frDate(d: string | null): string {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  const mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${day} ${mois[m - 1]} ${y}`;
}

const inp = "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent";
