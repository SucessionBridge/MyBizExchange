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
    if (id) {
      fetchListing();
      fetchBuyerProfile();
    }
  }, [id]);

  async function fetchListing() {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error loading listing:', error);
      setListing(null);
    } else {
      console.log('Fetched listing data:', data);
      setListing(data);
    }
  }

  async function fetchBuyerProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return setLoading(false);

    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('email', user.email)
      .single();

    if (!error && data) {
      setBuyer(data);
    }

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
      console.error('Message send failed', error);
    } else {
      setSuccess(true);
    }
  }

  if (!listing) {
    return <div className="p-6">Loading listing...</div>;
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        {listing.business_name ?? 'Untitled Business'}
      </h1>
      <p className="text-gray-700 mb-4">
        {listing.description ?? 'No description available.'}
      </p>

      {loading ? (
        <p>Loading your profile...</p>
      ) : buyer ? (
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



