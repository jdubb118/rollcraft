import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Vite exposes anything prefixed with VITE_ to the client bundle.
// Set these in .env.local (dev) and Netlify env vars (prod).
const url     = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!url || !anonKey) return null;
  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'grapple-quest-auth',
    },
  });
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!(url && anonKey);
}
