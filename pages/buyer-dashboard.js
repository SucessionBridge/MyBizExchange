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

      const { data: profileData, error: profileError } = await supabase
        .from('buyers')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        console.warn('No buyer profile found.');
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
    const { data, error } = await supabase
      .from('saved_listings')
      .select('id, listing_id, sellers(*)')
      .eq('buyer_email', email);

    if (error) {
      console.error('Failed to load saved listings:', error);
    } else {
      setSavedListings(data);
    }
  }

  async function fetchBuyerMessages(email) {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`buyer_email.eq.${email},seller_email.eq.${email}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching buyer messages:', error);
    } else {
      setBuyerMessages(data);
    }
    setLoadingMessages(false);
  }

  async function sendReply(listingId, sellerId) {
    if (!replyText[listingId]) return;
    const { error } = await supabase.from('messages').insert([
      {
        buyer_name: buyerProfile.name,
        buyer_email: buyerProfile.email,
        message: replyText[listingId],
        seller_id: sellerId,
        listing_id: listingId,
        topic: 'business-inquiry',
        is_deal_proposal: false,
      }
    ]);
    if (error) {
      console.error('Error sending reply:', error);
      alert('❌ Failed to send message.');
    } else {
      setReplyText(prev => ({ ...prev, [listingId]: '' }));
      fetchBuyerMessages(buyerProfile.email);
    }
  }

  async function handleUnsave(listingId) {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('listing_id', listingId)
      .eq('buyer_email', buyerProfile.email);

    if (error) {
      console.error('Unsave failed:', error);
      alert('Unable to remove from saved listings.');
    } else {
      setSavedListings((prev) =>
        prev.filter((entry) => entry.listing_id !== listingId)
      );
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ✅ Header bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Buyer Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/?force=true')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            🏠 Home
          </button>
        </div>
      </div>

      {/* ✅ Matches Section */}
      {buyerProfile && (
        <div className="bg-white p-6 rounded-xl shadow mb-10">
          <h2 className="text-xl font-semibold text-green-700 mb-4">Matching Businesses</h2>
          {loadingMatches ? (
            <p>Finding matches...</p>
          ) : matches.length === 0 ? (
            <div className="text-center">
              <p className="mb-4">No matches found yet. Try adjusting your preferences.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => router.push('/listings')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  🔍 Browse Listings
                </button>
                <button
                  onClick={() => router.push('/?force=true')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                >
                  🏠 Homepage
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((listing) => (
                <div key={listing.id} className="border p-4 rounded bg-gray-50">
                  <h3 className="text-lg font-bold">{listing.business_name || 'Business Listing'}</h3>
                  <p><strong>Industry:</strong> {listing.industry}</p>
                  <p><strong>Asking Price:</strong> ${listing.asking_price}</p>
                  <p><strong>Location:</strong> {listing.city}, {listing.state_or_province}</p>
                  <button
                    onClick={() => router.push(`/listings/${listing.id}`)}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    View Listing
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ Profile Section */}
      {!buyerProfile ? (
        <div className="text-center">
          <p className="text-gray-700 mb-4">
            You haven't completed your buyer profile yet.
          </p>
          <button
            onClick={() => router.push('/buyer-onboarding')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold"
          >
            Complete Buyer Profile
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-xl shadow space-y-4 mb-10">
            <h2 className="text-xl font-semibold text-blue-800">Your Profile</h2>
            <p><strong>Name:</strong> {buyerProfile.name}</p>
            <p><strong>Email:</strong> {buyerProfile.email}</p>
            <p><strong>Financing Type:</strong> {buyerProfile.financing_type}</p>
            <p><strong>Experience (1-5):</strong> {buyerProfile.experience}</p>
            <p><strong>Industry Preference:</strong> {buyerProfile.industry_preference}</p>
            <p><strong>Capital Investment:</strong> ${buyerProfile.capital_investment}</p>
            <p><strong>Budget for Purchase:</strong> ${buyerProfile.budget_for_purchase}</p>
            <p><strong>Relocation:</strong> {buyerProfile.willing_to_relocate}</p>
            <p><strong>City/State:</strong> {buyerProfile.city}, {buyerProfile.state_or_province}</p>
            <p><strong>Short Introduction:</strong> {buyerProfile.short_introduction}</p>

            {buyerProfile.video_introduction && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Intro Video / Photo:</p>
                {buyerProfile.video_introduction.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={buyerProfile.video_introduction}
                    alt="Buyer"
                    className="w-48 rounded-lg border"
                  />
                ) : (
                  <video
                    src={buyerProfile.video_introduction}
                    controls
                    className="w-full max-w-md rounded-lg border"
                  />
                )}
              </div>
            )}

            <button
              onClick={() => router.push('/buyer-onboarding?mode=edit')}
              className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Edit My Profile
            </button>
          </div>

          {/* ✅ Saved Listings */}
          {savedListings.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow mb-10">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Saved Listings</h2>
              <ul className="space-y-4">
                {savedListings.map((entry) => (
                  <li key={entry.id} className="border p-4 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {entry.sellers?.industry} in {entry.sellers?.location}
                        </h3>
                        <p className="text-gray-700">
                          Asking Price: ${entry.sellers?.asking_price?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <button
                          onClick={() => router.push(`/listings/${entry.listing_id}`)}
                          className="text-blue-600 hover:underline text-sm mr-4"
                        >
                          View Listing
                        </button>
                        <button
                          onClick={() => handleUnsave(entry.listing_id)}
                          className="text-red-500 hover:underline text-sm"
                        >
                          Unsave
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ✅ Conversations Section */}
          <div className="bg-white p-6 rounded-xl shadow mt-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Your Conversations</h2>
            {loadingMessages ? (
              <p>Loading conversations...</p>
            ) : buyerMessages.length === 0 ? (
              <p className="text-gray-600">You haven't sent or received any messages yet.</p>
            ) : (
              buyerMessages.map((msg) => (
                <div key={msg.id} className="border rounded p-3 mb-3">
                  <p className={msg.buyer_email === buyerProfile.email ? "text-blue-700" : "text-green-700"}>
                    <strong>{msg.buyer_email === buyerProfile.email ? "You" : "Seller"}:</strong> {msg.message}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
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
        </>
      )}
    </div>
  );
}
