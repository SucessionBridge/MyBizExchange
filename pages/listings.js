import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import Link from 'next/link';

function ListingCard({ listing, index }) {
  const imageUrl =
    Array.isArray(listing.image_urls) &&
    listing.image_urls.length > 0 &&
    listing.image_urls[0]
      ? listing.image_urls[0]
      : null;

  const name = listing.business_name?.trim() || '';

  const description =
    listing.description_choice === 'ai'
      ? listing.ai_description?.trim()
      : listing.business_description?.trim();

  return (
    <div
      key={`${listing.id}-${index}`}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden border border-gray-100"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name || 'Business'} image`}
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
          {name || `${listing.industry || 'Unnamed'} Business`}
        </h2>
        <p className="text-sm text-gray-500">
          {(listing.location || 'Unknown')} • {(listing.industry || 'Unspecified')}
        </p>
        <p className="text-sm text-gray-700 line-clamp-3">
          {description || 'No description provided.'}
        </p>

        <div className="text-sm text-gray-800 mt-2 space-y-1">
          <p><strong>Revenue:</strong> ${Number(listing.annual_revenue || 0).toLocaleString()}</p>
          <p><strong>Profit:</strong> ${Number(listing.annual_profit || 0).toLocaleString()}</p>
          <p><strong>Price:</strong> ${Number(listing.asking_price || 0).toLocaleString()}</p>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // ✅ Debounce search input (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);

      let query = supabase
        .from('sellers')
        .select(`
          id,
          business_name,
          business_description,
          ai_description,
          description_choice,
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

      if (debouncedTerm.trim() !== '') {
        query = query.or(
          `business_name.ilike.%${debouncedTerm}%,industry.ilike.%${debouncedTerm}%,location.ilike.%${debouncedTerm}%,business_description.ilike.%${debouncedTerm}%,ai_description.ilike.%${debouncedTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        console.error('❌ Error fetching listings:', error);
      } else {
        setListings(data);
      }
      setLoading(false);
    }

    fetchListings();
  }, [debouncedTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
      <h1 className="text-4xl font-bold text-blue-900 mb-4 text-center">
        Explore Available Businesses for Sale
      </h1>

      {/* 🔍 Search Bar */}
      <div className="max-w-xl mx-auto mb-6">
        <input
          type="text"
          placeholder="Search by name, industry, location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 🔓 Unlock Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-10 text-center">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">Unlock Full Buyer Access</h2>
        <p className="text-gray-700 mb-4">
          Create a free buyer profile or log in to:
        </p>
        <ul className="text-gray-700 mb-4 space-y-1">
          <li>✅ Access detailed financials and seller info</li>
          <li>✅ Message sellers directly</li>
          <li>✅ Save and track listings in your dashboard</li>
          <li>✅ Use our <strong>AI-powered Deal Maker</strong> to craft offers</li>
        </ul>
        <div className="flex justify-center space-x-4">
          <Link href="/buyer-onboarding">
            <a className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium">
              Create Buyer Profile
            </a>
          </Link>
          <Link href="/login">
            <a className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-5 py-2 rounded-lg font-medium">
              Login
            </a>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-center text-gray-500">No businesses found for your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((listing, index) => (
            <ListingCard key={`${listing.id}-${index}`} listing={listing} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
