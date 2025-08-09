import { useEffect, useState } from 'react';
import supabase from '../../lib/supabaseClient'; // Adjust path if needed
import Link from 'next/link';

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adIdSearch, setAdIdSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings(adId) {
    setLoading(true);
    setError('');
    let query = supabase
      .from('sellers')
      .select('id, business_name, location, asking_price, ad_id')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (adId) {
      // Search by ad_id exact match
      query = supabase
        .from('sellers')
        .select('id, business_name, location, asking_price, ad_id')
        .eq('ad_id', adId);
    }

    const { data, error } = await query;

    if (error) {
      setError('Error loading listings.');
      setListings([]);
    } else {
      setListings(data);
      if (adId && data.length === 0) {
        setError(`No listings found with Ad ID "${adId}".`);
      }
    }
    setLoading(false);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (adIdSearch.trim() === '') {
      fetchListings(); // fetch all
    } else {
      fetchListings(adIdSearch.trim().toUpperCase());
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Business Listings</h1>

      <form onSubmit={handleSearchSubmit} className="mb-6">
        <label htmlFor="adIdSearch" className="block mb-2 font-semibold">
          Search by Ad ID:
        </label>
        <input
          id="adIdSearch"
          type="text"
          placeholder="e.g. SB-1234"
          value={adIdSearch}
          onChange={(e) => setAdIdSearch(e.target.value)}
          className="border rounded p-2 w-60"
        />
        <button
          type="submit"
          className="ml-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
        {adIdSearch && (
          <button
            type="button"
            onClick={() => {
              setAdIdSearch('');
              fetchListings();
            }}
            className="ml-3 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Clear
          </button>
        )}
      </form>

      {loading && <p>Loading listings...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {listings.length === 0 && !loading ? (
        <p>No listings available.</p>
      ) : (
        <ul className="space-y-4">
          {listings.map((listing) => (
            <li key={listing.id} className="bg-white p-4 rounded shadow hover:shadow-md">
              <Link href={`/listings/${listing.id}`}>
                <a className="text-xl font-semibold text-blue-600 hover:underline">
                  {listing.business_name || 'Unnamed Business'}
                </a>
              </Link>
              <p className="text-gray-700">{listing.location}</p>
              <p className="text-green-700 font-semibold">
                Asking Price: {listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : 'Inquire'}
              </p>
              <p className="text-sm text-gray-500 font-mono">Ad ID: <strong>{listing.ad_id || 'N/A'}</strong></p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

