"use client";

import { useRef, useState } from "react";
import { supabase, isLive } from "@/lib/supabase";
import { ArrowRight, Camera, Loader2 } from "lucide-react";

export default function Inscription() {
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [pass, setPass] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    fileRef.current = f;
    const r = new FileReader();
    r.onload = () => setPhoto(r.result as string);
    r.readAsDataURL(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Ajoute une adresse email valide.");
    if (tel.replace(/\D/g, "").length < 10) return setError("Ajoute un numéro de portable valide.");
    if (pass.length < 8) return setError("Le mot de passe doit faire au moins 8 caractères.");

    if (!isLive || !supabase) {
      setError("Mode démo : Supabase pas encore activé (tables + auth à configurer). Le formulaire est prêt.");
      return;
    }

    setStatus("loading");
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { first_name: prenom || "Moi", phone: tel } },
    });
    if (err) {
      setStatus("idle");
      return setError(err.message);
    }
    // Photo (facultative) : upload si une session est déjà ouverte
    if (fileRef.current && data.user && data.session) {
      const ext = fileRef.current.name.split(".").pop() || "jpg";
      await supabase.storage.from("avatars").upload(`${data.user.id}/profil.${ext}`, fileRef.current, { upsert: true });
    }
    setStatus("done");
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-md flex-col px-5 py-8 sm:py-12">
        <a href="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate2 font-display text-lg font-bold text-chalk">€</div>
          <span className="font-display text-lg font-bold">L&apos;Ardoise</span>
        </a>

        {status === "done" ? (
          <div className="rounded-3xl border border-line bg-card p-8 text-center shadow-card">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-credit-soft text-3xl text-credit">✓</div>
            <h1 className="mt-4 font-display text-2xl font-bold">Presque fini&nbsp;!</h1>
            <p className="mt-2 text-inksoft">
              On t&apos;a envoyé un email à <b>{email}</b> pour confirmer ton compte. Clique le lien et ton ardoise est à toi.
            </p>
            <a href="/" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 font-semibold text-white">
              Retour à l&apos;accueil
            </a>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold tracking-tight">Crée ton ardoise</h1>
            <p className="mt-2 text-inksoft">Gratuit. Ton email et ton mobile sécurisent ton compte.</p>

            <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
              {/* Photo facultative */}
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-accent-soft text-accent">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Camera size={22} />
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                </label>
                <div className="text-sm text-inksoft">
                  Photo de profil<br />
                  <span className="text-xs">facultative</span>
                </div>
              </div>

              <Field label="Prénom">
                <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Ex : Taylan" className={inputCls} />
              </Field>
              <Field label="Adresse email" req>
                <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@email.fr" className={inputCls} />
              </Field>
              <Field label="Numéro de portable" req>
                <input type="tel" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="06 12 34 56 78" className={inputCls} />
              </Field>
              <Field label="Mot de passe" req>
                <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="8 caractères minimum" className={inputCls} />
              </Field>

              {error && <p className="rounded-xl bg-debit-soft px-4 py-3 text-sm font-medium text-debit">{error}</p>}

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white shadow-pop transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {status === "loading" ? <Loader2 size={18} className="animate-spin" /> : <>Créer mon ardoise <ArrowRight size={18} /></>}
              </button>
              <p className="text-center text-sm text-inksoft">
                Déjà un compte ? <a href="/connexion" className="font-semibold text-accent">Se connecter</a>
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent";

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">
      <span>
        {label} {req && <span className="text-debit">obligatoire</span>}
      </span>
      {children}
    </label>
  );
}
