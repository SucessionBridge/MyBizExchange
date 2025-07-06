// pages/seller-dashboard.js
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SellerDashboard() {
  const [email, setEmail] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchListings = async () => {
    setLoading(true);
    setError('');
    setListings([]);

    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('email', email.trim());

    if (error) {
      console.error('Error fetching listings:', error.message);
      setError('There was a problem retrieving your listings.');
    } else if (data.length === 0) {
      setError('No listings found for that email.');
    } else {
      setListings(data);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">My Listings</h1>

        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <input
            type="email"
            placeholder="Enter your email to view listings"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-xl mb-4"
          />
          <button
            onClick={handleFetchListings}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold"
            disabled={loading || !email}
          >
            {loading ? 'Loading...' : 'View My Listings'}
          </button>
          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </div>

        {listings.length > 0 && (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white p-4 rounded-xl shadow">
                <h2 className="text-xl font-semibold">{listing.business_name}</h2>
                <p className="text-gray-700 mb-2">{listing.industry} • {listing.location}</p>
                <p><strong>Asking Price:</strong> ${listing.asking_price}</p>
                <p><strong>Annual Revenue:</strong> ${listing.annual_revenue}</p>
                <p><strong>Annual Profit:</strong> ${listing.annual_profit}</p>
                <p className="mt-2 text-sm text-gray-500">Submitted on: {new Date(listing.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
