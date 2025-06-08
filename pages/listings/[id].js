import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function ListingDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyerProfile, setBuyerProfile] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      // 1. Fetch the listing
      const { data: listingData, error: listingError } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', id)
        .single();

      if (listingError) {
        console.error('Error fetching listing:', listingError);
      } else {
        setListing(listingData);
      }

      // 2. Check if the current user has a buyer profile
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email;

      if (userEmail) {
        const { data: buyer, error: buyerError } = await supabase
          .from('buyers')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (buyer && !buyerError) {
          setBuyerProfile(buyer);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!listing) return <div className="p-8 text-center text-red-600">Listing not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-4">{listing.business_name}</h1>
      <p className="text-gray-600 mb-2">{listing.location} • {listing.industry}</p>

      {listing.images?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {listing.images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Business Image ${index + 1}`}
              className="w-full h-64 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      <div className="space-y-2 text-gray-800 text-sm">
        <p><strong>Annual Revenue:</strong> ${listing.annual_revenue?.toLocaleString()}</p>
        <p><strong>Annual Profit (SDE):</strong> ${listing.annual_profit?.toLocaleString()}</p>
        <p><strong>Asking Price:</strong> ${listing.asking_price?.toLocaleString()}</p>
        <p><strong>Includes Inventory:</strong> {listing.includes_inventory || 'No'}</p>
        <p><strong>Includes Building:</strong> {listing.includes_building || 'No'}</p>
        <p><strong>Financing Option:</strong> {listing.financing_type}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Business Description</h2>
        <p className="text-gray-700">{listing.business_description}</p>
      </div>

      <div className="mt-8 text-center">
        {buyerProfile ? (
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
            ✅ Message Seller
          </button>
        ) : (
          <Link href={`/buyer-onboarding?redirect=/listings/${id}`}>
            <a className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
              Request More Info
            </a>
          </Link>
        )}
      </div>
    </div>
  );
}


