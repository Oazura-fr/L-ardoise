"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

/**
 * Lien de retour contextuel :
 * - connecté   → « Mon ardoise » (/app)
 * - visiteur   → « Accueil » (/)
 * Indispensable en PWA installée : il n'y a pas de bouton Précédent du navigateur,
 * donc une page sans retour = utilisateur bloqué.
 */
export default function BackLink({ className = "" }: { className?: string }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) { setLoggedIn(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
  }, []);

  if (loggedIn === null) return null; // évite le clignotement le temps de savoir

  const href = loggedIn ? "/app" : "/";
  const label = loggedIn ? "Mon ardoise" : "Accueil";
  return (
    <a href={href} className={className || "inline-flex items-center gap-1 text-sm font-semibold text-inksoft hover:text-accent"}>
      <ArrowLeft size={15} /> {label}
    </a>
  );
}
