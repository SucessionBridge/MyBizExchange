import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase.from('sellers').select('*');
      if (error) console.error('Error fetching listings:', error);
      else setListings(data);
      setLoading(false);
    };
    fetchListings();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10">Browse Businesses for Sale</h1>
        {loading ? (
          <p className="text-center text-gray-600">Loading listings...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-5 flex flex-col"
              >
                {listing.images?.length > 0 && (
                  <img
                    src={listing.images[0]}
                    alt={listing.business_name}
                    className="h-48 w-full object-cover rounded-xl mb-4"
                  />
                )}
                <h2 className="text-xl font-semibold mb-1">{listing.business_name}</h2>
                <p className="text-sm text-gray-500 mb-2">{listing.industry} &bull; {listing.location}</p>
                <p className="mb-1"><span className="font-medium">Asking Price:</span> ${listing.asking_price?.toLocaleString()}</p>
                <p className="mb-1"><span className="font-medium">Annual Profit:</span> ${listing.annual_profit?.toLocaleString()}</p>
                <p className="mb-1"><span className="font-medium">Financing:</span> {listing.financing_type}</p>
                <p className="text-gray-600 mt-2 text-sm line-clamp-3">{listing.business_description}</p>
                <button className="mt-auto bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 font-semibold mt-4">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
