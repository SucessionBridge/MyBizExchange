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
        const url = new URL(window.location.href);

        // prefer ?next=, then localStorage, finally home
        const nextParam = url.searchParams.get('next');
        const pendingNext = localStorage.getItem('pendingNext');
        const nextDest = safeNext(nextParam || pendingNext || '/');

        // 1) HASH flow: #access_token & #refresh_token
        const hash = url.hash?.startsWith('#') ? url.hash.slice(1) : '';
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            console.error('setSession error:', error);
            router.replace('/login');
            return;
          }
          localStorage.removeItem('pendingNext');
          router.replace(nextDest);
          return;
        }

        // 2) CODE flow: ?code=
        const code = url.searchParams.get('code');
        if (code) {
          // explicitly pass code (more reliable if other params are present)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('exchangeCodeForSession error:', error);
            router.replace('/login');
            return;
          }
          localStorage.removeItem('pendingNext');
          router.replace(nextDest);
          return;
        }

        // 3) Fallback: already signed in?
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.removeItem('pendingNext');
          router.replace(nextDest);
          return;
        }

        // Nothing to exchange and no session -> go to login
        router.replace('/login');
      } catch (err) {
        console.error('Auth callback fatal:', err);
        router.replace('/login');
      }
    })();
  }, [router.isReady]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Signing you in…
    </div>
  );
}

