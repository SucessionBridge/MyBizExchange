import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching listings:', error);
      } else {
        setListings(data);
      }

      setLoading(false);
    }

    fetchListings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-12">
      <h1 className="text-4xl font-bold text-blue-900 mb-8 text-center">Available Listings</h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-center text-gray-500">No businesses available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white border border-gray-200 rounded-2xl shadow hover:shadow-md transition">
              {Array.isArray(listing.images) && listing.images.length > 0 && listing.images[0] ? (
                <img
                  src={listing.images[0]}
                  alt={`${listing.business_name} image`}
                  className="w-full h-48 object-cover rounded-t-2xl"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 rounded-t-2xl">
                  No Image Available
                </div>
              )}

              <div className="p-4 space-y-2">
                <h2 className="text-xl font-semibold text-blue-800">{listing.business_name}</h2>
                <p className="text-sm text-gray-600">
                  {listing.location} • {listing.industry}
                </p>
                <p className="text-gray-700 text-sm line-clamp-3">
                  {listing.business_description}
                </p>
                <div className="text-sm text-gray-800 mt-2">
                  <p><strong>Revenue:</strong> ${listing.annual_revenue?.toLocaleString()}</p>
                  <p><strong>Profit:</strong> ${listing.annual_profit?.toLocaleString()}</p>
                  <p><strong>Price:</strong> ${listing.asking_price?.toLocaleString()}</p>
                </div>
              </div>

              <div className="px-4 pb-4">
                <Link href={`/listings/${listing.id}`}>
                  <a className="inline-block mt-2 text-blue-600 hover:underline text-sm font-medium">
                    View Details →
                  </a>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

