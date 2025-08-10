import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import Link from 'next/link';
import Head from 'next/head';
import { BookmarkIcon as OutlineBookmark } from '@heroicons/react/24/outline';
import { BookmarkIcon as SolidBookmark } from '@heroicons/react/24/solid';

function ListingCard({ listing, index, onSave, saved }) {
  const imageUrl =
    Array.isArray(listing.image_urls) &&
    listing.image_urls.length > 0 &&
    listing.image_urls[0]
      ? listing.image_urls[0]
      : null;

  const displayName = listing.hide_business_name
    ? 'Confidential Business Listing'
    : (listing.business_name && listing.business_name.trim()) ||
      (listing.businessName && listing.businessName.trim()) ||
      `${listing.industry || 'Unnamed'} Business`;

  const description =
    listing.description_choice === 'ai'
      ? listing.ai_description?.trim()
      : listing.business_description?.trim();

  return (
    <div
      key={`${listing.id}-${index}`}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#D4AF37] flex flex-col"
    >
      {/* Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${displayName} image`}
          className="w-full h-52 object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.png';
          }}
        />
      ) : (
        <div className="w-full h-52 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-400 font-semibold text-lg">
          No Image Available
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow relative">
        {/* Save Icon */}
        {onSave && (
          <button
            onClick={() => onSave(listing.id)}
            className="absolute top-4 right-4"
            aria-label="Save Listing"
          >
            {saved ? (
              <SolidBookmark className="w-7 h-7 text-[#D4AF37]" />
            ) : (
              <OutlineBookmark className="w-7 h-7 text-gray-400 hover:text-[#D4AF37]" />
            )}
          </button>
        )}

        <h2 className="text-xl font-bold text-[#1E3A8A] mb-1">{displayName}</h2>
        <div className="h-1 w-12 bg-[#D4AF37] rounded-full mb-2"></div>

        <p className="text-sm text-gray-500 font-medium mb-2">
          {(listing.location || 'Unknown')} • {(listing.industry || 'Unspecified')}
        </p>

        {/* Display Ad ID */}
        <p className="text-sm text-gray-500 font-mono mb-2">
          Ad ID: <strong>{listing.ad_id || 'N/A'}</strong>
        </p>

        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed mb-4">
          {description || 'No description provided.'}
        </p>

        {/* Financials */}
        <div className="grid grid-cols-3 gap-3 text-sm text-gray-800 mb-3">
          <div>
            <p className="font-semibold text-[#1E3A8A]">Revenue</p>
            <p>${Number(listing.annual_revenue || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold text-[#1E3A8A]">Profit</p>
            <p>${Number(listing.annual_profit || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold text-[#1E3A8A]">Price</p>
            <p>${Number(listing.asking_price || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Financing Badge */}
        {listing.financing_type?.toLowerCase().includes('seller') && (
          <span className="inline-block bg-[#FFF8E1] text-[#1E3A8A] text-xs font-semibold px-2 py-1 rounded border border-[#D4AF37] mb-3">
            Seller Financing Available
          </span>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <Link href={`/listings/${listing.id}`}>
            <a className="block w-full bg-[#1E3A8A] hover:bg-[#0f2357] text-white font-medium text-center py-2 rounded-lg transition">
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
  const [savedIds, setSavedIds] = useState([]);
  const [buyerEmail, setBuyerEmail] = useState(null);
  const [error, setError] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      setError('');

      // If search term looks like Ad ID, query by exact ad_id
      const isAdIdSearch = /^SB-\d+$/i.test(debouncedTerm);

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
          created_at,
          ad_id,
          status
        `)
        .order('created_at', { ascending: false })
        .eq('status', 'active'); // Only active listings

      if (debouncedTerm !== '') {
        if (isAdIdSearch) {
          query = query.eq('ad_id', debouncedTerm.toUpperCase());
        } else {
          query = query.or(
            `business_name.ilike.%${debouncedTerm}%,industry.ilike.%${debouncedTerm}%,location.ilike.%${debouncedTerm}%,business_description.ilike.%${debouncedTerm}%,ai_description.ilike.%${debouncedTerm}%`
          );
        }
      }

      // Ensure we still filter by active status after search filters
      query = query.eq('status', 'active');

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching listings:', error);
        setError('Error loading listings.');
        setListings([]);
      } else {
        setListings(data);
      }
      setLoading(false);
    }

    async function fetchBuyer() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setBuyerEmail(user.email);
    }

    fetchListings();
    fetchBuyer();
  }, [debouncedTerm]);

  async function handleSave(listingId) {
    if (!buyerEmail) {
      alert('You must be logged in as a buyer to save listings.');
      return;
    }

    const alreadySaved = savedIds.includes(listingId);
    if (alreadySaved) {
      await supabase.from('saved_listings').delete().eq('listing_id', listingId).eq('buyer_email', buyerEmail);
      setSavedIds((prev) => prev.filter((id) => id !== listingId));
    } else {
      await supabase.from('saved_listings').insert([{ buyer_email: buyerEmail, listing_id: listingId }]);
      setSavedIds((prev) => [...prev, listingId]);
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>Buy a Business | SuccessionBridge Marketplace</title>
        <meta name="description" content="Browse businesses for sale and buy a business with SuccessionBridge's marketplace." />
      </Head>

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-12">
        <h1 className="text-4xl font-bold text-center text-[#1E3A8A] mb-2">
          Buy a Business – Explore Available Opportunities
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Discover businesses for sale and make your next big move with SuccessionBridge.
        </p>

        {/* 🔍 Search */}
        <div className="max-w-xl mx-auto mb-8 flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search by name, industry, location or Ad ID (e.g. SB-1234)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]"
          />
          <button
            onClick={() => setSearchTerm('')}
            className="bg-gray-300 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-400"
            aria-label="Clear search"
          >
            Clear
          </button>
        </div>

        {/* 🔓 Unlock Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 max-w-3xl mx-auto text-center border border-gray-100">
          <h2 className="text-3xl font-bold text-[#1E3A8A] mb-3">Unlock Full Buyer Access</h2>
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
              <a className="bg-[#1E3A8A] hover:bg-[#0f2357] text-white px-6 py-3 rounded-lg font-semibold shadow">
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

        {error && <p className="text-center text-red-600 mb-6">{error}</p>}

        {loading ? (
          <p className="text-center text-gray-600">Loading listings...</p>
        ) : listings.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500 mb-4">No businesses found for your search.</p>
            <Link href="/buyer-onboarding">
              <a className="inline-block bg-[#1E3A8A] hover:bg-[#0f2357] text-white px-6 py-3 rounded-lg font-semibold shadow">
                Create Buyer Profile
              </a>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {listings.map((listing, index) => (
              <ListingCard
                key={`${listing.id}-${index}`}
                listing={listing}
                index={index}
                onSave={buyerEmail ? handleSave : null}
                saved={savedIds.includes(listing.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
