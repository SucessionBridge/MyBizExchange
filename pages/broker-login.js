// pages/broker-login.js
import { useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function BrokerLogin() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  async function sendMagicLink(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      // Store intended next path so /auth/callback can pick it up if needed
      localStorage.setItem('pendingNext', '/broker');

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // This tells Supabase to send users back to our callback,
          // and our callback will then forward to /broker-dashboard.
          emailRedirectTo:
            'https://successionbridge-mvp3-0-clean.vercel.app/auth/callback?next=/broker',
        },
      });

      if (error) {
        setStatus('error');
        setErrorMsg(error.message || 'Failed to send link');
      } else {
        setStatus('sent');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err?.message || 'Unexpected error');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={sendMagicLink}
        className="w-full max-w-sm space-y-4 border p-6 rounded"
      >
        <h1 className="text-xl font-semibold">Broker Login</h1>

        <label className="block">
          <span className="text-sm">Email</span>
          <input
            className="mt-1 w-full border rounded p-2"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>

        <button
          type="submit"
          disabled={status === 'sending' || !email}
          className="w-full rounded p-2 border"
        >
          {status === 'sending' ? 'Sending…' : 'Send magic link'}
        </button>

        {status === 'sent' && (
          <p className="text-green-700 text-sm">
            Check your email for the login link.
          </p>
        )}
        {status === 'error' && (
          <p className="text-red-700 text-sm">
            {errorMsg || 'There was a problem. Try again.'}
          </p>
        )}
      </form>
    </div>
  );
}
