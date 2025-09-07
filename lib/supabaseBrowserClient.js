// lib/supabaseServerClient.js
import { createServerClient } from '@supabase/ssr';
import { serialize, parse } from 'cookie';

export function getServerSupabaseClient(req, res) {
  const cookieStore = {
    get: (name) => parse(req.headers.cookie || '')[name],
    set: (name, value, options) => {
      res.setHeader('Set-Cookie', serialize(name, value, { path: '/', ...options }));
    },
    remove: (name, options) => {
      res.setHeader('Set-Cookie', serialize(name, '', { path: '/', maxAge: 0, ...options }));
    },
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: cookieStore }
  );
}
