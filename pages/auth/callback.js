// pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseClient';

function safeNext(p) {
  try {
    // Only allow redirects within this site
    const url = new URL(p, window.location.origin);
    if (url.origin !== window.location.origin) return '/sellers';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/sellers';
  }
}

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Turn the code in the URL into a session
      const { error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        console.error('Session error:', error.message);
        router.replace('/login');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const next = safeNext(params.get('next') || '/sellers'); // ⬅️ default /sellers
      router.replace(next);
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Logging you in...
    </div>
  );
}


