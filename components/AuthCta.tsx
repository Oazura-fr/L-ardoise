"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCta({ className }: { className?: string }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) { setLoggedIn(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
  }, []);

  const href = loggedIn ? "/app" : "/inscription";
  const label = loggedIn ? "Mon ardoise" : "Créer mon ardoise";
  return <a href={href} className={className}>{label}</a>;
}
