import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

let supabase;

if (!supabase) {
  supabase = createBrowserSupabaseClient();
}

export default supabase;
