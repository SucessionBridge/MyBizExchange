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

    let unsub = null;
    let timer = null;

    (async () => {
      try {
        const url = new URL(window.location.href);
        const nextParam = url.searchParams.get('next');
        const pendingNext = localStorage.getItem('pendingNext');
        const nextDest = safeNext(nextParam || pendingNext || '/');

        // Try HASH flow first: #access_token & #refresh_token
        const hash = url.hash?.startsWith('#') ? url.hash.slice(1) : '';
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            localStorage.removeItem('pendingNext');
            router.replace(nextDest);
            return;
          }
        }

        // Try CODE flow: ?code=
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            localStorage.removeItem('pendingNext');
            router.replace(nextDest);
            return;
          }
        }

        // Fallback: wait briefly for session event, then check directly
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            localStorage.removeItem('pendingNext');
            router.replace(nextDest);
          }
        });
        unsub = data?.subscription;

        // If nothing after ~1.2s, check once & then punt to /login (preserving next)
        timer = setTimeout(async () => {
          const { data: s } = await supabase.auth.getSession();
          if (s?.session) {
            localStorage.removeItem('pendingNext');
            router.replace(nextDest);
          } else {
            router.replace('/login' + (nextDest && nextDest !== '/' ? `?next=${encodeURIComponent(nextDest)}` : ''));
          }
        }, 1200);
      } catch (err) {
        console.error('Auth callback fatal:', err);
        router.replace('/login');
      }
    })();

    return () => {
      if (unsub) unsub.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [router.isReady]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Signing you in…
    </div>
  );
}


