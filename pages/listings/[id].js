import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import supabase from '../../lib/supabaseClient';

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [listing, setListing] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const toTitleCase = (str) =>
    str
      ? str
          .toLowerCase()
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : '';

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
          seller_id: listing.auth_id,
          listing_id: listing.id,
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
        alert('✅ Message sent to the seller!');
        setMessage('');
        setSuccess(true);
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      alert('Something went wrong.');
    }
  }

  async function handleSaveListing() {
    if (!buyer) {
      alert('You must be logged in as a buyer to save listings.');
      return;
    }

    const { error } = await supabase.from('saved_listings').insert([
      { buyer_email: buyer.email, listing_id: id }
    ]);

    if (error) {
      console.error('Save failed:', error);
      alert("Couldn't save this listing.");
    } else {
      alert('✅ Listing saved to your profile.');
    }
  }

  async function handleEmailMe() {
    if (!buyer || !buyer.email) {
      alert('You must be logged in to receive listings by email.');
      return;
    }

    const { error } = await supabase.from('email_requests').insert([
      { buyer_email: buyer.email, listing_id: id }
    ]);

    if (error) {
      console.error('Email request failed:', error);
      alert('There was a problem sending this listing by email.');
    } else {
      alert('✅ This listing will be emailed to you.');
    }
  }

  if (!id || loading) return <div className="p-8 text-center text-gray-600">Loading...</div>;
  if (!listing) return <div className="p-8 text-center text-gray-600">Listing not found.</div>;

  const mainImage =
    listing.image_urls?.length > 0 ? listing.image_urls[0] : '/placeholder.png';
  const otherImages = listing.image_urls?.slice(1) || [];

  return (
    <main className="bg-gray-50 min-h-screen pb-16 font-sans">
      <div className="max-w-5xl mx-auto px-4">
        <a
          href="/listings"
          className="inline-block mt-6 mb-8 text-sm text-blue-600 hover:underline"
        >
          ← Back to Marketplace
        </a>

        {/* ✅ Hero */}
        <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden shadow-lg">
          <img src={mainImage} alt="Business" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-8">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-lg">
              {toTitleCase(
                listing.hide_business_name
                  ? 'Confidential Business Listing'
                  : listing.business_name || `${listing.industry} Business`
              )}
            </h1>
            <p className="text-gray-100 text-lg mt-1">{toTitleCase(listing.location)}</p>
          </div>
        </div>

        {/* ✅ Financial Highlights */}
        <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
          <h2 className="text-3xl font-serif font-semibold text-blue-900 mb-6">Financial Highlights</h2>
          <div className="text-4xl font-bold text-emerald-700 mb-6">
            {listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : 'Inquire for Price'}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-gray-800">
            <p><span className="font-semibold">Annual Revenue:</span> {listing.annual_revenue ? `$${listing.annual_revenue.toLocaleString()}` : 'N/A'}</p>
            <p><span className="font-semibold">SDE:</span> {listing.sde ? `$${listing.sde.toLocaleString()}` : 'N/A'}</p>
            <p><span className="font-semibold">Annual Profit:</span> {listing.annual_profit ? `$${listing.annual_profit.toLocaleString()}` : 'N/A'}</p>
            <p><span className="font-semibold">Inventory Value:</span> {listing.inventory_value ? `$${listing.inventory_value.toLocaleString()}` : 'N/A'}</p>
            <p><span className="font-semibold">Equipment Value:</span> {listing.equipment_value ? `$${listing.equipment_value.toLocaleString()}` : 'N/A'}</p>
            <p><span className="font-semibold">Employees:</span> {listing.employees || 'N/A'}</p>
          </div>
        </section>

        {/* ✅ Business Description */}
        <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
          <h2 className="text-3xl font-serif font-semibold text-blue-900 mb-4">Business Description</h2>
          <p className="text-gray-800 leading-relaxed text-lg">
            {listing.description_choice === 'ai'
              ? listing.ai_description
              : listing.business_description || 'No description available.'}
          </p>
        </section>

        {/* ✅ Additional Details */}
        <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
          <h2 className="text-3xl font-serif font-semibold text-blue-900 mb-4">Additional Information</h2>
          <div className="space-y-6 text-gray-800">
            {listing.customer_type && (
              <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-1">Customer Type</h3>
                <p>{listing.customer_type}</p>
              </div>
            )}

            {listing.owner_involvement && (
              <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-1">Owner Involvement</h3>
                <p>{listing.owner_involvement}</p>
              </div>
            )}

            {listing.growth_potential && (
              <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-1">Growth Potential</h3>
                <p>{listing.growth_potential}</p>
              </div>
            )}

            {listing.training_offered && (
              <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-1">Training & Support</h3>
                <p>{listing.training_offered}</p>
              </div>
            )}

            {listing.reason_for_selling && (
              <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-1">Reason for Selling</h3>
                <p>{listing.reason_for_selling}</p>
              </div>
            )}
          </div>
        </section>

        {/* ✅ Business Details */}
        <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
          <h2 className="text-3xl font-serif font-semibold text-blue-900 mb-4">Business Details</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-800">
            <p><span className="font-semibold">Monthly Lease:</span> {listing.monthly_lease ? `$${listing.monthly_lease.toLocaleString()}` : 'N/A'}</p>
            <p><span className="font-semibold">Home-Based:</span> {listing.home_based ? 'Yes' : 'No'}</p>
            <p><span className="font-semibold">Relocatable:</span> {listing.relocatable ? 'Yes' : 'No'}</p>
            <p><span className="font-semibold">Includes Inventory:</span> {listing.includes_inventory ? 'Yes' : 'No'}</p>
            <p><span className="font-semibold">Includes Building:</span> {listing.includes_building ? 'Yes' : 'No'}</p>
            <p><span className="font-semibold">Real Estate Included:</span> {listing.real_estate_included ? 'Yes' : 'No'}</p>
            <p><span className="font-semibold">Financing Type:</span> {listing.financing_type?.replace(/-/g, ' ') || 'N/A'}</p>
            <p><span className="font-semibold">Years in Business:</span> {listing.years_in_business || 'N/A'}</p>
          </div>
        </section>

        {/* ✅ Additional Photos */}
        {otherImages.length > 0 && (
          <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
            <h2 className="text-3xl font-serif font-semibold text-blue-900 mb-4">Additional Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {otherImages.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Business ${idx + 2}`}
                  className="w-full h-44 object-cover rounded-lg"
                />
              ))}
            </div>
          </section>
        )}
{/* ✅ AI Enhanced Deal Maker */}
{buyer && (
  <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
    <h2 className="text-3xl font-serif font-semibold text-blue-900 mb-4">
      AI Enhanced Deal Maker
    </h2>
    <p className="text-gray-700 mb-4">
      Use AI to structure a creative offer (seller financing, rent-to-own, profit share, etc.) based on this business’s details.
    </p>
    <button
      onClick={() => router.push(`/deal-builder?listing=${id}`)}
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium"
    >
      Launch Deal Builder
    </button>
  </section>
)}


        {/* ✅ Buyer Actions */}
        {buyer ? (
          <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
            <h2 className="text-3xl font-serif font-semibold text-blue-900 mb-4">Contact Seller</h2>
            {success ? (
              <p className="text-green-600">✅ Your message was sent!</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                  rows="5"
                  placeholder="Write your message to the seller..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                  >
                    Send Message
                  </button>
                  <button
                    onClick={handleSaveListing}
                    type="button"
                    className="bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg border"
                  >
                    Save Listing
                  </button>
                  <button
                    onClick={handleEmailMe}
                    type="button"
                    className="bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg border"
                  >
                    Email Me This Listing
                  </button>
                </div>
              </form>
            )}
          </section>
        ) : (
          <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
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
          </section>
        )}
      </div>
    </main>
  );
}



