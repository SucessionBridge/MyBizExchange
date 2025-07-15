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
        console.log('✅ Listings fetched:', data); // 🔍 Debug insert
        setListings(data);
      }

      setLoading(false);
    }

    fetchListings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
      <h1 className="text-4xl font-bold text-blue-900 mb-10 text-center">
        Explore Available Businesses for Sale
      </h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-center text-gray-500">No businesses available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden border border-gray-100">
              {Array.isArray(listing.image_urls) && listing.image_urls.length > 0 && listing.image_urls[0] ? (
                <img
                  src={listing.image_urls[0]}
                  alt={`${listing.business_name} image`}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}

              <div className="p-5 space-y-2">
                <h2 className="text-lg font-bold text-blue-800">{listing.business_name}</h2>
                <p className="text-sm text-gray-500">{listing.location} • {listing.industry}</p>
                <p className="text-sm text-gray-700 line-clamp-3">{listing.business_description}</p>

                <div className="text-sm text-gray-800 mt-2 space-y-1">
                  <p><strong>Revenue:</strong> ${listing.annual_revenue?.toLocaleString()}</p>
                  <p><strong>Profit:</strong> ${listing.annual_profit?.toLocaleString()}</p>
                  <p><strong>Price:</strong> ${listing.asking_price?.toLocaleString()}</p>
                </div>

                {listing.financing_type?.toLowerCase().includes('seller') && (
                  <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                    Seller Financing Available
                  </span>
                )}

                <div className="pt-3">
                  <Link href={`/listings/${listing.id}`}>
                    <a className="inline-block text-blue-600 hover:text-blue-800 font-medium text-sm">
                      View Details →
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

