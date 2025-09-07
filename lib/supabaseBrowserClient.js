// lib/supabaseServerClient.js
import { createServerClient } from '@supabase/ssr';
import { serialize, parse } from 'cookie';

const isProd = process.env.NODE_ENV === 'production';

export function getServerSupabaseClient(req, res) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  function appendSetCookie(header) {
    const prev = res.getHeader('Set-Cookie');
    if (!prev) {
      res.setHeader('Set-Cookie', header);
    } else if (Array.isArray(prev)) {
      res.setHeader('Set-Cookie', [...prev, header]);
    } else {
      res.setHeader('Set-Cookie', [prev, header]);
    }
  }

  const cookieStore = {
    get: (name) => parse(req.headers.cookie || '')[name],
    set: (name, value, options = {}) => {
      appendSetCookie(
        serialize(name, value, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: isProd,
          ...options,
        })
      );
    },
    remove: (name, options = {}) => {
      appendSetCookie(
        serialize(name, '', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: isProd,
          maxAge: 0,
          expires: new Date(0),
          ...options,
        })
      );
    },
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: cookieStore }
  );
}
