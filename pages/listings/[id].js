import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [listing, setListing] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchListing();
    fetchBuyerProfile();
  }, [id]);

  async function fetchListing() {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading listing:', error);
    } else {
      setListing(data);
    }
  }

  async function fetchBuyerProfile() {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('email', user.email)
      .single();

    if (!error) setBuyer(data);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message || !buyer) return;

    const { error } = await supabase.from('messages').insert([
      {
        buyer_email: buyer.email,
        buyer_name: buyer.name,
        message,
        seller_id: id,
      },
    ]);

    if (error) {
      console.error('Message send failed:', error);
    } else {
      setSuccess(true);
    }
  }

  if (!id || loading) return <div className="p-6">Loading...</div>;
  if (!listing) return <div className="p-6">Listing not found.</div>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{listing.business_name}</h1>
      <p className="text-gray-700 text-sm mb-1 italic">{listing.industry} – {listing.location}</p>
      <p className="text-lg text-green-700 font-semibold mb-4">
        Asking Price: ${listing.asking_price?.toLocaleString()}
      </p>

      {listing.image_urls?.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-6">
          {listing.image_urls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Business Image ${idx + 1}`}
              className="w-full h-40 object-cover rounded"
            />
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-2">Business Description</h2>
      <p className="text-gray-800 mb-6">
        {listing.ai_description || listing.business_description || 'No description available.'}
      </p>

      {/* ✅ NEW SECTION START */}
      <div className="grid md:grid-cols-2 gap-6 text-gray-800 mb-10">
        <div>
          <h3 className="text-lg font-semibold border-b pb-2 mb-2">Financials</h3>
          <p><strong>Annual Revenue:</strong> ${listing.annual_revenue?.toLocaleString()}</p>
          <p><strong>Annual Profit:</strong> ${listing.annual_profit?.toLocaleString()}</p>
          <p><strong>SDE:</strong> ${listing.sde?.toLocaleString()}</p>
          <p><strong>Inventory Value:</strong> ${listing.inventory_value?.toLocaleString()}</p>
          <p><strong>Equipment Value:</strong> ${listing.equipment_value?.toLocaleString()}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold border-b pb-2 mb-2">Business Details</h3>
          <p><strong>Employees:</strong> {listing.employees}</p>
          <p><strong>Monthly Lease:</strong> ${listing.monthly_lease?.toLocaleString()}</p>
          <p><strong>Home-Based:</strong> {listing.home_based ? 'Yes' : 'No'}</p>
          <p><strong>Relocatable:</strong> {listing.relocatable ? 'Yes' : 'No'}</p>
          <p><strong>Includes Inventory:</strong> {listing.includes_inventory ? 'Yes' : 'No'}</p>
          <p><strong>Includes Building:</strong> {listing.includes_building ? 'Yes' : 'No'}</p>
          <p><strong>Real Estate Included:</strong> {listing.real_estate_included ? 'Yes' : 'No'}</p>
          <p><strong>Financing Type:</strong> {listing.financing_type?.replace(/-/g, ' ')}</p>
        </div>
      </div>
      {/* ✅ NEW SECTION END */}

      {buyer ? (
        <div className="mt-6 border-t pt-6">
          <h2 className="text-xl font-semibold mb-2">Send a message to the seller</h2>
          {success ? (
            <p className="text-green-600">✅ Your message was sent!</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                className="w-full p-3 border rounded"
                rows="5"
                placeholder="Write your message to the seller..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-6 border-t pt-6">
          <p className="text-red-600">
            You must{' '}
            <a
              href={`/buyer-onboarding?redirect=/listings/${id}`}
              className="underline font-semibold"
            >
              complete your buyer profile
            </a>{' '}
            before contacting the seller.
          </p>
        </div>
      )}
    </main>
  );
}


