// pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    setLoading(false);

    if (error) {
      alert('❌ Error sending Magic Link: ' + error.message);
    } else {
      alert('✅ Check your email for the Magic Link to log in.');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      alert('❌ Google sign-in failed: ' + error.message);
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

        <div className="mt-6 text-center">
          <p className="text-gray-500 mb-2">OR</p>
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </main>
  );
}

