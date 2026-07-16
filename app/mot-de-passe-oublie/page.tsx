"use client";

import { useState } from "react";
import { supabase, isLive } from "@/lib/supabase";
import { ArrowRight, Loader2, Check } from "lucide-react";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Ajoute une adresse email valide.");
    if (!isLive || !supabase) return setError("Mode démo : Supabase non configuré.");
    setState("loading");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) { setState("idle"); return setError(err.message); }
    setState("done");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <a href="/" className="mb-8 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate2 font-display text-lg font-bold text-chalk">€</div>
        <span className="font-display text-lg font-bold">L&apos;Ardoise</span>
      </a>

      {state === "done" ? (
        <div className="rounded-3xl border border-line bg-card p-8 text-center shadow-card">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-credit-soft text-3xl text-credit"><Check size={30} /></div>
          <h1 className="mt-4 font-display text-2xl font-bold">Email envoyé</h1>
          <p className="mt-2 text-inksoft">On a envoyé un lien de réinitialisation à <b>{email}</b>. Clique dessus pour choisir un nouveau mot de passe.</p>
          <a href="/connexion" className="mt-6 inline-block text-sm font-semibold text-accent">Retour à la connexion</a>
        </div>
      ) : (
        <>
          <h1 className="font-display text-3xl font-bold tracking-tight">Mot de passe oublié ?</h1>
          <p className="mt-2 text-inksoft">Pas de souci. Indique ton email, on t&apos;envoie un lien pour le réinitialiser.</p>
          <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">
              Adresse email
              <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@email.fr"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent" />
            </label>
            {error && <p className="rounded-xl bg-debit-soft px-4 py-3 text-sm font-medium text-debit">{error}</p>}
            <button type="submit" disabled={state === "loading"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-pop disabled:opacity-60">
              {state === "loading" ? <Loader2 size={18} className="animate-spin" /> : <>Envoyer le lien <ArrowRight size={18} /></>}
            </button>
            <a href="/connexion" className="text-center text-sm font-semibold text-inksoft">Retour à la connexion</a>
          </form>
        </>
      )}
    </main>
  );
}
