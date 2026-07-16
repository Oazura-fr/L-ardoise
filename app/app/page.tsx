"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { euros } from "@/lib/montant";
import { Plus, LogOut, ArrowUpRight, ArrowDownRight } from "lucide-react";

type Ack = {
  id: string;
  amount_cents: number;
  method: string;
  due_date: string | null;
  motif: string | null;
  status: string;
  creditor_user_id: string | null;
  debtor_user_id: string | null;
  repayments: { amount_cents: number }[];
  debtor_contact: { first_name: string } | null;
  creditor_contact: { first_name: string } | null;
};

type Row = {
  id: string;
  direction: "credit" | "debit";
  name: string;
  motif: string | null;
  method: string;
  due: string | null;
  amount: number;
  remaining: number;
  settled: boolean;
};

export default function Dashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/connexion");
        return;
      }
      const uid = session.user.id;

      const { data: prof } = await supabase.from("profiles").select("first_name").eq("id", uid).single();
      setPrenom(prof?.first_name || "");

      const { data } = await supabase
        .from("acknowledgments")
        .select(
          "id, amount_cents, method, due_date, motif, status, creditor_user_id, debtor_user_id, repayments(amount_cents), debtor_contact:contacts!debtor_contact_id(first_name), creditor_contact:contacts!creditor_contact_id(first_name)"
        )
        .order("created_at", { ascending: false });

      const acks = (data as unknown as Ack[]) || [];
      setRows(
        acks.map((a) => {
          const iAmCreditor = a.creditor_user_id === uid;
          const repaid = (a.repayments || []).reduce((s, r) => s + r.amount_cents, 0);
          const remaining = a.amount_cents - repaid;
          const cp = iAmCreditor ? a.debtor_contact : a.creditor_contact;
          return {
            id: a.id,
            direction: iAmCreditor ? "credit" : "debit",
            name: cp?.first_name || "—",
            motif: a.motif,
            method: a.method,
            due: a.due_date,
            amount: a.amount_cents,
            remaining,
            settled: remaining <= 0,
          };
        })
      );
      setReady(true);
    })();
  }, [router]);

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    router.replace("/");
  }

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="animate-pulse text-inksoft">Chargement de ton ardoise…</div>
      </main>
    );
  }

  const credit = rows.filter((r) => r.direction === "credit" && !r.settled);
  const debit = rows.filter((r) => r.direction === "debit" && !r.settled);
  const settled = rows.filter((r) => r.settled);
  const sumCredit = credit.reduce((s, r) => s + r.remaining, 0);
  const sumDebit = debit.reduce((s, r) => s + r.remaining, 0);
  const net = sumCredit - sumDebit;

  return (
    <main className="min-h-screen pb-28">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate2 font-display text-lg font-bold text-chalk">€</div>
          <span className="font-display text-lg font-bold">L&apos;Ardoise</span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-inksoft hover:border-accent">
          <LogOut size={15} /> Quitter
        </button>
      </header>

      <div className="mx-auto max-w-3xl px-5">
        {prenom && <p className="text-inksoft">Salut <span className="font-semibold text-ink">{prenom}</span> 👋</p>}
        <p className="mt-0.5 font-display text-lg italic text-inksoft">« Les bons comptes font les bons amis. »</p>

        {/* Solde */}
        <section className="mt-3 rounded-3xl border border-line bg-card p-6 shadow-card">
          <div className="text-xs font-bold uppercase tracking-wide text-inksoft">Ton solde entre proches</div>
          <div className={`mt-1 font-display text-4xl font-bold tabular-nums ${net >= 0 ? "text-credit" : "text-debit"}`}>
            {net >= 0 ? "+ " : "− "}{euros(Math.abs(net))}
          </div>
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-2xl bg-credit-soft px-4 py-3">
              <div className="text-xs font-semibold text-credit">On me doit</div>
              <div className="font-display text-xl font-bold tabular-nums text-credit">{euros(sumCredit)}</div>
            </div>
            <div className="flex-1 rounded-2xl bg-debit-soft px-4 py-3">
              <div className="text-xs font-semibold text-debit">Je dois</div>
              <div className="font-display text-xl font-bold tabular-nums text-debit">{euros(sumDebit)}</div>
            </div>
          </div>
        </section>

        {/* Colonnes */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Column title="Je dois" color="debit" rows={debit} empty="Tu ne dois rien à personne 🎉" />
          <Column title="On me doit" color="credit" rows={credit} empty="Personne ne te doit rien… pour l'instant." />
        </div>

        {settled.length > 0 && (
          <section className="mt-5 rounded-3xl border border-line bg-card p-5 shadow-card">
            <div className="mb-2 text-sm font-bold">✅ Réglés ({settled.length})</div>
            {settled.map((r) => (
              <RowLine key={r.id} r={r} muted />
            ))}
          </section>
        )}
      </div>

      <a
        href="/creer"
        className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-pop"
      >
        <Plus size={20} /> Nouvelle reconnaissance
      </a>
    </main>
  );
}

function Column({ title, color, rows, empty }: { title: string; color: "credit" | "debit"; rows: Row[]; empty: string }) {
  return (
    <section className="rounded-3xl border border-line bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2 font-bold">
          <span className={`h-2.5 w-2.5 rounded-full ${color === "credit" ? "bg-credit" : "bg-debit"}`} />
          {title}
        </div>
        <div className={`font-bold tabular-nums ${color === "credit" ? "text-credit" : "text-debit"}`}>
          {euros(rows.reduce((s, r) => s + r.remaining, 0))}
        </div>
      </div>
      <div className="p-2">
        {rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-inksoft">{empty}</p>
        ) : (
          rows.map((r) => <RowLine key={r.id} r={r} />)
        )}
      </div>
    </section>
  );
}

function RowLine({ r, muted }: { r: Row; muted?: boolean }) {
  const isCredit = r.direction === "credit";
  return (
    <a href={`/r/${r.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-paper">
      <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white ${isCredit ? "bg-credit" : "bg-debit"}`}>
        {r.name[0]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold leading-tight">{r.name}</div>
        <div className="flex items-center gap-1 text-xs text-inksoft">
          {r.method}
          {r.motif ? ` · ${r.motif}` : ""}
        </div>
      </div>
      <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${muted ? "text-inksoft line-through" : isCredit ? "text-credit" : "text-debit"}`}>
        {isCredit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {euros(r.settled ? r.amount : r.remaining)}
      </div>
    </a>
  );
}
