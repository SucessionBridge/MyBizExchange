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
    <main className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-[#2E3A59] mb-2">
          {listing.industry} Business for Sale in {listing.location}
        </h1>
        <p className="text-2xl text-green-700 font-semibold">
          Asking Price: ${listing.asking_price?.toLocaleString()}
        </p>
      </div>

      {listing.image_urls?.length > 0 && (
        <div className="mb-6">
          <img
            src={listing.image_urls[0]}
            alt="Business Image"
            className="w-full h-80 object-cover rounded-lg shadow"
          />
          {listing.image_urls.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {listing.image_urls.slice(1).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Additional Image ${idx + 1}`}
                  className="w-24 h-24 object-cover rounded border"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2 text-[#2E3A59]">Business Overview</h2>
        <p className="text-gray-800 leading-relaxed">
          {listing.ai_description || listing.business_description || 'No description available.'}
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="text-xl font-semibold border-b pb-2 mb-2 text-[#2E3A59]">Financials</h3>
          <p><strong>Annual Revenue:</strong> ${listing.annual_revenue?.toLocaleString()}</p>
          <p><strong>Annual Profit:</strong> ${listing.annual_profit?.toLocaleString()}</p>
          <p><strong>SDE:</strong> ${listing.sde?.toLocaleString()}</p>
          <p><strong>Inventory Value:</strong> ${listing.inventory_value?.toLocaleString()}</p>
          <p><strong>Equipment Value:</strong> ${listing.equipment_value?.toLocaleString()}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold border-b pb-2 mb-2 text-[#2E3A59]">Business Details</h3>
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

      {buyer ? (
        <div className="mt-6 border-t pt-6">
          <h2 className="text-xl font-semibold mb-2 text-[#2E3A59]">Send a Message to the Seller</h2>
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



