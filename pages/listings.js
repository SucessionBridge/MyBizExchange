import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import Link from 'next/link';
import Head from 'next/head';

function ListingCard({ listing, index }) {
  const imageUrl =
    Array.isArray(listing.image_urls) &&
    listing.image_urls.length > 0 &&
    listing.image_urls[0]
      ? listing.image_urls[0]
      : null;

  const displayName = listing.hide_business_name
    ? 'Confidential Business Listing'
    : listing.business_name?.trim() ||
      `${listing.industry || 'Unnamed'} Business`;

  const description =
    listing.description_choice === 'ai'
      ? listing.ai_description?.trim()
      : listing.business_description?.trim();

  return (
    <div
      key={`${listing.id}-${index}`}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${displayName} image`}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.png';
          }}
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-400 font-semibold text-lg">
          No Image Available
        </div>
      )}

      <div className="p-5 space-y-3">
        <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
        <p className="text-sm text-gray-500 font-medium">
          {(listing.location || 'Unknown')} • {(listing.industry || 'Unspecified')}
        </p>
        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
          {description || 'No description provided.'}
        </p>

        <div className="text-sm text-gray-800 mt-3 grid grid-cols-3 gap-2">
          <p><strong>Revenue:</strong><br />${Number(listing.annual_revenue || 0).toLocaleString()}</p>
          <p><strong>Profit:</strong><br />${Number(listing.annual_profit || 0).toLocaleString()}</p>
          <p><strong>Price:</strong><br />${Number(listing.asking_price || 0).toLocaleString()}</p>
        </div>

        {listing.financing_type?.toLowerCase().includes('seller') && (
          <span className="inline-block mt-2 bg-green-50 text-green-700 text-xs font-semibold px-2 py-1 rounded border border-green-200">
            Seller Financing Available
          </span>
        )}

        <div className="pt-3">
          <Link href={`/listings/${listing.id}`}>
            <a className="inline-block text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
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

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTerm(searchTerm), 500);
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
          hide_business_name,
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
      if (error) console.error('❌ Error fetching listings:', error);
      else setListings(data);
      setLoading(false);
    }

    fetchListings();
  }, [debouncedTerm]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">
          Explore Available Businesses for Sale
        </h1>

        {/* 🔍 Search */}
        <div className="max-w-xl mx-auto mb-8">
          <input
            type="text"
            placeholder="Search by name, industry, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 🔓 Unlock Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 max-w-3xl mx-auto text-center border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Unlock Full Buyer Access</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Unlock AI-powered tools to make smarter offers and match with the right businesses.
          </p>

          <div className="text-left max-w-md mx-auto space-y-3 mb-6">
            {[
              'Access detailed financials and seller info',
              'Message sellers directly',
              'Save and track listings in your dashboard',
              'Use our AI-powered Deal Maker to structure offers',
              'Get AI-matched with businesses that fit your goals'
            ].map((text, idx) => (
              <div className="flex items-start" key={idx}>
                <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="ml-3 text-gray-700">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-4">
            <Link href="/buyer-onboarding">
              <a className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow">
                Create Buyer Profile
              </a>
            </Link>
            <Link href="/login">
              <a className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold border">
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
    </div>
  );
}
