"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import { LogOut, Check, Loader2 } from "lucide-react";

export default function Profil() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("gratuit");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [naissance, setNaissance] = useState("");
  const [adresse, setAdresse] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/connexion"); return; }
      setUid(session.user.id);
      setEmail(session.user.email || "");
      const { data } = await supabase.from("profiles")
        .select("first_name, last_name, phone, birth_date, address, plan, photo_url")
        .eq("id", session.user.id).single();
      if (data) {
        setPrenom(data.first_name || ""); setNom(data.last_name || "");
        setTel(data.phone || ""); setNaissance(data.birth_date || "");
        setAdresse(data.address || ""); setPlan(data.plan || "gratuit");
        setPhotoUrl(data.photo_url || null);
      }
      setReady(true);
    })();
  }, [router]);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !supabase || !uid) return;
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${uid}/profil.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, f, { upsert: true });
    if (upErr) return;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    await supabase.from("profiles").update({ photo_url: url }).eq("id", uid);
    setPhotoUrl(url);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !uid) return;
    setBusy(true);
    await supabase.from("profiles").update({
      first_name: prenom.trim(), last_name: nom.trim(), phone: tel.trim(),
      birth_date: naissance || null, address: adresse.trim(),
    }).eq("id", uid);
    setBusy(false);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    router.replace("/");
  }

  if (!ready) return <main className="grid min-h-screen place-items-center text-inksoft">Chargement…</main>;

  return (
    <main className="min-h-screen pb-24">
      <div className="mx-auto max-w-lg px-5 py-6">
        <h1 className="font-display text-2xl font-bold">Mon profil</h1>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-card">
          <label className="relative cursor-pointer">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-accent text-lg font-bold text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : (prenom[0] || "M").toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-slate2 text-[11px]">📷</span>
            <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          </label>
          <div className="min-w-0">
            <div className="font-semibold">{prenom} {nom}</div>
            <div className="truncate text-sm text-inksoft">{email}</div>
          </div>
          <span className="ml-auto rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">{plan === "premium" ? "Premium" : "Gratuit"}</span>
        </div>

        <form onSubmit={save} className="mt-5 flex flex-col gap-4 rounded-3xl border border-line bg-card p-5 shadow-card">
          <div className="text-sm font-bold">Mon identité</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom"><input value={prenom} onChange={(e) => setPrenom(e.target.value)} className={inp} /></Field>
            <Field label="Nom"><input value={nom} onChange={(e) => setNom(e.target.value)} className={inp} /></Field>
          </div>
          <Field label="Date de naissance"><input type="date" value={naissance} onChange={(e) => setNaissance(e.target.value)} className={inp} /></Field>
          <Field label="Adresse"><input value={adresse} onChange={(e) => setAdresse(e.target.value)} className={inp} /></Field>
          <Field label="Numéro de portable"><input inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} className={inp} /></Field>
          <button type="submit" disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 font-semibold text-white disabled:opacity-60">
            {busy ? <Loader2 size={18} className="animate-spin" /> : saved ? <><Check size={18} /> Enregistré</> : "Enregistrer"}
          </button>
        </form>

        <button onClick={logout} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white px-6 py-3 font-semibold text-debit">
          <LogOut size={17} /> Se déconnecter
        </button>
      </div>
      <BottomNav />
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-sm font-semibold text-inksoft">{label}{children}</label>;
}

const inp = "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent";
