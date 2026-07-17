"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * variant "cta"   → "Créer mon ardoise" (ou "Mon ardoise" si connecté)
 * variant "login" → "Se connecter" (masqué si déjà connecté)
 */
export default function AuthCta({ className, variant = "cta" }: { className?: string; variant?: "cta" | "login" }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) { setLoggedIn(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      // Arrivée depuis la confirmation d'email (#access_token) → on file au dashboard.
      if (session && typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        window.location.replace("/app");
      }
    });
  }, []);

  if (variant === "login") {
    if (loggedIn !== false) return null; // rien tant qu'on ne sait pas, ni si déjà connecté
    return <a href="/connexion" className={className}>Se connecter</a>;
  }

  const href = loggedIn ? "/app" : "/inscription";
  const label = loggedIn ? "Mon ardoise" : "Créer mon ardoise";
  return <a href={href} className={className}>{label}</a>;
}
