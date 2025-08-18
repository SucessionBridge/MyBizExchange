import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';
import { useSession } from '@supabase/auth-helpers-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const session = useSession();
  const router = useRouter();

  // Detect broker role and optional explicit next
  const isBroker = router?.query?.role === 'broker';
  const explicitNext = typeof router?.query?.next === 'string' ? router.query.next : null;
  const nextPath = explicitNext || (isBroker ? '/broker-onboarding' : null);

  // ✅ If user is logged in, redirect away from login page (keeps your existing buyer flow)
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

    // Persist intended destination for hash-based magic-link landings
    localStorage.setItem('pendingNext', nextPath || '/sellers');

    // Build callback URL; include ?next= for broker flow (or any explicit next)
    const callbackUrl = `${window.location.origin}/auth/callback${
      nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''
    }`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl
      }
    });

    setLoading(false);

    if (error) {
      alert('❌ Error sending Magic Link: ' + error.message);
    } else {
      alert('✅ Check your email for the Magic Link to log in.');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>

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
            {loading ? 'Sending Magic Link...' : 'Send Magic Link'}
          </button>
        </form>
      </div>
    </main>
  );
}
