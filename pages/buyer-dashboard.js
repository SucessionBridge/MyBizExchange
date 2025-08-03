import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from "../lib/supabaseClient";

export default function BuyerDashboard() {
  const router = useRouter();
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedListings, setSavedListings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const [buyerMessages, setBuyerMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    const fetchProfileAndListings = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('buyers')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profileData) {
        setBuyerProfile(null);
      } else {
        setBuyerProfile(profileData);
        fetchSavedListings(profileData.email);
        fetchMatches(user.id);
        fetchBuyerMessages(profileData.email);
      }

      setLoading(false);
    };

    fetchProfileAndListings();
  }, []);

  async function fetchMatches(userId) {
    setLoadingMatches(true);
    try {
      const res = await fetch(`/api/get-matches?userId=${userId}`);
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  }

  async function fetchSavedListings(email) {
    const { data } = await supabase
      .from('saved_listings')
      .select('id, listing_id, sellers(*)')
      .eq('buyer_email', email);

    setSavedListings(data || []);
  }

  async function fetchBuyerMessages(email) {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`buyer_email.eq.${email},seller_email.eq.${email}`)
      .order('created_at', { ascending: true });

    setBuyerMessages(data || []);
    setLoadingMessages(false);
  }

  async function sendReply(listingId, sellerId) {
    if (!replyText[listingId]) return;
    await supabase.from('messages').insert([{
      buyer_name: buyerProfile.name,
      buyer_email: buyerProfile.email,
      message: replyText[listingId],
      seller_id: sellerId,
      listing_id: listingId,
      topic: 'business-inquiry',
      is_deal_proposal: false,
    }]);
    setReplyText(prev => ({ ...prev, [listingId]: '' }));
    fetchBuyerMessages(buyerProfile.email);
  }

  async function handleUnsave(listingId) {
    await supabase
      .from('saved_listings')
      .delete()
      .eq('listing_id', listingId)
      .eq('buyer_email', buyerProfile.email);

    setSavedListings(prev => prev.filter(entry => entry.listing_id !== listingId));
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 🔹 Top CTA Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-900">Buyer Dashboard</h1>
        <button
          onClick={() => router.push('/listings')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow"
        >
          🔍 Browse Listings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 🔹 Left Column: Matches, Saved Listings, Conversations */}
        <div className="lg:col-span-2 space-y-8">
          {/* ✅ Matches */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-green-700 mb-4">Matching Businesses</h2>
            {loadingMatches ? (
              <p>Finding matches...</p>
            ) : matches.length === 0 ? (
              <p className="text-gray-600">No matches yet. Adjust your preferences.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map(listing => (
                  <div key={listing.id} className="bg-gray-50 border rounded-xl shadow-sm hover:shadow-md transition">
                    <img
                      src={listing.image_urls?.[0] || "/placeholder-listing.jpg"}
                      alt="Business"
                      className="w-full h-32 object-cover rounded-t-xl"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-bold">{listing.business_name || 'Business Listing'}</h3>
                      <p className="text-gray-700"><strong>Industry:</strong> {listing.industry}</p>
                      <p className="text-gray-700"><strong>Asking Price:</strong> ${listing.asking_price}</p>
                      <p className="text-gray-700"><strong>Location:</strong> {listing.city}, {listing.state_or_province}</p>
                      <button
                        onClick={() => router.push(`/listings/${listing.id}`)}
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
                      >
                        View Listing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ Saved Listings */}
          {savedListings.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Saved Listings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedListings.map(entry => (
                  <div key={entry.id} className="bg-gray-50 border rounded-xl shadow-sm hover:shadow-md transition">
                    <img
                      src={entry.sellers?.image_urls?.[0] || "/placeholder-listing.jpg"}
                      alt="Listing"
                      className="w-full h-32 object-cover rounded-t-xl"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-bold">{entry.sellers?.industry} in {entry.sellers?.location}</h3>
                      <p className="text-gray-700">Asking Price: ${entry.sellers?.asking_price?.toLocaleString()}</p>
                      <div className="mt-3 flex justify-between">
                        <button
                          onClick={() => router.push(`/listings/${entry.listing_id}`)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleUnsave(entry.listing_id)}
                          className="text-red-500 hover:underline text-sm"
                        >
                          Unsave
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ Conversations */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Your Conversations</h2>
            {loadingMessages ? (
              <p>Loading conversations...</p>
            ) : buyerMessages.length === 0 ? (
              <p className="text-gray-600">You haven't sent or received any messages yet.</p>
            ) : (
              buyerMessages.map(msg => (
                <div key={msg.id} className="mb-4 border rounded-xl p-3 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">Listing #{msg.listing_id}</p>
                  <div className={`p-2 rounded-lg ${msg.buyer_email === buyerProfile.email ? "bg-blue-100 text-blue-900" : "bg-green-100 text-green-900"}`}>
                    <strong>{msg.buyer_email === buyerProfile.email ? "You" : "Seller"}:</strong> {msg.message}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Reply..."
                      value={replyText[msg.listing_id] || ""}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [msg.listing_id]: e.target.value }))}
                      className="border p-1 rounded flex-1"
                    />
                    <button
                      onClick={() => sendReply(msg.listing_id, msg.seller_id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Send
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 🔹 Right Column: Buyer Profile */}
        {buyerProfile && (
          <div className="bg-white p-6 rounded-xl shadow h-fit">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Your Profile</h2>
            <p><strong>Name:</strong> {buyerProfile.name}</p>
            <p><strong>Email:</strong> {buyerProfile.email}</p>
            <p><strong>Financing Type:</strong> {buyerProfile.financing_type}</p>
            <p><strong>Experience (1-5):</strong> {buyerProfile.experience}</p>
            <p><strong>Industry Preference:</strong> {buyerProfile.industry_preference}</p>
            <p><strong>Capital Investment:</strong> ${buyerProfile.capital_investment}</p>
            <p><strong>Budget for Purchase:</strong> ${buyerProfile.budget_for_purchase}</p>
            <p><strong>Relocation:</strong> {buyerProfile.willing_to_relocate}</p>
            <p><strong>City/State:</strong> {buyerProfile.city}, {buyerProfile.state_or_province}</p>
            <p><strong>Short Intro:</strong> {buyerProfile.short_introduction}</p>

            {buyerProfile.video_introduction && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Intro Video / Photo:</p>
                {buyerProfile.video_introduction.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img src={buyerProfile.video_introduction} alt="Buyer" className="w-full rounded-lg border" />
                ) : (
                  <video src={buyerProfile.video_introduction} controls className="w-full rounded-lg border" />
                )}
              </div>
            )}

            <button
              onClick={() => router.push('/buyer-onboarding?mode=edit')}
              className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded w-full"
            >
              Edit My Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

