// pages/seller-dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
const deleteImageFromStorage = async (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(3).join('/'); // removes '/storage/v1/object/public/seller-images/'

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
  const [sellerEmail, setSellerEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
    const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [deletionTargetId, setDeletionTargetId] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');


  useEffect(() => {
    const fetchListings = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("You must be logged in to view your listings.");
        setLoading(false);
        return;
      }

      setSellerEmail(user.email);

      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('email', user.email);

      if (error) {
        console.error('Error loading listings:', error);
        setError("There was an issue loading your listings.");
      } else {
        setListings(data);
      }

      setLoading(false);
    };

    fetchListings();
  }, []);

 const handleDeleteClick = (id) => {
  setDeletionTargetId(id);
  setShowReasonDropdown(true);
};

  const formatCurrency = (val) =>
    val ? `$${parseFloat(val).toLocaleString()}` : 'N/A';

  const getPublicListingUrl = (id) => `${window.location.origin}/listings/${id}`;
  
const handleConfirmDelete = async () => {
  if (!deletionTargetId) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete this listing for reason: "${deleteReason || 'No reason provided'}"?`
  );
  if (!confirmed) return;

  // ✅ Save reason into the DB before deleting
  const { error: updateError } = await supabase
    .from('sellers')
    .update({ delete_reason: deleteReason || 'No reason provided' })
    .eq('id', deletionTargetId);

  if (updateError) {
    alert('❌ Failed to record delete reason.');
    console.error(updateError);
    return;
  }

  const { error: deleteError } = await supabase
    .from('sellers')
    .delete()
    .eq('id', deletionTargetId);

  if (deleteError) {
    alert('❌ Error deleting listing.');
    console.error(deleteError);
  } else {
    setListings((prev) => prev.filter((l) => l.id !== deletionTargetId));
    setShowReasonDropdown(false);
    setDeleteReason('');
    setDeletionTargetId(null);
    alert('✅ Listing deleted successfully.');
  }
};

  if (loading) return <div className="p-6">Loading your listings...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Dashboard</h1>

        {listings.length === 0 ? (
          <p className="text-center text-gray-600">You have no listings yet.</p>
        ) : (
          <div className="space-y-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white p-6 rounded-xl shadow relative">
          {deletionTargetId === listing.id && showReasonDropdown && (
  <div className="mt-4 space-y-2">
    <label className="block font-medium text-gray-700">
      Why are you deleting this listing?
    </label>
    <select
      className="w-full border p-2 rounded"
      value={deleteReason}
      onChange={(e) => setDeleteReason(e.target.value)}
    >
      <option value="">Select a reason</option>
      <option value="Business Sold">Business Sold</option>
      <option value="No Longer for Sale">No Longer for Sale</option>
      <option value="Created by Mistake">Created by Mistake</option>
      <option value="Other">Other</option>
    </select>

    <button
      onClick={handleConfirmDelete}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
    >
      ✅ Confirm Delete
    </button>
  </div>
)}

                <h2 className="text-xl font-semibold mb-1">{listing.business_name}</h2>
                <p className="text-gray-700 mb-2">
                  {listing.industry} • {listing.location}
                </p>

                <p>
                  <strong>Asking Price:</strong> {formatCurrency(listing.asking_price)}
                </p>
                <p>
                  <strong>Annual Revenue:</strong> {formatCurrency(listing.annual_revenue)}
                </p>
                <p>
                  <strong>Annual Profit:</strong> {formatCurrency(listing.annual_profit)}
                </p>
                <p>
                  <strong>Financing:</strong> {listing.financing_type}
                </p>
                <p className="mt-2">
                  <strong>Description:</strong>
                  <br />
                  {listing.business_description}
                </p>

                {listing.images?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Uploaded Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {listing.images.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Image ${i + 1}`}
                          className="rounded-md border h-32 w-full object-cover"
                        />
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

  {deletionTargetId !== listing.id && (
    <button
      onClick={() => handleDeleteClick(listing.id)}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
    >
      🗑️ Delete Listing
    </button>
  )}
</div>

               
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
