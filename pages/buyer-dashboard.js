// pages/buyer-dashboard.js
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

  // One composer per listing thread
  const [replyText, setReplyText] = useState({});   // { [listingId]: string }
  const [replyFiles, setReplyFiles] = useState({}); // { [listingId]: File[] }
  const ATTACH_BUCKET = 'message-attachments';

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
  }, [router]);

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

  // ✅ Only query by buyer_email (compatible with your current schema)
  async function fetchBuyerMessages(email) {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('buyer_email', email)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBuyerMessages(data || []);
    } catch (err) {
      console.error('❌ fetchBuyerMessages failed:', err);
      setBuyerMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  function onPickFiles(listingId, e) {
    const files = Array.from(e.target.files || []);
    setReplyFiles(prev => ({ ...prev, [listingId]: files.slice(0, 5) })); // cap at 5
  }

  // ✅ Send via /api/send-message (service role). Keep signature but ignore sellerId.
  async function sendReply(listingId, _sellerId) {
    try {
      const text = (replyText[listingId] || '').trim();
      const files = replyFiles[listingId] || [];
      if (!text && files.length === 0) return;
      if (!buyerProfile) return;

      // Resolve seller_email for this listing (API uses it to resolve seller_id)
      const { data: sellerRow, error: sellerErr } = await supabase
        .from('sellers')
        .select('email')
        .eq('id', listingId)
        .maybeSingle();

      const sellerEmail = sellerRow?.email || null;
      if (sellerErr || !sellerEmail) {
        console.error('Could not resolve seller email for listing', listingId, sellerErr);
        alert('Could not find seller for this listing. Please open the listing and use Contact Seller.');
        return;
      }

      // Build multipart body so API handles attachment upload + DB insert
      const fd = new FormData();
      fd.append('listing_id', String(listingId));
      fd.append('buyer_email', buyerProfile.email);
      fd.append('buyer_name', buyerProfile.name || buyerProfile.email);
      fd.append('seller_email', sellerEmail); // API resolves seller_id from this
      fd.append('message', text);
      fd.append('topic', 'business-inquiry');
      fd.append('is_deal_proposal', 'false');
      fd.append('from_seller', 'false'); // direction flag (for labels)

      files.forEach((file) => fd.append('attachments', file, file.name));

      const res = await fetch('/api/send-message', { method: 'POST', body: fd });
      let out = null;
      try { out = await res.json(); } catch (_) {}
      if (!res.ok) {
        console.error('send-message failed:', out || res.statusText);
        alert(out?.error || out?.message || 'Sending failed.');
        return;
      }

      // Reset UI + reload
      setReplyText(prev => ({ ...prev, [listingId]: '' }));
      setReplyFiles(prev => ({ ...prev, [listingId]: [] }));
      await fetchBuyerMessages(buyerProfile.email);
    } catch (err) {
      console.error('❌ sendReply crashed:', err);
      alert('Something went wrong while sending. Please try again.');
    }
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

  // Group messages into threads by listing_id
  const threadsByListing = (buyerMessages || []).reduce((acc, msg) => {
    const lid = msg.listing_id;
    if (!lid) return acc;
    (acc[lid] = acc[lid] || []).push(msg);
    return acc;
  }, {});
  const listingIds = Object.keys(threadsByListing);

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

          {/* ✅ Conversations (threaded, one composer per listing) */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Your Conversations</h2>
            {loadingMessages ? (
              <p>Loading conversations...</p>
            ) : listingIds.length === 0 ? (
              <p className="text-gray-600">You haven't sent or received any messages yet.</p>
            ) : (
              listingIds.map((lid) => {
                const thread = (threadsByListing[lid] || [])
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  );
                const lastMsg = thread[thread.length - 1];
                const sellerId = lastMsg?.seller_id || thread[0]?.seller_id || null;

                return (
                  <div key={lid} className="mb-6 border rounded-xl p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Listing #{lid}</p>
                      <button
                        onClick={() => router.push(`/listings/${lid}`)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View Listing
                      </button>
                    </div>

                    {/* Thread bubbles */}
                    <div className="space-y-2">
                      {thread.map((msg) => (
                        <div key={msg.id}>
                          <div
                            className={`p-2 rounded-lg ${
                              msg.from_seller === true
                                ? "bg-green-100 text-green-900"
                                : "bg-blue-100 text-blue-900"
                            }`}
                          >
                            <strong>{msg.from_seller === true ? "Seller" : "You"}:</strong>{" "}
                            {msg.message}
                          </div>

                          {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {msg.attachments.map((att, i) => (
                                <AttachmentPreview key={`${msg.id}-${i}`} att={att} />
                              ))}
                            </div>
                          )}

                          <p className="text-[11px] text-gray-400 mt-1">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Single composer per listing */}
                    <div className="mt-3 border-t pt-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => onPickFiles(lid, e)}
                          className="text-xs"
                        />
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Reply..."
                            value={replyText[lid] || ""}
                            onChange={(e) =>
                              setReplyText((prev) => ({ ...prev, [lid]: e.target.value }))
                            }
                            className="border p-1 rounded flex-1"
                          />
                          <button
                            type="button" // 🛠️ prevent any stray form submit
                            onClick={() => sendReply(lid, sellerId)}
                            className="bg-blue-600 text-white px-3 py-1 rounded"
                          >
                            Send
                          </button>
                        </div>
                      </div>

                      {replyFiles[lid]?.length > 0 && (
                        <div className="mt-1 text-xs text-gray-600">
                          {replyFiles[lid].map((f, idx) => (
                            <span
                              key={idx}
                              className="inline-block mr-2 truncate max-w-[12rem] align-middle"
                            >
                              📎 {f.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
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

/** Inline preview component for message attachments (public bucket) */
function AttachmentPreview({ att }) {
  const { data } = supabase.storage.from('message-attachments').getPublicUrl(att.path);
  const url = data?.publicUrl;
  if (!url) return null;

  if (att.kind === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={att.name || 'attachment'} className="w-full h-32 object-cover rounded border" />;
  }
  if (att.kind === 'video') {
    return <video src={url} controls className="w-full h-32 object-cover rounded border" />;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
      Download {att.name || 'attachment'}
    </a>
  );
}

