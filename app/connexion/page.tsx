"use client";

import { useState } from "react";
import { supabase, isLive } from "@/lib/supabase";
import { ArrowRight, Loader2 } from "lucide-react";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isLive || !supabase) {
      setError("Mode démo : Supabase pas encore activé.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (err) return setError(err.message);
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-md flex-col px-5 py-8 sm:py-12">
        <a href="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate2 font-display text-lg font-bold text-chalk">€</div>
          <span className="font-display text-lg font-bold">L&apos;Ardoise</span>
        </a>

        <h1 className="font-display text-3xl font-bold tracking-tight">Content de te revoir</h1>
        <p className="mt-2 text-inksoft">Connecte-toi pour retrouver ton ardoise.</p>

        <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">
            Adresse email
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@email.fr"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">
            Mot de passe
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </label>

          {error && <p className="rounded-xl bg-debit-soft px-4 py-3 text-sm font-medium text-debit">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-pop transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Se connecter <ArrowRight size={18} /></>}
          </button>
          <p className="text-center text-sm text-inksoft">
            Pas encore de compte ? <a href="/inscription" className="font-semibold text-accent">Créer mon ardoise</a>
          </p>
        </form>
      </div>
    </main>
  );
}
