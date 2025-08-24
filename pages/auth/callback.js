// pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

function safeNext(p) {
  try {
    const url = new URL(p, window.location.origin);
    if (url.origin !== window.location.origin) return '/';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
}

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    (async () => {
      try {
        const href = window.location.href;
        const url = new URL(href);

        // prefer ?next=, then localStorage, finally home
        const nextParam = url.searchParams.get('next');
        const pendingNext = localStorage.getItem('pendingNext');
        const nextDest = safeNext(nextParam || pendingNext || '/');

        // --- PRIMARY PATH: Supabase v2 recommended call (parses ?code or #fragment) ---
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(href);
          if (!error) {
            // success
            try { localStorage.removeItem('pendingNext'); } catch {}
            router.replace(nextDest);
            return;
          }
          // if error, we'll fall back below
          console.warn('exchangeCodeForSession failed, trying fallbacks:', error?.message);
        } catch (e) {
          console.warn('exchangeCodeForSession threw, trying fallbacks:', e?.message);
        }

        // --- FALLBACK 1: old hash-based links (#access_token / #refresh_token) ---
        const hash = url.hash?.startsWith('#') ? url.hash.slice(1) : '';
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            try { localStorage.removeItem('pendingNext'); } catch {}
            router.replace(nextDest);
            return;
          }
          console.error('setSession error:', error);
          router.replace('/login');
          return;
        }

        // --- FALLBACK 2: maybe the session is already set ---
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try { localStorage.removeItem('pendingNext'); } catch {}
          router.replace(nextDest);
          return;
        }

        // Nothing worked → back to login
        router.replace('/login');
      } catch (err) {
        console.error('Auth callback fatal:', err);
        router.replace('/login');
      }
    })();
  }, [router.isReady, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Signing you in…
    </div>
  );
}

