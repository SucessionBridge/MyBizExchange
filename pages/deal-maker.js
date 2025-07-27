import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function DealMaker() {
  const router = useRouter();
  const { listingId } = router.query;
  const [listing, setListing] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    fetchListingAndBuyer();
  }, [listingId]);

  async function fetchListingAndBuyer() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: buyerData } = await supabase.from('buyers').select('*').eq('auth_id', user.id).maybeSingle();
    setBuyer(buyerData);

    const { data: listingData } = await supabase.from('sellers').select('*').eq('id', listingId).maybeSingle();
    setListing(listingData);
  }

  async function generateDeals() {
    setLoading(true);
    const res = await fetch('/api/generate-deal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId })
    });
    const data = await res.json();
    setDeals(data.deals || []);
    setLoading(false);
  }

  async function sendToSeller(deal) {
    if (!buyer || !listing) return;
    await supabase.from('messages').insert([{
      listing_id: listing.id,
      buyer_id: buyer.id,
      seller_id: listing.auth_id,
      content: deal,
      is_deal_proposal: true
    }]);
    alert('✅ Deal sent to seller!');
  }

  return (
    <main className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">
          AI Deal Maker
        </h1>

        {listing && (
          <button
            onClick={() => router.push(`/listings/${listing.id}`)}
            className="mb-6 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            ← Back to Listing
          </button>
        )}

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Creating proposals for</h2>
          <p className="text-gray-700 font-medium">{listing?.business_name}</p>
        </div>

        <button
          onClick={generateDeals}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold mb-8"
        >
          {loading ? 'Generating...' : 'Generate 3 Deal Options'}
        </button>

        <div className="space-y-6">
          {deals.map((deal, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-bold mb-2 text-blue-800">{deal.title}</h3>
              <p><strong>Down Payment:</strong> {deal.down_payment}</p>
              <p><strong>Payment Structure:</strong> {deal.payment_structure}</p>
              <p className="mt-3 text-gray-700">{deal.benefits}</p>
              <button
                onClick={() => sendToSeller(JSON.stringify(deal, null, 2))}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Send This Deal to Seller
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

