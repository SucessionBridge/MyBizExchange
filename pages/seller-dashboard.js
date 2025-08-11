// pages/seller-dashboard.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

export default function SellerDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [sellerEmail, setSellerEmail] = useState(null);

  const [sellerListings, setSellerListings] = useState([]); // all listings for this seller
  const [loadingListings, setLoadingListings] = useState(true);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // One composer per listing
  const [replyText, setReplyText] = useState({});   // { [listingId]: string }
  const [replyFiles, setReplyFiles] = useState({}); // { [listingId]: File[] }

  const ATTACH_BUCKET = 'message-attachments';

  // Auth
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      setSellerEmail(data.user.email || null);
    })();
  }, [router]);

  // Load this seller's listings
  useEffect(() => {
    if (!sellerEmail) return;

    (async () => {
      setLoadingListings(true);
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('email', sellerEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch seller listings:', error.message);
        setSellerListings([]);
      } else {
        setSellerListings(data || []);
      }
      setLoadingListings(false);
    })();
  }, [sellerEmail]);

  // Load messages for all of this seller's listing IDs
  useEffect(() => {
    const ids = (sellerListings || []).map((l) => l.id).filter(Boolean);
    if (ids.length === 0) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    (async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('listing_id', ids)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch messages:', error.message);
        setMessages([]);
      } else {
        setMessages(data || []);
      }
      setLoadingMessages(false);
    })();
  }, [sellerListings]);

  // Group messages by listing_id
  const threadsByListing = useMemo(() => {
    const map = {};
    for (const msg of messages) {
      const lid = msg.listing_id;
      if (!lid) continue;
      if (!map[lid]) map[lid] = [];
      map[lid].push(msg);
    }
    Object.keys(map).forEach((lid) => {
      map[lid].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
    return map;
  }, [messages]);

  const listingIds = useMemo(() => Object.keys(threadsByListing), [threadsByListing]);

  function onPickFiles(listingId, e) {
    const files = Array.from(e.target.files || []);
    setReplyFiles((prev) => ({ ...prev, [listingId]: files.slice(0, 5) })); // cap at 5
  }

  // ✅ Seller reply: ensures buyer_email is set; uses seller_id=user.id; includes from_seller flag
  async function sendReply(listingId) {
    try {
      if (!sellerEmail || !user) return;
      const text = (replyText[listingId] || '').trim();
      const files = replyFiles[listingId] || [];
      if (!text && files.length === 0) return;

      // ---- Determine the buyer participant from the thread (ROBUST) ----
      const thread = threadsByListing[listingId] || [];
      // Prefer the most recent row that actually has a buyer_email
      const knownBuyerMsg =
        [...thread].reverse().find(m => m.buyer_email && m.buyer_email.trim()) ||
        thread.find(m => m.buyer_email && m.buyer_email.trim());

      const buyerEmail = knownBuyerMsg?.buyer_email || thread[0]?.buyer_email || null;
      const buyerName =
        (knownBuyerMsg?.buyer_name && knownBuyerMsg.buyer_name.trim())
          ? knownBuyerMsg.buyer_name
          : (buyerEmail ?? 'Buyer');

      if (!buyerEmail) {
        alert('Could not determine buyer email for this thread yet.');
        return;
      }

      // Upload attachments
      let attachments = [];
      if (files.length > 0) {
        for (const file of files) {
          const isImage = file.type?.startsWith('image/');
          const isVideo = file.type?.startsWith('video/');
          if (!isImage && !isVideo) continue;

          const safeName = file.name.replace(/[^\w.\-]+/g, '_');
          const path = `listing-${listingId}/seller-${sellerEmail}/${Date.now()}-${safeName}`;
          const { error: upErr } = await supabase.storage
            .from(ATTACH_BUCKET)
            .upload(path, file, { cacheControl: '3600', upsert: false });
          if (upErr) {
            console.error('Upload failed:', upErr);
            alert('Attachment upload failed. Please try again or remove the file(s).');
            return;
          }
          attachments.push({
            path,
            name: file.name,
            size: file.size,
            mime: file.type,
            kind: isImage ? 'image' : 'video',
          });
        }
      }

      // Insert message from seller (NO sender_id column)
      const { error: insertErr } = await supabase.from('messages').insert([
        {
          listing_id: listingId,
          buyer_email: buyerEmail,
          buyer_name: buyerName,   // ✅ NOT NULL in your schema
          seller_id: user.id,      // ✅ seller auth UUID fits uuid FK
          message: text,
          topic: 'business-inquiry',
          is_deal_proposal: false,
          attachments,
          from_seller: true,
        },
      ]);
      if (insertErr) {
        console.error('Insert message failed:', insertErr);
        alert(insertErr.message || 'Sending failed. Please try again.');
        return;
      }

      setReplyText((prev) => ({ ...prev, [listingId]: '' }));
      setReplyFiles((prev) => ({ ...prev, [listingId]: [] }));

      // Refresh messages
      const ids = (sellerListings || []).map((l) => l.id).filter(Boolean);
      if (ids.length > 0) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .in('listing_id', ids)
          .order('created_at', { ascending: true });
        if (!error) setMessages(data || []);
      }
    } catch (err) {
      console.error('sendReply crashed:', err);
      alert('Something went wrong while sending. Please try again.');
    }
  }

  if (!user) {
    return <div className="p-8 text-center text-gray-600">Loading dashboard…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">Seller Dashboard</h1>
        <button
          onClick={() => router.push('/sellers')}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-semibold shadow"
        >
          ✏️ Edit Listing
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Listings + Conversations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Your Listings */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-amber-700 mb-4">Your Listings</h2>
            {loadingListings ? (
              <p>Loading listings…</p>
            ) : sellerListings.length === 0 ? (
              <p className="text-gray-600">No listings yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sellerListings.map((lst) => (
                  <div
                    key={lst.id}
                    className="bg-gray-50 border rounded-xl shadow-sm hover:shadow-md transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lst.image_urls?.[0] || '/placeholder-listing.jpg'}
                      alt="Listing"
                      className="w-full h-32 object-cover rounded-t-xl"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-bold">
                        {lst.business_name || 'Business Listing'}
                      </h3>
                      <p className="text-gray-700">
                        <strong>Industry:</strong> {lst.industry || '—'}
                      </p>
                      <p className="text-gray-700">
                        <strong>Asking Price:</strong>{' '}
                        {lst.asking_price ? `$${Number(lst.asking_price).toLocaleString()}` : '—'}
                      </p>
                      <p className="text-gray-700">
                        <strong>Location:</strong> {lst.city || lst.location_city || '—'},{' '}
                        {lst.state_or_province || lst.location_state || '—'}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => router.push(`/listings/${lst.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/sellers?edit=${lst.id}`)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conversations */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Buyer Conversations</h2>
            {loadingMessages ? (
              <p>Loading conversations…</p>
            ) : listingIds.length === 0 ? (
              <p className="text-gray-600">No conversations yet.</p>
            ) : (
              listingIds.map((lid) => {
                const thread = threadsByListing[lid] || [];
                const listing = sellerListings.find((l) => String(l.id) === String(lid));

                return (
                  <div key={lid} className="mb-6 border rounded-xl p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">
                        Listing #{lid} {listing?.business_name ? `• ${listing.business_name}` : ''}
                      </p>
                      <button
                        onClick={() => router.push(`/listings/${lid}`)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View Listing
                      </button>
                    </div>

                    {/* Thread bubbles */}
                    <div className="space-y-2">
                      {thread.map((msg) => {
                        const fromSeller = msg.from_seller === true; // reliable direction flag
                        return (
                          <div key={msg.id}>
                            <div
                              className={`p-2 rounded-lg ${
                                fromSeller ? "bg-green-100 text-green-900" : "bg-blue-100 text-blue-900"
                              }`}
                            >
                              <strong>{fromSeller ? "You" : "Buyer"}:</strong> {msg.message}
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
                        );
                      })}
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
                            placeholder="Reply to buyer…"
                            value={replyText[lid] || ''}
                            onChange={(e) =>
                              setReplyText((prev) => ({ ...prev, [lid]: e.target.value }))
                            }
                            className="border p-1 rounded flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => sendReply(lid)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded"
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

        {/* Right: Seller meta */}
        <div className="bg-white p-6 rounded-xl shadow h-fit">
          <h2 className="text-xl font-semibold text-amber-800 mb-4">Account</h2>
          <p>
            <strong>Email:</strong> {sellerEmail || '—'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Messages with buyers appear here grouped by listing. You can attach photos or short videos
            in replies.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Inline preview for message attachments (public bucket) */
function AttachmentPreview({ att }) {
  const { data } = supabase.storage.from('message-attachments').getPublicUrl(att.path);
  const url = data?.publicUrl;
  if (!url) return null;

  if (att.kind === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={att.name || 'attachment'}
        className="w-full h-32 object-cover rounded border"
      />
    );
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

