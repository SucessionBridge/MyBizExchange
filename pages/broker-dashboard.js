// pages/broker-dashboard.js
import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function BrokerDashboard() {
  const [broker, setBroker] = useState(null);
  const [threads, setThreads] = useState([]);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href='/login?role=broker'; return; }

      const { data: br } = await supabase.from('brokers').select('*').eq('auth_id', user.id).single();
      if (!br) { window.location.href='/broker-onboarding'; return; }
      setBroker(br);

      const { data: th } = await supabase
        .from('broker_conversations')
        .select('*')
        .eq('broker_id', br.id)
        .order('last_message_at', { ascending: false })
        .limit(50);
      setThreads(th || []);

      const { data: ls } = await supabase
        .from('sellers')
        .select('id, business_name, city, state, asking_price, created_at')
        .eq('broker_id', br.id)
        .order('created_at', { ascending: false });
      setListings(ls || []);
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Broker Dashboard</h1>
        {!broker?.verified && (
          <span className="px-3 py-1 rounded bg-yellow-100 text-yellow-800">Pending verification</span>
        )}
        <a href="/sellers?as=broker" className="ml-auto px-3 py-2 rounded bg-black text-white">New Listing</a>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Conversations</h2>
        <div className="grid gap-3">
          {(threads || []).map(t => (
            <a key={`${t.listing_id}-${t.buyer_id}`} href={`/messages?listingId=${t.listing_id}&buyerId=${t.buyer_id}`}
               className="flex items-center justify-between border rounded p-3 hover:bg-gray-50">
              <div>
                <div className="text-sm text-gray-600">Listing #{t.listing_id} • Buyer #{t.buyer_id}</div>
                <div className="text-xs text-gray-500">Last: {new Date(t.last_message_at).toLocaleString()}</div>
              </div>
              {t.unread_count > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-black text-white">{t.unread_count}</span>
              )}
            </a>
          ))}
          {threads?.length === 0 && <div className="text-sm text-gray-500">No conversations yet.</div>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">My Listings</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {(listings || []).map(l => (
            <a key={l.id} href={`/listings/${l.id}`} className="border rounded p-4 hover:bg-gray-50">
              <div className="font-medium">{l.business_name || `Listing #${l.id}`}</div>
              <div className="text-sm text-gray-600">{l.city}{l.state ? `, ${l.state}`:''}</div>
              <div className="text-sm mt-1">Asking: ${Number(l.asking_price || 0).toLocaleString()}</div>
            </a>
          ))}
          {listings?.length === 0 && <div className="text-sm text-gray-500">No listings assigned.</div>}
        </div>
      </section>
    </div>
  );
}
