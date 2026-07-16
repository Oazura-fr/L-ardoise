"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { enLettres, euros, ADV_FEE_CENTS, SEUIL_SIGNATURE_AVANCEE_CENTS, MIN_CENTS, MAX_CENTS } from "@/lib/montant";
import { ArrowRight, Copy, Check, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

const METHODS = ["Espèces", "Virement", "Chèque", "PayPal", "Lydia"];
const SCENARIOS = [
  { e: "🃏", l: "Jeu de cartes", m: "Poker entre potes" },
  { e: "✈️", l: "Vacances", m: "Vacances entre amis" },
  { e: "🎂", l: "Anniversaire", m: "Cadeau d'anniversaire" },
  { e: "🎁", l: "Cadeau commun", m: "Cadeau commun" },
  { e: "🍽️", l: "Resto", m: "Resto entre amis" },
  { e: "🎉", l: "Soirée", m: "Soirée" },
  { e: "🎫", l: "Concert", m: "Billets de concert" },
  { e: "🏠", l: "Loyer", m: "Avance de loyer" },
  { e: "🛒", l: "Courses", m: "Courses" },
  { e: "⛽", l: "Essence", m: "Essence / trajet" },
  { e: "🍺", l: "Apéro", m: "Apéro / bar" },
  { e: "💍", l: "Mariage", m: "Mariage (EVJF/EVG)" },
  { e: "🏖️", l: "Week-end", m: "Week-end entre amis" },
  { e: "⚽", l: "Pari", m: "Pari entre amis" },
  { e: "🐶", l: "Animal", m: "Frais d'animal" },
  { e: "💸", l: "Dépannage", m: "Dépannage jusqu'à la paie" },
  { e: "🛠️", l: "Projet", m: "Projet commun" },
];

function WhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Creer() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [sens, setSens] = useState<"pret" | "emprunt">("pret");
  const [montant, setMontant] = useState("");
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [method, setMethod] = useState("Virement");
  const [dateLoan, setDateLoan] = useState("2026-07-16");
  const [due, setDue] = useState("");
  const [motif, setMotif] = useState("");
  const [advanced, setAdvanced] = useState(true); // on insiste : coché par défaut
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/connexion");
      else setUid(session.user.id);
    });
  }, [router]);

  const principal = Math.round((parseFloat((montant || "").replace(",", ".")) || 0) * 100);
  const eligible = principal >= SEUIL_SIGNATURE_AVANCEE_CENTS;
  const fee = eligible && advanced ? ADV_FEE_CENTS : 0;
  const total = principal + fee;
  const lettres = useMemo(() => (total > 0 ? enLettres(Math.floor(total / 100)) + " euros" : ""), [total]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (principal < MIN_CENTS) return setError("Le montant doit être d'au moins 1 €.");
    if (principal > MAX_CENTS) return setError("Le montant maximum est 10 000 000 €.");
    if (!nom.trim()) return setError("Ajoute le prénom du proche.");
    if (!supabase || !uid) return setError("Session expirée, reconnecte-toi.");

    setBusy(true);
    const { data: contact, error: e1 } = await supabase
      .from("contacts").insert({ owner_id: uid, first_name: nom.trim(), phone: tel.trim() || null })
      .select("id").single();
    if (e1 || !contact) { setBusy(false); return setError(e1?.message || "Erreur contact."); }

    const row: Record<string, unknown> = {
      creator_id: uid,
      amount_cents: total, // dette totale (principal + frais de signature)
      amount_words: lettres,
      method,
      loan_date: dateLoan,
      due_date: due || null,
      motif: motif.trim() || null,
      status: "a_signer",
      signature_required: fee > 0 ? "eidas_avancee" : "lien_otp",
    };
    if (sens === "pret") { row.creditor_user_id = uid; row.debtor_contact_id = contact.id; }
    else { row.debtor_user_id = uid; row.creditor_contact_id = contact.id; }

    const { data: ack, error: e2 } = await supabase
      .from("acknowledgments").insert(row).select("id").single();
    setBusy(false);
    if (e2 || !ack) return setError(e2?.message || "Erreur reconnaissance.");
    setLink(`${window.location.origin}/signer/${ack.id}`);
  }

  if (link) {
    const msg = encodeURIComponent(`Salut ${nom} ! Peux-tu valider notre reconnaissance sur L'Ardoise ? C'est gratuit et ça prend 10 s : ${link}`);
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <div className="rounded-3xl border border-line bg-card p-7 text-center shadow-card">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-credit-soft text-3xl text-credit">✓</div>
          <h1 className="mt-4 font-display text-2xl font-bold">Reconnaissance créée&nbsp;!</h1>
          <p className="mt-2 text-inksoft">Envoie le lien à <b>{nom}</b> pour qu&apos;il/elle signe — gratuitement, sans installer l&apos;app.</p>
          <div className="mt-5 flex flex-col gap-3">
            <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 font-semibold text-white">
              <WhatsApp className="h-5 w-5" /> Envoyer sur WhatsApp
            </a>
            <a href={`sms:?&body=${msg}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-5 py-3.5 font-semibold text-ink">
              💬 Envoyer par SMS
            </a>
            <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-5 py-3.5 font-semibold text-ink">
              {copied ? <><Check size={18} className="text-credit" /> Lien copié</> : <><Copy size={18} /> Copier le lien</>}
            </button>
          </div>
          <a href="/app" className="mt-6 inline-block text-sm font-semibold text-accent">Voir mon ardoise →</a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <a href="/app" className="text-sm font-semibold text-inksoft">← Mon ardoise</a>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Nouvelle reconnaissance</h1>

      {/* Scénarios rapides */}
      <div className="mt-4 flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button key={s.l} type="button" onClick={() => setMotif(s.m)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${motif === s.m ? "border-transparent bg-accent text-white" : "border-line bg-white text-inksoft"}`}>
            {s.e} {s.l}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-paper p-1.5">
          <button type="button" onClick={() => setSens("pret")}
            className={`rounded-xl py-3 font-bold ${sens === "pret" ? "bg-credit text-white" : "text-inksoft"}`}>💰 Je prête</button>
          <button type="button" onClick={() => setSens("emprunt")}
            className={`rounded-xl py-3 font-bold ${sens === "emprunt" ? "bg-debit text-white" : "text-inksoft"}`}>🙏 J&apos;emprunte</button>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">
          Montant (€) — de 1 € à 10 000 000 €
          <input inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="100" className={inp} />
          {lettres && <span className="text-xs italic text-accent">{lettres}</span>}
        </label>

        {/* Upsell signature avancée (on insiste + alerte ≥ 500 €) */}
        {eligible && (
          <div className="rounded-2xl border-2 border-accent/40 bg-accent-soft p-4">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <ShieldCheck size={17} className="text-accent" /> Montant important — protège ton argent
            </div>
            <ul className="mt-2 space-y-1 text-sm text-inksoft">
              <li>✅ Signature <b>opposable en justice</b> (eIDAS avancée), pas un simple clic</li>
              <li>✅ La preuve solide pour <b>récupérer ton argent</b> en cas de litige</li>
              <li>✅ Seulement <b>{euros(ADV_FEE_CENTS)}</b>, <b>ajoutés à la dette</b> — c&apos;est {nom || "ton proche"} qui les rembourse</li>
            </ul>
            <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl bg-white/70 px-3 py-2.5">
              <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} className="h-5 w-5 accent-[#4C3AE3]" />
              <span className="text-sm font-bold text-ink">Activer la signature avancée (recommandé)</span>
            </label>
            {fee > 0 ? (
              <div className="mt-3 rounded-xl bg-white/70 p-3 text-sm">
                <div className="flex justify-between"><span className="text-inksoft">Principal prêté</span><span className="font-semibold tabular-nums">{euros(principal)}</span></div>
                <div className="flex justify-between"><span className="text-inksoft">Signature électronique</span><span className="font-semibold tabular-nums">{euros(fee)}</span></div>
                <div className="mt-1 flex justify-between border-t border-line pt-1 font-bold"><span>Total à rembourser</span><span className="tabular-nums text-accent">{euros(total)}</span></div>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-debit-soft px-3 py-2.5 text-sm text-debit">
                <AlertTriangle size={17} className="mt-0.5 flex-none" />
                <span><b>Attention :</b> sans signature avancée, une dette de <b>{euros(principal)}</b> sera bien plus difficile à faire valoir en cas de litige. On te la recommande vraiment.</span>
              </div>
            )}
          </div>
        )}

        {principal >= 500000 && (
          <div className="rounded-xl bg-paper px-4 py-3 text-xs text-inksoft">
            💡 <b>Prêt supérieur à 5 000 €</b> : pense à le déclarer à l&apos;administration fiscale (formulaire n° 2062) avec ta déclaration de revenus.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">Le proche
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Pierre" className={inp} /></label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">Son mobile
            <input inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="06 12 34 56 78" className={inp} /></label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">Moyen de paiement
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button type="button" key={m} onClick={() => setMethod(m)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${method === m ? "border-transparent bg-accent text-white" : "border-line bg-white text-inksoft"}`}>{m}</button>
            ))}
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">Date du prêt
            <input type="date" value={dateLoan} onChange={(e) => setDateLoan(e.target.value)} className={inp} /></label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">Remboursement le
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inp} /></label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">Motif (facultatif)
          <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex : billets d'avion" className={inp} /></label>

        {error && <p className="rounded-xl bg-debit-soft px-4 py-3 text-sm font-medium text-debit">{error}</p>}

        <p className="text-center text-xs text-inksoft">Pour le proche, signer reste <b>gratuit</b>.</p>
        <button type="submit" disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-pop disabled:opacity-60">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <>Créer et faire signer <ArrowRight size={18} /></>}
        </button>
      </form>
    </main>
  );
}

const inp = "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent";
