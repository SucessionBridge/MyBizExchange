// pages/listings/[id].js
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useEffect, useState } from 'react';

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

    if (error) console.error('Error loading listing', error);
    else setListing(data);
  }

  async function fetchBuyerProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('email', user.email)
      .single();

    if (error) console.warn('Buyer not profiled');
    else setBuyer(data);

    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!buyer || !message) return;

    const { error } = await supabase.from('messages').insert([
      {
        buyer_email: buyer.email,
        buyer_name: buyer.name,
        message,
        seller_id: id,
      },
    ]);

    if (error) console.error('Message send error', error);
    else setSuccess(true);
  }

  if (!listing) return <div className="p-6">Loading listing...</div>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{listing.business_name}</h1>
      <p className="text-gray-700 mb-4">{listing.description}</p>

      {loading ? (
        <p>Loading buyer profile...</p>
      ) : buyer ? (
        <div className="mt-6 border-t pt-6">
          <h2 className="text-xl font-semibold mb-2">Send a message to the seller</h2>
          {success ? (
            <p className="text-green-600">✅ Message sent successfully!</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                rows="5"
                placeholder="Write your message here..."
                className="w-full border p-3 rounded"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
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
          <p className="text-red-500">
            You must{' '}
            <a href={`/buyer-onboarding?redirect=/listings/${id}`} className="underline">
              complete your buyer profile
            </a>{' '}
            to contact the seller.
          </p>
        </div>
      )}
    </main>
  );
}
