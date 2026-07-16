"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pass.length < 8) return setError("Le mot de passe doit faire au moins 8 caractères.");
    if (!supabase) return setError("Service indisponible.");
    setBusy(true);
    // La session de récupération est établie via le lien reçu par email.
    const { error: err } = await supabase.auth.updateUser({ password: pass });
    setBusy(false);
    if (err) return setError(err.message || "Lien expiré — redemande un email de réinitialisation.");
    window.location.href = "/app";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <a href="/" className="mb-8 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate2 font-display text-lg font-bold text-chalk">€</div>
        <span className="font-display text-lg font-bold">L&apos;Ardoise</span>
      </a>

      <h1 className="font-display text-3xl font-bold tracking-tight">Nouveau mot de passe</h1>
      <p className="mt-2 text-inksoft">Choisis un nouveau mot de passe pour ton compte.</p>
      <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">
          Nouveau mot de passe
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="8 caractères minimum"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent" />
        </label>
        {error && <p className="rounded-xl bg-debit-soft px-4 py-3 text-sm font-medium text-debit">{error}</p>}
        <button type="submit" disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-pop disabled:opacity-60">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <>Mettre à jour <ArrowRight size={18} /></>}
        </button>
      </form>
    </main>
  );
}
