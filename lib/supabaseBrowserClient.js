// lib/supabaseBrowserClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

let _client;
function getSupabase() {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
}

// Default export: a proxy that is BOTH callable and has client props
const supabase = new Proxy(function () {}, {
  get(_t, prop) {
    // allow: supabase.auth.getUser(), supabase.from(...), etc.
    return getSupabase()[prop];
  },
  apply() {
    // allow: const s = supabase(); (returns the client)
    return getSupabase();
  },
});

export default supabase;     // works as an object AND a function
export { getSupabase };      // optional named export if you want it

