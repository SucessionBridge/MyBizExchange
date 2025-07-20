import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      setMessage("❌ Magic link login failed. Please try again.");
    } else {
      setMessage("✅ Check your email for the magic login link.");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      setMessage("❌ Google login failed. Please try again.");
    }
  };

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      <form onSubmit={handleMagicLinkLogin} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Send Magic Link
        </button>
      </form>

      <div className="my-4 text-center text-gray-500">OR</div>

      <button
        onClick={handleGoogleLogin}
        className="w-full bg-red-600 text-white py-2 rounded"
      >
        Continue with Google
      </button>

      {message && (
        <p className="mt-4 text-center text-gray-700">{message}</p>
      )}
    </main>
  );
}

