import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqccgmgycvaahjwbnhze.supabase.co';
const supabaseAnonKey = 'your-anon-key'; // must be anon, not service role

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
