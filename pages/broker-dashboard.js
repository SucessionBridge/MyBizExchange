// pages/broker-dashboard.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import supabase from '../lib/supabaseClient';

export default function BrokerDashboard() {
  const [broker, setBroker] = useState(null);
  const [threads, setThreads] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login?role=broker'; return; }

      // Get broker profile (redirect to onboarding if missing)
      const { data: br, error: brErr } = await supabase
        .from('brokers')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (brErr) console.error('broker fetch error', brErr);

      if (!br) { window.location.href = '/broker-onboarding'; return; }
      setBroker(br);

      // Fetch conversations + listings in parallel
      const [thRes, lsRes] = await Promise.all([
        supabase
          .from('broker_conversations')
          .select('*')
          .eq('broker_id', br.id)
          .order('last_message_at', { ascending: false })
          .limit(50),
        supabase
          .from('sellers')
          .select('id, business_name, location_city, location_state, location, asking_price, created_at')
          .eq('broker_id', br.id)
          .order('created_at', { ascending: false })
      ]);

      setThreads(thRes.data || []);
      setListings(lsRes.data || []);
      setLoading(false);
    })();
  }, []);

  const fmtMoney = (n) =>
    typeof n === 'number' && !Number.isNaN(n) ? `$${n.toLocaleString()}` : '$0';

  const listingLocation = (l) => {
    if (l?.location_city || l?.location_state) {
      const city = l.location_city || '';
      const state = l.location_state ? `, ${l.location_state}` : '';
      return `${city}${state}`.trim();
    }
    return l?.location || '';
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="h-32 bg-gray-50 animate-pulse rounded" />
        <div className="h-64 bg-gray-50 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Broker Dashboard</h1>
        {!broker?.verified && (
          <span className="px-3 py-1 rounded bg-yellow-100 text-yellow-800">
            Pending verification
          </span>
        )}
        {/* ✅ New listing goes to the broker flow */}
        <Link
          href="/broker/listings/new"
          className="ml-auto px-3 py-2 rounded bg-black text-white"
        >
          + New Listing
        </Link>
      </header>

      {/* Conversations pinned at the top */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Conversations</h2>
        <div className="grid gap-3">
          {(threads || []).map((t) => (
            <Link
              key={`${t.listing_id}-${t.buyer_id}`}
              href={`/messages?listingId=${t.listing_id}&buyerId=${t.buyer_id}`}
              className="flex items-center justify-between border rounded p-3 hover:bg-gray-50"
            >
              <div>
                <div className="text-sm text-gray-600">
                  Listing #{t.listing_id} • Buyer #{t.buyer_id}
                </div>
                <div className="text-xs text-gray-500">
                  Last: {t.last_message_at ? new Date(t.last_message_at).toLocaleString() : '—'}
                </div>
              </div>
              {t.unread_count > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-black text-white">
                  {t.unread_count}
                </span>
              )}
            </Link>
          ))}
          {threads?.length === 0 && (
            <div className="text-sm text-gray-500">No conversations yet.</div>
          )}
        </div>
      </section>

      {/* Listings */}
      <section>
        <h2 className="text-lg font-semibold mb-3">My Listings</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {(listings || []).map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`} className="border rounded p-4 hover:bg-gray-50">
              <div className="font-medium">
                {l.business_name || `Listing #${l.id}`}
              </div>
              <div className="text-sm text-gray-600">
                {listingLocation(l)}
              </div>
              <div className="text-sm mt-1">
                Asking: {fmtMoney(Number(l.asking_price || 0))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Created {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
              </div>
            </Link>
          ))}
          {listings?.length === 0 && (
            <div className="text-sm text-gray-500">No listings assigned.</div>
          )}
        </div>
      </section>
    </div>
  );
}
