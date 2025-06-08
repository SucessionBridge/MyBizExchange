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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBuyer(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('email', user.email)
      .single();

    if (error) {
      console.warn('No buyer profile found.');
      setBuyer(null);
    } else {
      setBuyer(data);
    }

    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!buyer || !message.trim()) return;

    const { error } = await supabase.from('messages').insert([
      {
        buyer_email: buyer.email,
        buyer_name: buyer.name,
        message,
        seller_id: listing.id,
        listing_id: listing.id,
        sent_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setSuccess(true);
      setMessage('');
    }
  }

  if (!listing) return <div className="p-6">Loading listing...</div>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{listing.business_name}</h1>
      <p className="text-gray-700 mb-4">{listing.business_description}</p>
      <p className="text-sm text-gray-500 mb-6">
        {listing.location} • {listing.industry}
      </p>

      {listing.images?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {listing.images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Image ${index + 1}`}
              className="w-full h-64 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      <div className="space-y-2 text-gray-800 text-sm">
        <p><strong>Annual Revenue:</strong> ${listing.annual_revenue?.toLocaleString()}</p>
        <p><strong>Annual Profit (SDE):</strong> ${listing.annual_profit?.toLocaleString()}</p>
        <p><strong>Asking Price:</strong> ${listing.asking_price?.toLocaleString()}</p>
        <p><strong>Includes Inventory:</strong> {listing.includes_inventory || 'No'}</p>
        <p><strong>Includes Building:</strong> {listing.includes_building || 'No'}</p>
        <p><strong>Financing Option:</strong> {listing.financing_type}</p>
      </div>

      {loading ? (
        <p className="mt-6">Checking buyer status...</p>
      ) : buyer ? (
        <div className="mt-10 border-t pt-6">
          <h2 className="text-xl font-semibold mb-2">Request More Info</h2>
          {success ? (
            <p className="text-green-600">✅ Your message has been sent to the seller!</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                rows="5"
                className="w-full border p-3 rounded"
                placeholder="Write your message to the seller..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-10 border-t pt-6">
          <p className="text-red-500">
            You must{' '}
            <a href={`/buyer-onboarding?redirect=/listings/${id}`} className="underline font-medium">
              complete your buyer profile
            </a>{' '}
            before contacting the seller.
          </p>
        </div>
      )}
    </main>
  );
}
