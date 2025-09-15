// pages/broker-login.js
import { useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function BrokerLogin() {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  function normalize(val) {
    return String(val || '').trim().toLowerCase();
  }

  async function sendMagicLink(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const e1 = normalize(email);
    const e2 = normalize(confirmEmail);

    if (!e1 || !e2) {
      setStatus('error');
      setErrorMsg('Please enter your email in both fields.');
      return;
    }
    if (e1 !== e2) {
      setStatus('error');
      setErrorMsg('Emails do not match. Please check and try again.');
      return;
    }

    try {
      // Let /auth/callback decide the final redirect; stash a hint for it
      try {
        localStorage.setItem('pendingNext', '/broker-dashboard');
      } catch {}

      const { error } = await supabase.auth.signInWithOtp({
        email: e1,
        options: {
          emailRedirectTo:
            'https://successionbridge-mvp3-0-clean.vercel.app/auth/callback?next=/broker-dashboard',
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
        className="w-full max-w-sm space-y-4 border p-6 rounded bg-white"
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
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="text-sm">Confirm Email</span>
          <input
            className="mt-1 w-full border rounded p-2"
            type="email"
            required
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </label>

        <button
          type="submit"
          disabled={status === 'sending' || !email || !confirmEmail}
          className="w-full rounded p-2 border bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
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
