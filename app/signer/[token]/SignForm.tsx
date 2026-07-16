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
  const [prenom, setPrenom] = useState(debtor && debtor !== "l'emprunteur" ? debtor : "");
  const [nom, setNom] = useState("");
  const [naissance, setNaissance] = useState("");
  const [adresse, setAdresse] = useState("");
  const [emailS, setEmailS] = useState("");

  async function sign() {
    setError(null);
    if (!prenom.trim() || !nom.trim()) return setError("Indique ton prénom et ton nom.");
    if (!naissance) return setError("Indique ta date de naissance.");
    if (!adresse.trim()) return setError("Indique ton adresse.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailS)) return setError("Ajoute ton email pour recevoir le PDF.");
    setState("loading");
    try {
      const r = await fetch(`/api/signer/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: prenom.trim(),
          last_name: nom.trim(),
          birth_date: naissance,
          address: adresse.trim(),
          email: emailS.trim(),
        }),
      });
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

  const inp = "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent";

  return (
    <>
      <div className="mb-4 rounded-2xl bg-paper p-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-inksoft">Ton identité (pour valider)</div>
        <div className="grid grid-cols-2 gap-2">
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" className={inp} />
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className={inp} />
        </div>
        <label className="mt-2 block text-xs font-semibold text-inksoft">Date de naissance
          <input type="date" value={naissance} onChange={(e) => setNaissance(e.target.value)} className={`${inp} mt-1`} />
        </label>
        <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Adresse" className={`${inp} mt-2`} />
        <input type="email" inputMode="email" value={emailS} onChange={(e) => setEmailS(e.target.value)} placeholder="Ton email (pour recevoir le PDF)" className={`${inp} mt-2`} />
      </div>

      <button
        onClick={sign}
        disabled={state === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 font-semibold text-white shadow-pop disabled:opacity-60"
      >
        {state === "loading" ? <Loader2 size={18} className="animate-spin" /> : <>✍️ Je signe cette reconnaissance</>}
      </button>
      {error && <p className="mt-2 text-center text-sm font-medium text-debit">{error}</p>}
      <p className="mt-2 text-center text-xs text-inksoft">En signant, tu reconnais la dette ci-dessus.</p>
    </>
  );
}
