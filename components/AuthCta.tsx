"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCta({ className }: { className?: string }) {
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

  const href = loggedIn ? "/app" : "/inscription";
  const label = loggedIn ? "Mon ardoise" : "Créer mon ardoise";
  return <a href={href} className={className}>{label}</a>;
}
