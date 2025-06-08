import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [listing, setListing] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: listingData, error: listingError } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', id)
        .single();

      if (listingError) {
        console.error('Listing fetch error:', listingError);
        return;
      }
      setListing(listingData);

      const { data: userResponse, error: userError } = await supabase.auth.getUser();
      if (userError || !userResponse?.user) {
        setUser(null);
        setBuyer(null);
        setLoading(false);
        return;
      }

      setUser(userResponse.user);

      const { data: buyerData, error: buyerError } = await supabase
        .from('buyers')
        .select('*')
        .eq('email', userResponse.user.email)
        .single();

      if (!buyerError && buyerData) {
        setBuyer(buyerData);
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
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

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setSuccess(true);
    }
  };

  if (!router.isReady || loading || !listing) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{listing.business_name}</h1>
      <p className="text-gray-700 mb-4">{listing.description}</p>

      {user && buyer ? (
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
      ) : user ? (
        <div className="mt-6 border-t pt-6">
          <p className="text-red-500">
            You must{' '}
            <a
              href={`/buyer-onboarding?redirect=/listings/${id}`}
              className="underline font-medium text-blue-600"
            >
              complete your buyer profile
            </a>{' '}
            to contact the seller.
          </p>
        </div>
      ) : (
        <div className="mt-6 border-t pt-6">
          <p className="text-red-500">
            You must{' '}
            <a href="/login" className="underline font-medium text-blue-600">
              log in
            </a>{' '}
            to request more information.
          </p>
        </div>
      )}
    </main>
  );
}
