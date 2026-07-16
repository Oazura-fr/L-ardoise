import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Client Supabase public (navigateur et serveur) — null si non configuré (mode démo). */
export const supabase: SupabaseClient | null = url && key
  ? createClient(url, key)
  : null;

/** true dès que Supabase est branché (clés présentes). */
export const isLive = Boolean(url && key);
