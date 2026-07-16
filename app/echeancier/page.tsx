"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { euros } from "@/lib/montant";
import BottomNav from "@/components/BottomNav";

type Ack = {
  id: string;
  amount_cents: number;
  due_date: string | null;
  motif: string | null;
  method: string;
  creditor_user_id: string | null;
  debtor_user_id: string | null;
  repayments: { amount_cents: number }[];
  debtor_contact: { first_name: string; phone: string | null } | null;
  creditor_contact: { first_name: string; phone: string | null } | null;
};

type Row = {
  id: string;
  iAmCreditor: boolean;
  name: string;
  phone: string | null;
  remaining: number;
  due: string;
  motif: string | null;
};

function waLink(phone: string | null, msg: string): string {
  const text = encodeURIComponent(msg);
  if (!phone) return `https://wa.me/?text=${text}`;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "33" + d.slice(1);
  return `https://wa.me/${d}?text=${text}`;
}

export default function Echeancier() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/connexion"); return; }
      const uid = session.user.id;
      const { data } = await supabase
        .from("acknowledgments")
        .select("id, amount_cents, due_date, motif, method, creditor_user_id, debtor_user_id, repayments(amount_cents), debtor_contact:contacts!debtor_contact_id(first_name, phone), creditor_contact:contacts!creditor_contact_id(first_name, phone)")
        .not("due_date", "is", null);
      const acks = (data as unknown as Ack[]) || [];
      const list: Row[] = acks
        .map((a) => {
          const iAmCreditor = a.creditor_user_id === uid;
          const repaid = (a.repayments || []).reduce((s, r) => s + r.amount_cents, 0);
          const remaining = a.amount_cents - repaid;
          const cp = iAmCreditor ? a.debtor_contact : a.creditor_contact;
          return { id: a.id, iAmCreditor, name: cp?.first_name || "—", phone: cp?.phone || null, remaining, due: a.due_date as string, motif: a.motif };
        })
        .filter((r) => r.remaining > 0)
        .sort((a, b) => a.due.localeCompare(b.due));
      setRows(list);
      setReady(true);
    })();
  }, [router]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen pb-24">
      <header className="mx-auto max-w-lg px-5 py-5">
        <h1 className="font-display text-2xl font-bold">Échéancier</h1>
        <p className="text-sm text-inksoft">Ce qui arrive à échéance, et les retards.</p>
      </header>

      <div className="mx-auto max-w-lg px-5">
        {!ready ? (
          <p className="py-10 text-center text-inksoft">Chargement…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-line bg-card p-8 text-center text-inksoft shadow-card">
            Aucune échéance planifiée. Ajoute une date de remboursement à une reconnaissance. 🗓️
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {rows.map((r) => {
              const late = r.due < today;
              const [y, m, d] = r.due.split("-").map(Number);
              const mo = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"][m - 1];
              const msg = `Coucou ${r.name} 👋 Petit rappel amical : il reste ${euros(r.remaining)} sur notre ardoise (échéance le ${d} ${mo} ${y}). Merci ! 🙏`;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5 shadow-card">
                  <a href={`/r/${r.id}`} className="flex flex-1 items-center gap-3">
                    <div className={`w-12 flex-none text-center ${late ? "text-debit" : "text-ink"}`}>
                      <div className="font-display text-xl font-bold leading-none">{d}</div>
                      <div className="text-[11px] font-semibold uppercase text-inksoft">{mo}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">
                        {r.name} <span className="font-normal text-inksoft">· {r.iAmCreditor ? "te doit" : "tu dois"}</span>
                      </div>
                      <div className="text-xs">
                        {late ? <span className="font-semibold text-debit">⏰ En retard</span> : <span className="text-inksoft">à venir</span>}
                        {r.motif ? <span className="text-inksoft"> · {r.motif}</span> : null}
                      </div>
                    </div>
                    <div className={`text-sm font-bold tabular-nums ${r.iAmCreditor ? "text-credit" : "text-debit"}`}>{euros(r.remaining)}</div>
                  </a>
                  {r.iAmCreditor && (
                    <a href={waLink(r.phone, msg)} target="_blank" rel="noreferrer"
                      className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[#25D366] text-white" title="Relancer sur WhatsApp">
                      🔔
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
