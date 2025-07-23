import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import supabase from '../../lib/supabaseClient'; // ✅ FIXED


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

  if (!message || !buyer || !listing) return;

  try {
    const response = await fetch('/api/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message,
    seller_id: listing.user_id || listing.seller_id,
    listing_id: listing.id, // ✅ Add this line
    buyer_name: buyer.name || buyer.full_name || buyer.email,
    buyer_email: buyer.email,
    topic: 'business-inquiry',
    extension: 'successionbridge',
  }),
});


    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Message failed:', result.error);
      alert('Message failed to send.');
    } else {
      console.log('✅ Message sent!');
      alert('Message sent to the seller!');
      setMessage('');
    }
  } catch (err) {
    console.error('❌ Error sending message:', err);
    alert('Something went wrong.');
  }
}

 


  async function handleSaveListing() {
    if (!buyer) {
      alert("You must be logged in as a buyer to save listings.");
      return;
    }

    const { error } = await supabase.from('saved_listings').insert([
      {
        buyer_email: buyer.email,
        listing_id: id,
      },
    ]);

    if (error) {
      console.error('Save failed:', error);
      alert("Couldn't save this listing.");
    } else {
      alert("✅ Listing saved to your profile.");
    }
  }

  async function handleEmailMe() {
    if (!buyer || !buyer.email) {
      alert("You must be logged in to receive listings by email.");
      return;
    }

    const { error } = await supabase.from('email_requests').insert([
      {
        buyer_email: buyer.email,
        listing_id: id,
      },
    ]);

    if (error) {
      console.error("Email request failed:", error);
      alert("There was a problem sending this listing by email.");
    } else {
      alert("✅ This listing will be emailed to you.");
    }
  }

  if (!id || loading) return <div className="p-6">Loading...</div>;
  if (!listing) return <div className="p-6">Listing not found.</div>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <a
        href="/listings"
        className="inline-block mb-4 text-sm text-blue-600 hover:underline"
      >
        ← Back to Marketplace
      </a>

      <h1 className="text-3xl font-bold mb-2">
        {listing.industry} Business for Sale in {listing.location}
      </h1>
      <p className="text-lg text-green-700 font-semibold mb-4">
        Asking Price: ${listing.asking_price?.toLocaleString()}
      </p>

      {buyer && (
        <div className="flex mb-6">
          <button
            onClick={handleSaveListing}
            className="bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded"
          >
            💾 Save This Listing
          </button>
          <button
            onClick={handleEmailMe}
            className="ml-4 bg-white border text-blue-600 border-blue-600 px-4 py-2 rounded hover:bg-blue-50 text-sm"
          >
            📧 Email Me This Listing
          </button>
        </div>
      )}

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
        {listing.description_choice === 'ai'
          ? listing.ai_description
          : listing.business_description || 'No description available.'}
      </p>

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



