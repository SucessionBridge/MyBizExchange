import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ListingDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [listing, setListing] = useState(null);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
    } else {
      setListing(data);
    }
  };

  if (!listing) {
    return <div className="p-8 text-center text-gray-600">Loading listing...</div>;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-4">{listing.business_name}</h1>
      <p className="text-gray-700 mb-2"><strong>Industry:</strong> {listing.industry}</p>
      <p className="text-gray-700 mb-2"><strong>Location:</strong> {listing.location}</p>
      <p className="text-gray-700 mb-2"><strong>Annual Revenue:</strong> ${listing.annual_revenue}</p>
      <p className="text-gray-700 mb-2"><strong>Annual Profit:</strong> ${listing.annual_profit}</p>
      <p className="text-gray-700 mb-2"><strong>Asking Price:</strong> ${listing.asking_price}</p>
      <p className="text-gray-700 mb-4"><strong>Description:</strong> {listing.business_description}</p>

      {listing.images?.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          {listing.images.map((url, idx) => (
            <img key={idx} src={url} alt={`Business Image ${idx + 1}`} className="rounded shadow" />
          ))}
        </div>
      )}
    </main>
  );
}
