// lib/supabaseClient.js
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

const supabase = createBrowserSupabaseClient(); // uses NEXT_PUBLIC_SUPABASE_URL and KEY

export default supabase;

