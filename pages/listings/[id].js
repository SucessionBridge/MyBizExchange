// pages/listings/[id].js

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

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!listing) {
    return <div className="text-center p-8 text-red-600">Listing not found.</div>;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-blue-800 mb-4">{listing.business_name}</h1>
      <p className="text-gray-700 mb-2">{listing.location} • {listing.industry}</p>

      {listing.images?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
          {listing.images.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Image ${idx + 1}`}
              className="rounded-xl w-full object-cover h-48"
            />
          ))}
        </div>
      )}

      <div className="space-y-2 text-gray-800">
        <p><strong>Revenue:</strong> ${listing.annual_revenue?.toLocaleString()}</p>
        <p><strong>Profit / SDE:</strong> ${listing.annual_profit?.toLocaleString()}</p>
        <p><strong>Asking Price:</strong> ${listing.asking_price?.toLocaleString()}</p>
        <p><strong>Includes Inventory:</strong> {listing.includes_inventory}</p>
        <p><strong>Includes Building:</strong> {listing.includes_building}</p>
        <p><strong>Preferred Financing:</strong> {listing.financing_type}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Business Description</h2>
        <p className="text-gray-700 whitespace-pre-line">{listing.business_description}</p>
      </div>
    </main>
  );
}
