// lib/supabaseClient.js
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

const supabase = createBrowserSupabaseClient(); // automatically uses env vars

export default supabase;
