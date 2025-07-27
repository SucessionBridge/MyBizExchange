import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

export default function DealMaker() {
  const router = useRouter();
  const { listingId } = router.query;

  const [listing, setListing] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!listingId) return;

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: listingData } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', listingId)
        .maybeSingle();
      setListing(listingData);

      const { data: buyerData } = await supabase
        .from('buyers')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();
      setBuyer(buyerData);
    };

    fetchData();
  }, [listingId]);

  const generateDeals = async () => {
    if (!listing || !buyer) return;

    setLoading(true);
    setError(null);
    setDeals([]);

    try {
      const res = await fetch('/api/generate-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing, buyer }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to generate deals.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      const rawDeals = data.summary.split(/Deal \d:/).filter(Boolean);
      const formatted = rawDeals.map((d, i) => `Deal ${i + 1}:${d.trim()}`);
      setDeals(formatted);
    } catch (err) {
      console.error('❌ Deal generation error:', err);
      setError('Something went wrong while generating deals.');
    } finally {
      setLoading(false);
    }
  };

  const sendDealToSeller = async (dealText) => {
    if (!buyer || !listing) return;

    await supabase.from('messages').insert([
      {
        listing_id: listing.id,
        sender_id: buyer.auth_id,
        message: dealText,
        is_deal_proposal: true,
      },
    ]);

    alert('✅ Deal proposal sent to seller!');
    router.push(`/listings/${listing.id}`);
  };

  if (!listing || !buyer) {
    return <div className="p-8 text-center">Loading deal maker...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => router.push(`/listings/${listing.id}`)}
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Listing
      </button>

      <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">
        AI Deal Maker
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Creating proposals for:</h2>
        <p className="text-gray-700">
          <strong>{listing.business_name || 'Business'}</strong> in{' '}
          {listing.city}, {listing.state_or_province}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={generateDeals}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 mb-6"
      >
        {loading ? 'Generating Deals...' : 'Generate 3 Deal Options'}
      </button>

      {deals.length > 0 && (
        <div className="space-y-6">
          {deals.map((deal, index) => (
            <div key={index} className="bg-white p-5 rounded-lg shadow">
              <pre className="whitespace-pre-wrap text-gray-800">{deal}</pre>
              <button
                onClick={() => sendDealToSeller(deal)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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

