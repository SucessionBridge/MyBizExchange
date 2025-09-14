// pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

function normalizeNext(p) {
  try {
    const url = new URL(p, window.location.origin);
    // only allow internal redirects
    if (url.origin !== window.location.origin) return '/';

    // fold legacy broker paths to the canonical route
    if (url.pathname === '/broker/dashboard' || url.pathname === '/broker') {
      url.pathname = '/broker-dashboard';
      url.search = ''; // drop any accidental extra params
      url.hash = '';
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
}

// If nextDest is "/" (or missing), choose a smart destination by role/profile
async function chooseHomeDestination(nextDest) {
  if (nextDest && nextDest !== '/') return nextDest;

  const { data: s } = await supabase.auth.getSession();
  const uid = s?.session?.user?.id;
  if (!uid) return '/';

  // Prefer broker if they have a broker row
  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_id', uid)
    .maybeSingle();
  if (broker?.id) return '/broker-dashboard';

  // Otherwise buyer if they have a buyer row
  const { data: buyer } = await supabase
    .from('buyers')
    .select('id')
    .eq('auth_id', uid)
    .maybeSingle();
  if (buyer?.id) return '/buyer-dashboard';

  // Fallback for brand-new users
  return '/buyer-onboarding';
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

        // prefer ?next=, then localStorage, finally home — all normalized
        const nextParam = url.searchParams.get('next');
        const pendingNext = localStorage.getItem('pendingNext');
        const rawNext = nextParam || pendingNext || '/';
        const nextDest = normalizeNext(rawNext);

        // HASH flow: #access_token & #refresh_token
        const hash = url.hash?.startsWith('#') ? url.hash.slice(1) : '';
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            localStorage.removeItem('pendingNext');
            router.replace(await chooseHomeDestination(nextDest));
            return;
          }
        }

        // CODE flow: ?code=
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            localStorage.removeItem('pendingNext');
            router.replace(await chooseHomeDestination(nextDest));
            return;
          }
        }

        // Fallback: wait for session event, then check once
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            localStorage.removeItem('pendingNext');
            chooseHomeDestination(nextDest).then((dest) => router.replace(dest));
          }
        });
        unsub = data?.subscription;

        timer = setTimeout(async () => {
          const { data: s } = await supabase.auth.getSession();
          if (s?.session) {
            localStorage.removeItem('pendingNext');
            router.replace(await chooseHomeDestination(nextDest));
          } else {
            router.replace(
              '/login' + (nextDest && nextDest !== '/' ? `?next=${encodeURIComponent(nextDest)}` : '')
            );
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
