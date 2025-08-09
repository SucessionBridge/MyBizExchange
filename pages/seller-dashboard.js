import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from "../lib/supabaseClient";

const deleteImageFromStorage = async (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(3).join('/');

    const { error } = await supabase.storage
      .from('seller-images')
      .remove([filePath]);

    if (error) throw error;
  } catch (err) {
    console.error('Storage deletion error:', err);
  }
};

export default function SellerDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Modal and deletion state
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [deletionTargetId, setDeletionTargetId] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Messaging states
  const [messages, setMessages] = useState([]);
  const [replyInput, setReplyInput] = useState({});
  const [sending, setSending] = useState(false);

  // Reasons dropdown options
  const deleteReasons = [
    'Business Sold',
    'Change My Mind',
    'No Offers',
    'Temporarily Pausing (Negotiations Ongoing)',
    'Other',
  ];

  useEffect(() => {
    fetchListings();

    const interval = setInterval(() => {
      if (listings.length > 0) {
        fetchMessages(listings.map(l => l.id));
      }
    }, 5000); // refresh messages every 5s

    return () => clearInterval(interval);
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("You must be logged in to view your listings.");
      setLoading(false);
      return;
    }

    const { data: sellerListings, error: listingError } = await supabase
      .from('sellers')
      .select('*')
      .eq('email', user.email);

    if (listingError) {
      console.error('Error loading listings:', listingError);
      setError("There was an issue loading your listings.");
    } else {
      setListings(sellerListings);
      fetchMessages(sellerListings.map(l => l.id));
    }
    setLoading(false);
  };

  const fetchMessages = async (listingIds) => {
    if (!listingIds || listingIds.length === 0) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .in('listing_id', listingIds)
      .order('created_at', { ascending: true });

    if (!error) setMessages(data || []);
  };

  const handleSendReply = async (listingId, buyerEmail) => {
    if (!replyInput[listingId]?.trim()) return;
    setSending(true);

    const { error } = await supabase.from('messages').insert([
      {
        message: replyInput[listingId],
        seller_id: listingId,
        buyer_email: buyerEmail,
        topic: 'reply',
        is_deal_proposal: false,
        extension: 'successionbridge',
        listing_id: listingId,
      },
    ]);

    if (!error) {
      setReplyInput((prev) => ({ ...prev, [listingId]: '' }));
      fetchMessages([listingId]);
    }
    setSending(false);
  };

  const formatCurrency = (val) =>
    val ? `$${parseFloat(val).toLocaleString()}` : 'N/A';

  const getPublicListingUrl = (id) => `${window.location.origin}/listings/${id}`;

  // --- New: Open deletion modal ---
  const openDeleteModal = (id) => {
    setDeletionTargetId(id);
    setDeleteReason('');
    setShowReasonModal(true);
  };

  // --- New: Close deletion modal ---
  const closeDeleteModal = () => {
    setShowReasonModal(false);
    setDeletionTargetId(null);
    setDeleteReason('');
  };

  // --- New: Update listing status (deleted, paused, active) ---
  const updateListingStatus = async (status, reason = '') => {
    if (!deletionTargetId) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/update-listing-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: deletionTargetId,
          status,
          deleteReason: reason,
        }),
      });
      if (!res.ok) throw new Error('Failed to update listing');

      alert(`✅ Listing ${status === 'deleted' ? 'deleted' : status === 'paused' ? 'paused' : 'updated'} successfully.`);

      // Refresh listings to reflect changes
      await fetchListings();

      // Close modal & reset
      closeDeleteModal();
    } catch (err) {
      alert('Error updating listing. Please try again.');
      console.error(err);
    }
    setIsProcessing(false);
  };

  // --- New: Confirm delete with reason ---
  const handleConfirmDelete = () => {
    if (!deleteReason) {
      alert('Please select a reason for deleting/unlisting.');
      return;
    }
    updateListingStatus('deleted', deleteReason);
  };

  // --- New: Pause listing temporarily ---
  const handlePauseListing = (id) => {
    setDeletionTargetId(id);
    updateListingStatus('paused', 'Temporarily Pausing (Negotiations Ongoing)');
  };

  // --- New: Unpause listing ---
  const handleUnpauseListing = (id) => {
    setDeletionTargetId(id);
    updateListingStatus('active', '');
  };

  const handleDeletePhoto = async (listingId, imageUrl) => {
    const confirmed = window.confirm('Are you sure you want to delete this photo?');
    if (!confirmed) return;

    await deleteImageFromStorage(imageUrl);

    const listing = listings.find((l) => l.id === listingId);
    const updatedImages = listing.images.filter((url) => url !== imageUrl);

    await supabase
      .from('sellers')
      .update({ images: updatedImages })
      .eq('id', listingId);

    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, images: updatedImages } : l))
    );
  };

  if (loading) return <div className="p-6">Loading your listings...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <button
            onClick={() => router.push('/?force=true')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            🏠 Go to Homepage
          </button>
        </div>

        {listings.length === 0 ? (
          <p className="text-center text-gray-600">You have no listings yet.</p>
        ) : (
          <div className="space-y-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white p-6 rounded-xl shadow relative">
                <h2 className="text-xl font-semibold mb-1">{listing.business_name}</h2>
                <p className="text-gray-700 mb-2">
                  {listing.industry} • {listing.location}
                </p>

                <p><strong>Asking Price:</strong> {formatCurrency(listing.asking_price)}</p>
                <p><strong>Annual Revenue:</strong> {formatCurrency(listing.annual_revenue)}</p>
                <p><strong>Annual Profit:</strong> {formatCurrency(listing.annual_profit)}</p>
                <p><strong>Financing:</strong> {listing.financing_type}</p>
                <p className="mt-2"><strong>Description:</strong><br />{listing.business_description}</p>

                {listing.images?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Uploaded Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {listing.images.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt={`Image ${i + 1}`} className="rounded-md border h-32 w-full object-cover" />
                          <button
                            onClick={() => handleDeletePhoto(listing.id, url)}
                            className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full px-2 py-1 hover:bg-red-700"
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-4 text-sm text-gray-500">
                  Submitted: {new Date(listing.created_at).toLocaleDateString()}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getPublicListingUrl(listing.id));
                      alert('✅ Link copied to clipboard!');
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    📋 Copy Listing Link
                  </button>

                  <button
                    onClick={() => router.push(`/edit-listing/${listing.id}`)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  >
                    ✏️ Edit Listing
                  </button>

                  {listing.status !== 'deleted' && listing.status !== 'paused' && (
                    <>
                      <button
                        onClick={() => openDeleteModal(listing.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        🗑️ Delete Listing
                      </button>
                      <button
                        onClick={() => handlePauseListing(listing.id)}
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                      >
                        ⏸ Pause Listing
                      </button>
                    </>
                  )}

                  {listing.status === 'paused' && (
                    <button
                      onClick={() => handleUnpauseListing(listing.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      ▶️ Unpause Listing
                    </button>
                  )}
                </div>

                {/* Conversations */}
                <div className="mt-6 bg-gray-50 border rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Messages for this Listing</h3>
                  {messages.filter(m => m.listing_id === listing.id).length === 0 ? (
                    <p className="text-gray-600 text-sm">No messages yet.</p>
                  ) : (
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                      {messages
                        .filter(m => m.listing_id === listing.id)
                        .map((msg) => (
                          <li
                            key={msg.id}
                            className={`p-2 rounded ${
                              msg.buyer_email ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'
                            }`}
                          >
                            <p>{msg.message}</p>
                            <span className="block text-xs text-gray-500 mt-1">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </li>
                        ))}
                    </ul>
                  )}

                  <div className="flex mt-3 gap-2">
                    <input
                      type="text"
                      placeholder="Type a reply..."
                      value={replyInput[listing.id] || ''}
                      onChange={(e) =>
                        setReplyInput((prev) => ({ ...prev, [listing.id]: e.target.value }))
                      }
                      className="flex-1 border rounded px-3 py-2"
                    />
                    <button
                      onClick={() => handleSendReply(listing.id, messages.find(m => m.listing_id === listing.id)?.buyer_email)}
                      disabled={sending}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete reason modal */}
        {showReasonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Why are you deleting this listing?</h2>
              <select
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              >
                <option value="">-- Select a Reason --</option>
                {deleteReasons.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={isProcessing}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={closeDeleteModal}
                  disabled={isProcessing}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

