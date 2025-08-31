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

// Normalize legacy / bad paths written by older flows
function normalizeNext(path) {
  if (!path) return '/';
  if (path === '/broker/dashboard') return '/broker-dashboard'; // legacy wrong path
  // add other one-off corrections here if needed
  return path;
}

// If user has a broker profile, keep them out of buyer pages by mistake
async function chooseDest(nextPath) {
  const normalized = normalizeNext(safeNext(nextPath || '/'));

  // Only override when they'd otherwise land on buyer pages
  if (normalized !== '/buyer-onboarding' && normalized !== '/buyer-dashboard') {
    return normalized;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return normalized;

    const { data: br } = await supabase
      .from('brokers')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    // If they are a broker, prefer broker dashboard over buyer pages
    if (br?.id) return '/broker-dashboard';
  } catch {
    // ignore and fall through
  }

  return normalized;
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
        const rawNext = nextParam || pendingNext || '/';

        // --- HASH flow: #access_token & #refresh_token ---
        const hash = url.hash?.startsWith('#') ? url.hash.slice(1) : '';
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            localStorage.removeItem('pendingNext');
            const dest = await chooseDest(rawNext);
            router.replace(dest);
            return;
          }
        }

        // --- CODE flow: ?code= ---
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            localStorage.removeItem('pendingNext');
            const dest = await chooseDest(rawNext);
            router.replace(dest);
            return;
          }
        }

        // --- Fallback: wait briefly for session event, then check directly ---
        const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session) {
            localStorage.removeItem('pendingNext');
            const dest = await chooseDest(rawNext);
            router.replace(dest);
          }
        });
        unsub = data?.subscription;

        // If nothing after ~1.2s, check once & then punt to /login (preserving next)
        timer = setTimeout(async () => {
          const { data: s } = await supabase.auth.getSession();
          if (s?.session) {
            localStorage.removeItem('pendingNext');
            const dest = await chooseDest(rawNext);
            router.replace(dest);
          } else {
            const safe = normalizeNext(safeNext(rawNext));
            router.replace('/login' + (safe && safe !== '/' ? `?next=${encodeURIComponent(safe)}` : ''));
          }
        }, 1200);
      } catch (err) {
        console.error('Auth callback fatal:', err);
        router.replace('/login');
      }
    })();

    return () => {
      if (unsub) unsub.unsubscribe?.();
      if (timer) clearTimeout(timer);
    };
  }, [router.isReady]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Signing you in…
    </div>
  );
}


