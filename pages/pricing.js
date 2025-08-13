import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      setEmail(user?.email || '');
    })();
  }, []);

  const buy = async (plan) => {
    if (!email) {
      alert('Please log in first so we can attach the purchase to your account.');
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    const r = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, email }),
    });
    const data = await r.json();
    if (!r.ok || !data?.url) {
      alert(data?.error || 'Failed to start checkout');
      return;
    }
    window.location.href = data.url;
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <p className="text-gray-700 mt-2">
        Simple, no auto-renew. You’ll get a reminder email 7 days before your plan ends.
      </p>

      <div className="grid sm:grid-cols-3 gap-6 mt-8">
        {[
          { key:'3m', title:'3 Months', price:'$165', note:'$55/mo · one-time', features:['List your business','Messaging','Valuation tool'], },
          { key:'6m', title:'6 Months', price:'$300', note:'$50/mo · one-time', features:['Everything in 3 months','Longer exposure'], },
          { key:'12m', title:'1 Year', price:'$500', note:'Best value · one-time', features:['Everything in 6 months','Full year visibility'], },
        ].map(p => (
          <div key={p.key} className="rounded-xl border shadow-sm p-6 bg-white">
            <h3 className="text-xl font-semibold">{p.title}</h3>
            <div className="mt-2 text-3xl font-bold">{p.price}</div>
            <div className="text-sm text-gray-500">{p.note}</div>
            <ul className="mt-4 text-sm text-gray-700 space-y-1">
              {p.features.map(f => <li key={f}>• {f}</li>)}
            </ul>
            <button
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              onClick={() => buy(p.key)}
            >
              Get {p.title}
            </button>
            <div className="mt-3 text-xs text-gray-500">
              No auto-renew. We’ll email you a renewal link 7 days before expiry.
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-xs text-gray-500">
        Typical SMB sale timelines range ~100–180 days; duration varies by industry, price, and preparedness.
      </div>
    </main>
  );
}
