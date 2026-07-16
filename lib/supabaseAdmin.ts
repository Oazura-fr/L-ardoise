import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Client Supabase avec la clé service_role — CÔTÉ SERVEUR UNIQUEMENT.
 * Contourne la RLS : à n'utiliser que dans les routes/Edge Functions de confiance
 * (ex. signature par lien d'un invité sans compte). Ne jamais exposer au client.
 */
export const supabaseAdmin: SupabaseClient | null = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;
