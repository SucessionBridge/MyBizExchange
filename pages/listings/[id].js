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

  const heroImage = listing.images?.[0];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Banner */}
      {heroImage && (
        <div
          className="h-64 md:h-80 bg-cover bg-center relative rounded-b-xl"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center px-4">
              {listing.business_name}
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Location & Financing */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-gray-600">{listing.location} • {listing.industry}</p>
          {listing.financing_type?.toLowerCase().includes('seller') && (
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
              Seller Financing Available
            </span>
          )}
        </div>

        {/* Image Gallery */}
        {listing.images?.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {listing.images.slice(1).map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Business Image ${index + 2}`}
                className="rounded-lg w-full h-48 object-cover"
              />
            ))}
          </div>
        )}

        {/* Financial Overview */}
        <div className="grid sm:grid-cols-3 gap-6 text-sm text-gray-800 bg-gray-50 p-6 rounded-lg border">
          <div>
            <p className="text-gray-500">Annual Revenue</p>
            <p className="font-semibold">${listing.annual_revenue?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Annual Profit (SDE)</p>
            <p className="font-semibold">${listing.annual_profit?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Asking Price</p>
            <p className="font-semibold">${listing.asking_price?.toLocaleString()}</p>
          </div>
        </div>

        {/* Deal Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <p><strong>Includes Inventory:</strong> {listing.includes_inventory || 'No'}</p>
          <p><strong>Includes Building:</strong> {listing.includes_building || 'No'}</p>
          <p><strong>Financing Option:</strong> {listing.financing_type || 'N/A'}</p>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-2xl font-semibold text-blue-800 mb-2">Business Description</h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{listing.business_description}</p>
        </div>
      </div>
    </div>
  );
}
