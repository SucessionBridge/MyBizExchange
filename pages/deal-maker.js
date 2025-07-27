// pages/deal-maker.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function DealMaker() {
  const router = useRouter();
  const { listingId } = router.query;

  const [listing, setListing] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: buyerProfile } = await supabase
        .from('buyers')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      const { data: listingData } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', listingId)
        .maybeSingle();

      setBuyer(buyerProfile);
      setListing(listingData);
      setLoading(false);
    };
    fetchData();
  }, [listingId]);

  const generateDeals = async () => {
    setGenerating(true);
    const res = await fetch('/api/generate-deal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing, buyer })
    });

    const data = await res.json();
    setGenerating(false);

    if (data.summary) {
      const splitDeals = data.summary.split(/\n\s*\n/).filter(Boolean);
      setDeals(splitDeals);
    }
  };

  const sendToSeller = async (dealText) => {
    // ✅ Save as a message in your messaging system
    await supabase.from('messages').insert([{
      listing_id: listing.id,
      sender_role: 'buyer',
      buyer_id: buyer.id,
      seller_id: listing.seller_id,
      content: dealText,
      is_deal_proposal: true
    }]);
    alert('✅ Deal proposal sent to seller!');
    router.push(`/listings/${listing.id}`);
  };

  if (loading) return <div className="p-8 text-center">Loading Deal Maker...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">AI Deal Maker</h1>
      <p className="mb-4 text-gray-700">
        Creating proposals for <strong>{listing.business_name}</strong>
      </p>

      <button
        onClick={generateDeals}
        disabled={generating}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded mb-6"
      >
        {generating ? 'Generating Deals...' : 'Generate 3 Deal Options'}
      </button>

      {deals.length > 0 && (
        <div className="space-y-6">
          {deals.map((deal, idx) => (
            <div key={idx} className="bg-white p-4 rounded shadow">
              <pre className="whitespace-pre-wrap text-gray-800">{deal}</pre>
              <button
                onClick={() => sendToSeller(deal)}
                className="mt-3 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded"
              >
                Send This Deal to Seller
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
