import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from "../lib/supabaseClient";

export default function BuyerDashboard() {
  const router = useRouter();
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedListings, setSavedListings] = useState([]);

  useEffect(() => {
    const fetchProfileAndListings = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('buyers')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('No buyer profile found.');
        setBuyerProfile(null);
      } else {
        setBuyerProfile(profileData);
        fetchSavedListings(profileData.email);
      }

      setLoading(false);
    };

    fetchProfileAndListings();
  }, []);

  async function fetchSavedListings(email) {
    const { data, error } = await supabase
      .from('saved_listings')
      .select('id, listing_id, sellers(*)')
      .eq('buyer_email', email);

    if (error) {
      console.error('Failed to load saved listings:', error);
    } else {
      setSavedListings(data);
    }
  }

  async function handleUnsave(listingId) {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('listing_id', listingId)
      .eq('buyer_email', buyerProfile.email);

    if (error) {
      console.error('Unsave failed:', error);
      alert('Unable to remove from saved listings.');
    } else {
      setSavedListings((prev) =>
        prev.filter((entry) => entry.listing_id !== listingId)
      );
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-900 text-center">
        {buyerProfile?.name ? `Welcome back, ${buyerProfile.name}` : 'Buyer Dashboard'}
      </h1>

      {!buyerProfile ? (
        <div className="text-center">
          <p className="text-gray-700 mb-4">
            You haven't completed your buyer profile yet.
          </p>
          <button
            onClick={() => router.push('/buyer-onboarding')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold"
          >
            Complete Buyer Profile
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-xl shadow space-y-4 mb-10">
            <h2 className="text-xl font-semibold text-blue-800">Your Profile</h2>
            <p><strong>Name:</strong> {buyerProfile.name}</p>
            <p><strong>Email:</strong> {buyerProfile.email}</p>
            <p><strong>Financing Type:</strong> {buyerProfile.financing_type}</p>
            <p><strong>Experience (1-5):</strong> {buyerProfile.experience}</p>
            <p><strong>Industry Preference:</strong> {buyerProfile.industry_preference}</p>
            <p><strong>Capital Investment:</strong> ${buyerProfile.capital_investment}</p>
            <p><strong>Budget for Purchase:</strong> ${buyerProfile.budget_for_purchase}</p>
            <p><strong>Relocation:</strong> {buyerProfile.willing_to_relocate}</p>
            <p><strong>City/State:</strong> {buyerProfile.city}, {buyerProfile.state_or_province}</p>
            <p><strong>Short Introduction:</strong> {buyerProfile.short_introduction}</p>

            {buyerProfile.video_introduction && (
              <div>
                <p className="font-semibold mt-4 mb-2">Intro Video:</p>
                <video src={buyerProfile.video_introduction} controls className="w-full max-w-md rounded-lg" />
              </div>
            )}

            <button
              onClick={() => router.push('/buyer-onboarding?redirect=/dashboard')}
              className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Edit My Profile
            </button>
          </div>

          {savedListings.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Saved Listings</h2>
              <ul className="space-y-4">
                {savedListings.map((entry) => (
                  <li key={entry.id} className="border p-4 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {entry.sellers?.industry} in {entry.sellers?.location}
                        </h3>
                        <p className="text-gray-700">
                          Asking Price: ${entry.sellers?.asking_price?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <button
                          onClick={() => router.push(`/listings/${entry.listing_id}`)}
                          className="text-blue-600 hover:underline text-sm mr-4"
                        >
                          View Listing
                        </button>
                        <button
                          onClick={() => handleUnsave(entry.listing_id)}
                          className="text-red-500 hover:underline text-sm"
                        >
                          Unsave
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}


