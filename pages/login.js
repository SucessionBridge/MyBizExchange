// pages/login.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';
import { useSession } from '@supabase/auth-helpers-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const session = useSession();
  const router = useRouter();

  // --- NEW: sanitize/normalize next destinations (handles old /broker/dashboard) ---
  function sanitizeNext(p) {
    try {
      if (!p) return null;
      const url = new URL(p, window.location.origin);
      // only allow internal redirects
      if (url.origin !== window.location.origin) return null;

      // normalize legacy broker paths to the canonical route
      if (url.pathname === '/broker/dashboard' || url.pathname === '/broker') {
        url.pathname = '/broker-dashboard';
        url.search = '';
        url.hash = '';
      }
      return url.pathname + url.search + url.hash;
    } catch {
      return null;
    }
  }

  // Detect broker role and optional explicit next (only once router is ready)
  const isBroker = router?.isReady && router?.query?.role === 'broker';
  const explicitNext = router?.isReady ? sanitizeNext(router?.query?.next) : null;

  // Default broker next goes to /broker-dashboard
  const nextPath = explicitNext || (isBroker ? '/broker-dashboard' : null);

  // If user is logged in, send them somewhere useful
  useEffect(() => {
    if (!router.isReady || !session?.user) return;

    (async () => {
      const authId = session.user.id;

      // Prefer broker flow if either (a) they came via ?role=broker OR (b) they already have a broker row
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('auth_id', authId)
        .maybeSingle();

      if (isBroker || broker) {
        router.replace(broker ? '/broker-dashboard' : '/broker-onboarding');
        return;
      }

      // Otherwise follow the original buyer-first behavior
      const { data: buyer } = await supabase
        .from('buyers')
        .select('id')
        .eq('auth_id', authId)
        .maybeSingle();

      router.replace(buyer ? '/buyer-dashboard' : '/buyer-onboarding');
    })();
  }, [router.isReady, session, isBroker, router]);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Persist intended destination for hash-based magic-link landings
      localStorage.setItem('pendingNext', nextPath || '/');

      // Build callback URL; include ?next= when we have one (already sanitized)
      const callbackUrl = `${window.location.origin}/auth/callback${
        nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''
      }`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl },
      });

      if (error) {
        alert('❌ Error sending Magic Link: ' + error.message);
      } else {
        alert('✅ Check your email for the Magic Link to log in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {isBroker ? 'Broker Login' : 'Login'}
        </h1>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            className="w-full p-3 border rounded"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-60"
          >
            {loading ? 'Sending Magic Link...' : 'Send Magic Link'}
          </button>
        </form>
      </div>
    </main>
  );
}
