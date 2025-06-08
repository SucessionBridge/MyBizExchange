import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function BuyerDashboard() {
  const router = useRouter();
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Fetch current logged-in user
  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login"); // Redirect to login if not authenticated
      } else {
        setUser(user);
        fetchBuyerProfile(user.email);
      }
    }

    fetchUser();
  }, []);

  // Fetch buyer profile from Supabase
  async function fetchBuyerProfile(email) {
    const { data, error } = await supabase
      .from("buyers")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.warn("No buyer profile found.");
      setBuyerProfile(null);
    } else {
      setBuyerProfile(data);
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-900 text-center">Buyer Dashboard</h1>

      {!buyerProfile ? (
        <div className="text-center">
          <p className="text-gray-700 mb-4">
            You haven't completed your buyer profile yet.
          </p>
          <button
            onClick={() => router.push("/buyers")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold"
          >
            Complete Buyer Profile
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
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
        </div>
      )}
    </div>
  );
}

