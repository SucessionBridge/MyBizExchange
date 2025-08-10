import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
          className="w-full h-52 object-cover object-center"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder.png';
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
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [searchError, setSearchError] = useState(''); // inline errors (e.g., Ad not found)

  const [savedIds, setSavedIds] = useState([]);
  const [buyerEmail, setBuyerEmail] = useState(null);
  const [error, setError] = useState('');

  // Debounce search input for normal keyword queries
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch listings based on debouncedTerm (keyword search or ad filter fallback)
  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      setError('');

      // Detect if the debounced term looks like an ad number (digits), e.g., SB-1234 / SB1234 / 1234
      const adMatch = debouncedTerm.match(/(\d{2,10})$/); // last 2–10 digits
      const looksLikeAd = !!adMatch && /^[A-Z\s\-]*\d+$/i.test(debouncedTerm);

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
        .eq('status', 'active');

      if (debouncedTerm !== '') {
        if (looksLikeAd) {
          const adNum = adMatch[1];
          query = query.eq('ad_id', adNum);
        } else {
          query = query.or(
            `business_name.ilike.%${debouncedTerm}%,industry.ilike.%${debouncedTerm}%,location.ilike.%${debouncedTerm}%,business_description.ilike.%${debouncedTerm}%,ai_description.ilike.%${debouncedTerm}%`
          );
        }
      }

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

  // Unified search submit: try Ad # redirect first, else normal search
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setSearchError('');

    const raw = (searchTerm || '').trim().toUpperCase();
    if (!raw) return;

    // Try to extract trailing digits as Ad # (supports SB-1234, SB1234, 1234)
    const match = raw.match(/(\d{2,10})$/);
    if (match) {
      const adNum = match[1];

      try {
        const { data, error } = await supabase
          .from('sellers')
          .select('id')
          .eq('ad_id', adNum)
          .maybeSingle();

        if (error) throw error;

        if (data?.id) {
          router.push(`/listings/${data.id}`);
          return; // stop; we navigated
        } else {
          setSearchError(`No listing found for Ad #${adNum}. Showing search results instead.`);
        }
      } catch (err) {
        console.error('Ad lookup failed:', err);
        setSearchError('Sorry, something went wrong with Ad # search. Showing keyword results instead.');
      }
    }

    // Normal keyword search fallback (just force the debounce immediately)
    setDebouncedTerm(searchTerm.trim());
  };

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

        {/* 🔍 Unified Search (keywords or Ad #) */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto mb-2">
          {/* Responsive grid prevents the Clear button from drifting on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
            <input
              type="text"
              placeholder="Search listings or Ad #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]"
              aria-label="Search listings or by Ad number"
            />
            <button
              type="submit"
              className="w-full sm:w-auto bg-[#1E3A8A] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#0f2357] transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setDebouncedTerm(''); setSearchError(''); }}
              className="w-full sm:w-auto bg-gray-100 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-200 border"
              aria-label="Clear search"
            >
              Clear
            </button>
          </div>
          {/* Tip + inline errors */}
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              Tip: you can enter <span className="font-mono">SB-5553</span> or just <span className="font-mono">5553</span>.
            </p>
            {searchError && <p className="text-xs text-red-600 mt-1">{searchError}</p>}
          </div>
        </form>

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

          {/* Buttons: **grid** to avoid any overlap on mobile; row on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/buyer-onboarding">
              <a className="block w-full text-center bg-[#1E3A8A] hover:bg-[#0f2357] text-white px-6 py-3 rounded-lg font-semibold shadow">
                Create Buyer Profile
              </a>
            </Link>
            <Link href="/login">
              <a className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold border">
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

