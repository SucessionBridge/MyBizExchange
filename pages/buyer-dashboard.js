import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function BuyerDashboard() {
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyer = async () => {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching buyer:', error.message);
      } else {
        setBuyer(data);
      }

      setLoading(false);
    };

    fetchBuyer();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!buyer) return <div className="p-8 text-center text-red-500">No buyer profile found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Buyer Dashboard</h1>

      <section className="mb-8 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
        <p><strong>Email:</strong> {buyer.email}</p>
        <p><strong>Capital:</strong> ${buyer.capital?.toLocaleString()}</p>
        <p><strong>Industry Interests:</strong> {buyer.preferred_industries}</p>
        <p><strong>Experience:</strong> {buyer.experience}</p>
        <p><strong>Financing Preference:</strong> {buyer.financing_preference}</p>
      </section>

      {buyer.video_url && (
        <section className="mb-8 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Your Video Pitch</h2>
          <video controls className="w-full max-w-md">
            <source src={buyer.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </section>
      )}

      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Matching Businesses</h2>
        <p>This section will show businesses that match your preferences.</p>
        {/* Matching logic goes here next */}
      </section>
    </div>
  );
}
