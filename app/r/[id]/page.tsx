"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { euros } from "@/lib/montant";
import { fireConfetti } from "@/lib/confetti";
import { ArrowLeft, Loader2, FileText, Check, MessageCircle, Download } from "lucide-react";

const METHODS = ["Espèces", "Virement", "Chèque", "PayPal", "Lydia"];

type Ack = {
  id: string;
  amount_cents: number;
  method: string;
  loan_date: string;
  due_date: string | null;
  motif: string | null;
  status: string;
  signed_at: string | null;
  creator_id: string | null;
  creditor_user_id: string | null;
  debtor_user_id: string | null;
  repayments: { id: string; amount_cents: number; method: string; paid_on: string; confirmed_at: string | null; disputed_at: string | null; created_by: string | null }[];
  debtor_contact: { first_name: string; phone: string | null } | null;
  creditor_contact: { first_name: string; phone: string | null } | null;
};

function waLink(phone: string | null, msg: string): string {
  const text = encodeURIComponent(msg);
  if (!phone) return `https://wa.me/?text=${text}`;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "33" + d.slice(1);
  return `https://wa.me/${d}?text=${text}`;
}

export default function ReconnaissanceDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [uid, setUid] = useState<string | null>(null);
  const [ack, setAck] = useState<Ack | null>(null);
  const [ready, setReady] = useState(false);
  const [msgs, setMsgs] = useState<{ id: string; sender_user_id: string | null; body: string; created_at: string }[]>([]);
  const [text, setText] = useState("");
  const [cpName, setCpName] = useState<string | null>(null);

  // form remboursement
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState("");
  const [method, setMethod] = useState("Virement");
  const [date, setDate] = useState("2026-07-16");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRep, setLastRep] = useState<{ id: string; amount: number; remaining: number; settled: boolean } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editMotif, setEditMotif] = useState("");
  const [editDue, setEditDue] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);
  const [repBusy, setRepBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) { setReady(true); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/connexion"); return; }
    setUid(session.user.id);
    const { data } = await supabase
      .from("acknowledgments")
      .select("id, amount_cents, method, loan_date, due_date, motif, status, signed_at, creator_id, creditor_user_id, debtor_user_id, repayments(id, amount_cents, method, paid_on, confirmed_at, disputed_at, created_by), debtor_contact:contacts!debtor_contact_id(first_name, phone), creditor_contact:contacts!creditor_contact_id(first_name, phone)")
      .eq("id", id).single();
    let ackData = data as unknown as Ack | null;
    // Secours au webhook Yousign : réconcilie une signature avancée en attente
    if (ackData && ackData.status === "a_signer") {
      try {
        const s = await fetch(`/api/yousign/sync/${id}`).then((r) => r.json());
        if (s?.signed) {
          const { data: d2 } = await supabase
            .from("acknowledgments")
            .select("id, amount_cents, method, loan_date, due_date, motif, status, signed_at, creator_id, creditor_user_id, debtor_user_id, repayments(id, amount_cents, method, paid_on, confirmed_at, disputed_at, created_by), debtor_contact:contacts!debtor_contact_id(first_name, phone), creditor_contact:contacts!creditor_contact_id(first_name, phone)")
            .eq("id", id).single();
          ackData = (d2 as unknown as Ack) || ackData;
        }
      } catch { /* réseau : on garde l'état courant */ }
    }
    setAck(ackData || null);
    // Nom du proche : soit un contact, soit un utilisateur rattaché (profil protégé
    // → on passe par la vue party_profiles).
    if (ackData) {
      const iAmCred = ackData.creditor_user_id === session.user.id;
      const otherId = iAmCred ? ackData.debtor_user_id : ackData.creditor_user_id;
      const hasContact = !!(iAmCred ? ackData.debtor_contact : ackData.creditor_contact);
      if (!hasContact && otherId && otherId !== session.user.id) {
        const { data: p } = await supabase.from("party_profiles").select("first_name").eq("id", otherId).maybeSingle();
        setCpName((p as { first_name: string } | null)?.first_name || null);
      } else setCpName(null);
    }
    const { data: m } = await supabase
      .from("ack_messages").select("id, sender_user_id, body, created_at")
      .eq("ack_id", id).order("created_at", { ascending: true });
    setMsgs(m || []);
    setReady(true);
  }, [id, router]);

  function startEdit() { setEditMotif(ack?.motif || ""); setEditDue(ack?.due_date || ""); setEditing(true); }
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !ack) return;
    await supabase.from("acknowledgments").update({ motif: editMotif.trim() || null, due_date: editDue || null }).eq("id", ack.id);
    setEditing(false);
    await load();
  }

  // Suppression : créateur uniquement ET tant que ce n'est pas signé.
  // Une fois signée, c'est une preuve pour les deux parties → verrou en base
  // (RLS "ack suppression si non signee" : creator_id = auth.uid() and signed_at is null).
  async function removeAck() {
    if (!supabase || !ack) return;
    setDelError(null);
    setDelBusy(true);
    const { error: e } = await supabase.from("acknowledgments").delete().eq("id", ack.id);
    setDelBusy(false);
    if (e) { setDelError(e.message); return; }
    router.replace("/app");
  }

  // Seul le créancier peut confirmer (verrou aussi en base : policy UPDATE).
  async function confirmRep(id: string) {
    if (!supabase || !uid) return;
    setRepBusy(true);
    await supabase.from("repayments").update({ confirmed_at: new Date().toISOString(), confirmed_by: uid, disputed_at: null }).eq("id", id);
    setRepBusy(false);
    await load();
  }
  async function disputeRep(id: string) {
    if (!supabase) return;
    setRepBusy(true);
    await supabase.from("repayments").update({ disputed_at: new Date().toISOString(), confirmed_at: null, confirmed_by: null }).eq("id", id);
    setRepBusy(false);
    await load();
  }

  // Le débiteur peut retirer sa déclaration contestée (policy DELETE : auteur
  // + non confirmée). C'est la sortie du conflit.
  async function removeRep(id: string) {
    if (!supabase) return;
    setRepBusy(true);
    await supabase.from("repayments").delete().eq("id", id);
    setRepBusy(false);
    await load();
  }

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
  const cp = (iAmCreditor ? ack.debtor_contact : ack.creditor_contact)?.first_name || cpName || "—";
  const cpPhone = (iAmCreditor ? ack.debtor_contact : ack.creditor_contact)?.phone || null;
  // Un remboursement n'efface la dette que s'il est ATTESTÉ par celui qui encaisse.
  const repaid = ack.repayments.filter((r) => r.confirmed_at).reduce((s, r) => s + r.amount_cents, 0);
  const aConfirmer = ack.repayments.filter((r) => !r.confirmed_at && !r.disputed_at);
  const contestes = ack.repayments.filter((r) => r.disputed_at);
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
    const iAmCred = ack.creditor_user_id === uid;
    // Le créancier atteste avoir reçu -> effectif tout de suite.
    // Le débiteur ne fait que DÉCLARER -> rien ne bouge tant que l'autre n'a pas confirmé.
    const effectif = iAmCred || !ack.creditor_user_id;
    const becameSettled = effectif && remaining - capped <= 0;
    const cpName = (iAmCred ? ack.debtor_contact : ack.creditor_contact)?.first_name || "ton proche";
    setBusy(true);
    const { data: newRep, error: err } = await supabase.from("repayments").insert({
      ack_id: ack.id, amount_cents: capped, method, paid_on: date, created_by: uid,
    }).select("id").single();
    setBusy(false);
    if (err) return setError(err.message);
    setOpen(false); setAmt("");
    await load();
    if (becameSettled) fireConfetti();
    void cpName;
    if (effectif) {
      setLastRep({ id: newRep?.id || "", amount: capped, remaining: Math.max(0, remaining - capped), settled: becameSettled });
    } else {
      setLastRep(null); // l'encart "en attente de confirmation" prend le relais
    }
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-6">
      <a href="/app" className="inline-flex items-center gap-1 text-sm font-semibold text-inksoft"><ArrowLeft size={15} /> Mon ardoise</a>

      {lastRep && (
        <div className="mt-3 animate-fadeup rounded-2xl border border-credit bg-credit-soft p-4">
          <div className="font-bold text-credit">{lastRep.settled ? "🎉 Ardoise soldée !" : `✓ Remboursement de ${euros(lastRep.amount)} enregistré`}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={waLink(cpPhone, iAmCreditor
                ? (lastRep.settled ? `Merci ${cp} 🎉 Ardoise soldée, on est quittes !` : `Merci ${cp} 👋 Bien reçu ton remboursement de ${euros(lastRep.amount)}. Il te reste ${euros(lastRep.remaining)} sur notre ardoise. 🙏`)
                : (lastRep.settled ? `Je viens de te rembourser ${euros(lastRep.amount)} — on est quittes ! 🎉` : `Je viens de te rembourser ${euros(lastRep.amount)}. Il reste ${euros(lastRep.remaining)}. 👍`))}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white">
              📲 Confirmer à {cp}
            </a>
            <a href={`/api/recu/${lastRep.id}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink">
              📄 Reçu
            </a>
            <button onClick={() => setLastRep(null)} className="px-2 text-sm font-semibold text-inksoft">Fermer</button>
          </div>
        </div>
      )}

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
                <div className="h-full rounded-full bg-credit transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 text-xs text-inksoft">{euros(repaid)} remboursés sur {euros(ack.amount_cents)} ({pct}%)</div>
            </>
          )}
        </div>

        {/* Timeline */}
        <div className="mt-5 space-y-3">
          <Event mk="€" bg={iAmCreditor ? "bg-credit" : "bg-debit"} t={iAmCreditor ? "Prêt accordé" : "Emprunt"} d={`${frDate(ack.loan_date)} · ${ack.method}`} v={euros(ack.amount_cents)} />
          {[...ack.repayments].filter((r) => r.confirmed_at).sort((a, b) => a.paid_on.localeCompare(b.paid_on)).map((r) => (
            <Event key={r.id} mk="↩" bg="bg-credit" t="Remboursement" d={`${frDate(r.paid_on)} · ${r.method}`} v={`− ${euros(r.amount_cents)}`} href={`/api/recu/${r.id}`} />
          ))}
          {settled && <Event mk="✓" bg="bg-credit" t="Soldé 🎉" d="Ardoise effacée" v="" />}
        </div>

        {/* Remboursements déclarés, en attente de l'accord de celui qui encaisse */}
        {aConfirmer.length > 0 && (
          <div className="mt-5 rounded-2xl border border-amber2 bg-amber2-soft p-4">
            {aConfirmer.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-1">
                <div>
                  <div className="text-sm font-bold text-amber2">⏳ {euros(r.amount_cents)} — en attente de confirmation</div>
                  <div className="text-xs text-inksoft">
                    {frDate(r.paid_on)} · {r.method} ·{" "}
                    {iAmCreditor
                      ? `${cp} déclare t'avoir remboursé`
                      : `Tu as déclaré ce remboursement — ${cp} doit le confirmer`}
                  </div>
                </div>
                {iAmCreditor && (
                  <div className="flex gap-2">
                    <button onClick={() => confirmRep(r.id)} disabled={repBusy}
                      className="rounded-xl bg-credit px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      ✓ J&apos;ai bien reçu
                    </button>
                    <button onClick={() => disputeRep(r.id)} disabled={repBusy}
                      className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-inksoft">
                      Contester
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!iAmCreditor && (
              <p className="mt-1 text-xs text-inksoft">
                Tant que {cp} n&apos;a pas confirmé, la dette reste inchangée — c&apos;est ce qui protège vos deux comptes.
              </p>
            )}
          </div>
        )}

        {contestes.length > 0 && (
          <div className="mt-5 rounded-2xl border border-debit bg-debit-soft p-4">
            {contestes.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-1">
                <div>
                  <div className="text-sm font-bold text-debit">⚠️ {euros(r.amount_cents)} — contesté</div>
                  <div className="text-xs text-inksoft">
                    {frDate(r.paid_on)} · {r.method} ·{" "}
                    {iAmCreditor ? "Tu as indiqué ne pas avoir reçu ce montant" : `${cp} indique ne pas avoir reçu ce montant`}
                  </div>
                </div>
                <div className="flex gap-2">
                  {iAmCreditor ? (
                    <button onClick={() => confirmRep(r.id)} disabled={repBusy}
                      className="rounded-xl bg-credit px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      Finalement, j&apos;ai reçu
                    </button>
                  ) : (
                    <button onClick={() => removeRep(r.id)} disabled={repBusy}
                      className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-inksoft">
                      Retirer ma déclaration
                    </button>
                  )}
                </div>
              </div>
            ))}
            <p className="mt-1 text-xs text-inksoft">
              Désaccord&nbsp;? Le plus simple : expliquez-vous dans la discussion ci-dessous. La dette reste inchangée en attendant.
            </p>
          </div>
        )}

        {/* Actions */}
        {!settled && !open && (
          <button onClick={() => { setAmt(String(Math.round(remaining / 100))); setOpen(true); }}
            className="mt-5 w-full rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-pop">
            💸 {iAmCreditor ? "Enregistrer un remboursement reçu" : "Déclarer un remboursement"}
          </button>
        )}
        {!settled && iAmCreditor && (
          <a href={waLink(cpPhone, `Coucou ${cp} 👋 Petit rappel amical : il reste ${euros(remaining)} sur notre ardoise. Merci ! 🙏`)}
            target="_blank" rel="noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3 font-semibold text-white">
            🔔 Relancer sur WhatsApp
          </a>
        )}
        {settled && (
          <div className="mt-5 flex animate-fadeup items-center justify-center gap-2 rounded-2xl bg-credit-soft py-3 font-bold text-credit">
            <Check size={18} /> Réglé 🎉
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

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <a href={`/signer/${ack.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            <FileText size={15} /> Voir la reconnaissance
          </a>
          <a href={`/api/pdf/${ack.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            <Download size={15} /> Télécharger le PDF
          </a>
        </div>

        {!editing ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button onClick={startEdit} className="text-sm font-semibold text-inksoft hover:text-accent">✏️ Modifier le motif / l&apos;échéance</button>
            {/* Une reconnaissance signée est une preuve : plus jamais supprimable (verrou aussi en base). */}
            {ack.creator_id === uid && !ack.signed_at && (
              <button onClick={() => { setConfirmDel(true); setDelError(null); }} className="text-sm font-semibold text-inksoft hover:text-debit">🗑️ Supprimer</button>
            )}
            {ack.signed_at && (
              <span className="inline-flex items-center gap-1.5 text-xs text-inksoft">
                🔒 Signée : conservée comme preuve, non supprimable
              </span>
            )}
          </div>
        ) : (
          <form onSubmit={saveEdit} className="mt-3 rounded-2xl border border-line bg-paper p-4">
            <label className="block text-xs font-semibold text-inksoft">Motif
              <input value={editMotif} onChange={(e) => setEditMotif(e.target.value)} className={inp} /></label>
            <label className="mt-2 block text-xs font-semibold text-inksoft">Échéance
              <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className={inp} /></label>
            <div className="mt-3 flex gap-2">
              <button type="submit" className="flex-1 rounded-xl bg-accent py-2.5 font-semibold text-white">Enregistrer</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-line bg-white px-4 py-2.5 font-semibold text-inksoft">Annuler</button>
            </div>
          </form>
        )}

        {confirmDel && (
          <div className="mt-3 rounded-2xl border border-debit bg-debit-soft p-4">
            <div className="font-bold text-debit">Supprimer cette reconnaissance ?</div>
            <p className="mt-1 text-sm text-inksoft">
              Elle n&apos;est <b>pas encore signée</b> : elle sera effacée définitivement et le lien de signature ne
              marchera plus. Tu pourras la recréer proprement.
            </p>
            {delError && <p className="mt-2 text-sm font-medium text-debit">{delError}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={removeAck} disabled={delBusy} className="flex-1 rounded-xl bg-debit py-2.5 font-semibold text-white disabled:opacity-60">
                {delBusy ? "Suppression…" : "Oui, supprimer"}
              </button>
              <button onClick={() => setConfirmDel(false)} className="rounded-xl border border-line bg-white px-4 py-2.5 font-semibold text-inksoft">Annuler</button>
            </div>
          </div>
        )}
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

function Event({ mk, bg, t, d, v, href }: { mk: string; bg: string; t: string; d: string; v: string; href?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-6 w-6 flex-none place-items-center rounded-full text-xs text-white ${bg}`}>{mk}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold leading-tight">{t}</div>
        <div className="text-xs text-inksoft">
          {d}
          {href && <> · <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-accent">reçu</a></>}
        </div>
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
