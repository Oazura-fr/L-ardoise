"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

export default function SignForm({
  token,
  alreadySigned,
  debtor,
  amount,
}: {
  token: string;
  alreadySigned: boolean;
  debtor: string;
  amount: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">(alreadySigned ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);

  async function sign() {
    setError(null);
    setState("loading");
    try {
      const r = await fetch(`/api/signer/${token}`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erreur");
      setState("done");
    } catch (e) {
      setState("idle");
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl bg-credit-soft px-5 py-4 text-center">
        <div className="mx-auto mb-1 grid h-10 w-10 place-items-center rounded-full bg-credit text-xl text-white">
          <Check size={20} />
        </div>
        <div className="font-display text-lg font-bold text-credit">Reconnaissance signée</div>
        <p className="mt-1 text-sm text-inksoft">
          Merci ! Ton engagement de <b>{amount}</b> est enregistré avec une trace horodatée.
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={sign}
        disabled={state === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 font-semibold text-white shadow-pop disabled:opacity-60"
      >
        {state === "loading" ? <Loader2 size={18} className="animate-spin" /> : <>✍️ Je signe cette reconnaissance</>}
      </button>
      {error && <p className="mt-2 text-center text-sm font-medium text-debit">{error}</p>}
      <p className="mt-2 text-center text-xs text-inksoft">En signant, {debtor} reconnaît la dette ci-dessus.</p>
    </>
  );
}
