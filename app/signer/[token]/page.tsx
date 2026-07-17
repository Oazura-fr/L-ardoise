import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { euros, ADV_FEE_CENTS } from "@/lib/montant";
import SignForm from "./SignForm";
import BackLink from "@/components/BackLink";

function frDate(d: string | null): string {
  if (!d) return "à première demande";
  const [y, m, day] = d.split("-").map(Number);
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${day} ${mois[m - 1]} ${y}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// Le jeton n'est pas un UUID : on choisit la colonne selon la forme de la cle.
const EST_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function SignerPage({ params }: { params: { token: string } }) {
  if (!supabaseAdmin) {
    return <Center>Service momentanément indisponible.</Center>;
  }

  const { data: ack } = await supabaseAdmin
    .from("acknowledgments")
    .select(
      "id, amount_cents, amount_words, method, loan_date, due_date, motif, status, signature_required, creditor_user_id, debtor_user_id, creditor_contact:contacts!creditor_contact_id(first_name), debtor_contact:contacts!debtor_contact_id(first_name), creditor_profile:profiles!creditor_user_id(first_name, last_name, birth_date, address, phone), debtor_profile:profiles!debtor_user_id(first_name, last_name, birth_date, address, phone)"
    )
    .eq(EST_UUID.test(params.token) ? "id" : "sign_token", params.token)
    .maybeSingle();

  if (!ack) {
    return <Center>Cette reconnaissance n&apos;existe pas ou le lien a expiré.</Center>;
  }

  const a = ack as any;
  const creditor = a.creditor_profile?.first_name || a.creditor_contact?.first_name || "le prêteur";
  const debtor = a.debtor_profile?.first_name || a.debtor_contact?.first_name || "l'emprunteur";
  const alreadySigned = a.status === "signee";
  const isAdv = a.signature_required === "eidas_avancee";
  const fee = isAdv ? ADV_FEE_CENTS : 0;
  const principal = a.amount_cents - fee;

  const fullId = (p: any): string | null => {
    if (!p) return null;
    const nom = `${p.first_name || ""} ${p.last_name || ""}`.trim();
    const parts = [nom];
    if (p.birth_date) parts.push(`né(e) le ${frDate(p.birth_date)}`);
    if (p.address) parts.push(`demeurant ${p.address}`);
    if (p.phone) parts.push(`tél. ${p.phone}`);
    return parts.filter(Boolean).join(", ");
  };
  const creditorId = fullId(a.creditor_profile);
  const debtorId = fullId(a.debtor_profile);

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      {/* Retour obligatoire : en PWA installée il n'y a pas de bouton Précédent. */}
      <div className="mb-4"><BackLink /></div>
      <a href="/" className="mb-6 flex items-center justify-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate2 font-display text-lg font-bold text-chalk">€</div>
        <span className="font-display text-lg font-bold">L&apos;Ardoise</span>
      </a>

      {/* Document */}
      <div className="rounded-3xl border border-line bg-card p-7 shadow-card">
        <h1 className="text-center font-display text-sm font-bold uppercase tracking-[0.2em]">Reconnaissance de dette</h1>
        <div className="mx-auto mt-3 mb-4 h-0.5 w-14 bg-ink" />
        {isAdv && (
          <div className="mx-auto mb-5 flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
            🔒 Signature électronique avancée (eIDAS)
          </div>
        )}

        <p className="text-[15px] leading-relaxed">
          <b>{debtor}</b> reconnaît devoir à <b>{creditor}</b> la somme de{" "}
          <b>{euros(a.amount_cents)}</b> <span className="italic text-inksoft">({a.amount_words})</span>, remise par{" "}
          <b>{a.method}</b> le <b>{frDate(a.loan_date)}</b>.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed">
          Remboursement <b>{a.due_date ? `au plus tard le ${frDate(a.due_date)}` : "à première demande"}</b>
          {a.motif ? <>, au titre de : <i>{a.motif}</i></> : null}.
        </p>

        {(creditorId || debtorId) && (
          <div className="mt-5 rounded-2xl border border-line bg-paper p-4 text-sm">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-inksoft">Identité des parties</div>
            {creditorId && <div className="mt-1"><span className="text-inksoft">Créancier : </span><b>{creditorId}</b></div>}
            {debtorId && <div className="mt-1"><span className="text-inksoft">Débiteur : </span><b>{debtorId}</b></div>}
          </div>
        )}

        {isAdv && (
          <div className="mt-5 rounded-2xl bg-paper p-4 text-sm">
            <div className="flex justify-between"><span className="text-inksoft">Principal prêté</span><span className="font-semibold tabular-nums">{euros(principal)}</span></div>
            <div className="flex justify-between"><span className="text-inksoft">Frais de signature électronique</span><span className="font-semibold tabular-nums">{euros(fee)}</span></div>
            <div className="mt-1 flex justify-between border-t border-line pt-1 font-bold"><span>Total dû</span><span className="tabular-nums">{euros(a.amount_cents)}</span></div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-paper p-4 text-sm">
          <div><div className="text-xs text-inksoft">Montant dû</div><div className="font-bold">{euros(a.amount_cents)}</div></div>
          <div><div className="text-xs text-inksoft">Moyen</div><div className="font-bold">{a.method}</div></div>
          <div><div className="text-xs text-inksoft">Date du prêt</div><div className="font-bold">{frDate(a.loan_date)}</div></div>
          <div><div className="text-xs text-inksoft">Échéance</div><div className="font-bold">{a.due_date ? frDate(a.due_date) : "À première demande"}</div></div>
        </div>

        <p className="mt-4 text-xs italic leading-relaxed text-inksoft">
          Somme exprimée en chiffres et en toutes lettres. Conformément à l&apos;article 1376 du Code civil,
          en cas de différence, la somme exprimée en toutes lettres prévaut.
        </p>

        <div className="mt-6">
          <SignForm token={a.id} alreadySigned={alreadySigned} debtor={debtor} amount={euros(a.amount_cents)} />
        </div>
      </div>

      <div className="mt-4 text-center">
        <a href={`/api/pdf/${a.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          📄 Télécharger le PDF de la reconnaissance
        </a>
      </div>
      <p className="mt-3 text-center text-xs text-inksoft">
        Signer est <b>gratuit</b> et ne nécessite aucune inscription. L&apos;Ardoise conserve une trace horodatée.
      </p>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center px-6 text-center text-inksoft">{children}</main>;
}
