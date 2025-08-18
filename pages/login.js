import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';
import { useSession } from '@supabase/auth-helpers-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const session = useSession();
  const router = useRouter();

  // role & next handling (adds broker support; doesn't change buyer flow)
  const isBroker = router?.query?.role === 'broker';
  const explicitNext = typeof router?.query?.next === 'string' ? router.query.next : null;
  const nextPath = explicitNext || (isBroker ? '/broker-onboarding' : null);

  // If user is logged in, keep your original buyer redirect logic
  useEffect(() => {
    if (session?.user) {
      const checkProfile = async () => {
        const { data: buyer } = await supabase
          .from('buyers')
          .select('id')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        if (buyer) {
          router.replace('/buyer-dashboard');
        } else {
          router.replace('/buyer-onboarding');
        }
      };
      checkProfile();
    }
  }, [session, router]);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);

    const callbackUrl = `${window.location.origin}/auth/callback${
      nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''
    }`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl }
    });

    setLoading(false);

    if (error) {
      alert('❌ Error sending Magic Link: ' + error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">Login</h1>
        {isBroker && (
          <p className="text-sm text-gray-600 mb-4 text-center">
            You’re logging in as a <strong>Broker</strong>.
          </p>
        )}

        {sent ? (
          <div className="p-4 border rounded bg-gray-50 text-sm text-center">
            ✅ Check your email for the Magic Link to continue.
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <input
              type="email"
              className="w-full p-3 border rounded"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              {loading
                ? 'Sending Magic Link...'
                : isBroker
                ? 'Send Broker Login Link'
                : 'Send Magic Link'}
            </button>
          </form>
        )}

        {!isBroker && (
          <div className="mt-4 text-sm text-center">
            Are you a broker?{' '}
            <a href="/login?role=broker" className="underline">
              Broker Login
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

