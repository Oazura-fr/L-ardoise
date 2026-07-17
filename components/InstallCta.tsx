"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

type BipEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Bouton d'installation de la PWA.
 * - Android/Chrome/Edge : utilise l'événement beforeinstallprompt (installation en 1 clic).
 * - iOS/Safari : pas d'API → on affiche la marche à suivre (Partager → Sur l'écran d'accueil).
 * - Déjà installée / non installable : le composant ne s'affiche pas.
 */
export default function InstallCta({ label = "Installer l'app", className = "" }: { label?: string; className?: string }) {
  const [deferred, setDeferred] = useState<BipEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) { setInstalled(true); return; }

    const ua = window.navigator.userAgent || "";
    setIsIos(/iphone|ipad|ipod/i.test(ua));

    const onBip = (e: Event) => { e.preventDefault(); setDeferred(e as BipEvent); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (installed) return null;
  if (!deferred && !isIos) return null; // navigateur non compatible → on n'affiche rien

  const base =
    className ||
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate2 px-5 py-3 font-semibold text-chalk shadow-card";

  return (
    <>
      <button onClick={() => (deferred ? install() : setIosHelp((v) => !v))} className={base}>
        <Download size={17} /> {label}
      </button>
      {iosHelp && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-inksoft">
          <Share size={13} /> Appuie sur <b>Partager</b> puis <b>« Sur l&apos;écran d&apos;accueil »</b>.
        </p>
      )}
    </>
  );
}
