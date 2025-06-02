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
        <img
          src={listing.images[0]}
          alt="Business Image"
          className="w-full max-h-[400px] object-cover rounded-lg mb-4"
        />
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
    </div>
  );
}
