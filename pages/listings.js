import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

function ListingCard({ listing, index }) {
  const imageUrl =
    Array.isArray(listing.image_urls) &&
    listing.image_urls.length > 0 &&
    listing.image_urls[0]
      ? listing.image_urls[0]
      : null;

  return (
    <div
      key={`${listing.id}-${index}`}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden border border-gray-100"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${listing.business_name || 'Business'} image`}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.png';
          }}
        />
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
          No Image Available
        </div>
      )}

      <div className="p-5 space-y-2">
        <h2 className="text-lg font-bold text-blue-800">
          {listing.business_name || 'Unnamed Business'}
        </h2>
        <p className="text-sm text-gray-500">
          {(listing.location || 'Unknown')} • {(listing.industry || 'Unspecified')}
        </p>
        <p className="text-sm text-gray-700 line-clamp-3">
          {listing.business_description || listing.ai_description || 'No description provided.'}
        </p>

        <div className="text-sm text-gray-800 mt-2 space-y-1">
          <p>
            <strong>Revenue:</strong> ${Number(listing.annual_revenue || 0).toLocaleString()}
          </p>
          <p>
            <strong>Profit:</strong> ${Number(listing.annual_profit || 0).toLocaleString()}
          </p>
          <p>
            <strong>Price:</strong> ${Number(listing.asking_price || 0).toLocaleString()}
          </p>
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
  );
}

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      const { data, error } = await supabase
        .from('sellers')
        .select(`
          id,
          business_name,
          business_description,
          ai_description,
          image_urls,
          location,
          industry,
          annual_revenue,
          annual_profit,
          asking_price,
          financing_type,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching listings:', error);
      } else {
        console.log('✅ Listings fetched:', data);
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
          {listings.map((listing, index) => {
            try {
              return (
                <ListingCard
                  key={`${listing.id}-${index}`}
                  listing={listing}
                  index={index}
                />
              );
            } catch (err) {
              console.error(`🔥 Error rendering listing #${index} (${listing?.id}):`, err);
              return (
                <div
                  key={`error-${index}`}
                  className="p-4 bg-red-100 border border-red-300 text-red-800"
                >
                  ⚠️ Failed to render listing #{index}. Check console for details.
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

