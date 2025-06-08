import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ListingDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchListing() {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
      } else {
        setListing(data);
      }

      setLoading(false);
    }

    fetchListing();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!listing) return <div className="p-8 text-center text-red-600">Listing not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-4">{listing.business_name}</h1>
      <p className="text-gray-600 mb-2">{listing.location} • {listing.industry}</p>

      {listing.images?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {listing.images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Business Image ${index + 1}`}
              className="w-full h-64 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      <div className="space-y-2 text-gray-800 text-sm">
        <p><strong>Annual Revenue:</strong> ${listing.annual_revenue?.toLocaleString()}</p>
        <p><strong>Annual Profit (SDE):</strong> ${listing.annual_profit?.toLocaleString()}</p>
        <p><strong>Asking Price:</strong> ${listing.asking_price?.toLocaleString()}</p>
        <p><strong>Includes Inventory:</strong> {listing.includes_inventory || 'No'}</p>
        <p><strong>Includes Building:</strong> {listing.includes_building || 'No'}</p>
        <p><strong>Financing Option:</strong> {listing.financing_type}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Business Description</h2>
        <p className="text-gray-700">{listing.business_description}</p>
      </div>

      {/* Request More Info Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            const isBuyerProfileComplete = false; // 🔧 Replace with real logic later

            if (isBuyerProfileComplete) {
              alert("You're eligible to contact the seller. (Contact form coming soon)");
            } else {
              router.push('/buyers');
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold"
        >
          Request More Info
        </button>
        <p className="text-sm text-gray-500 mt-2">
          You must complete your buyer profile before contacting sellers.
        </p>
      </div>
    </div>
  );
}

