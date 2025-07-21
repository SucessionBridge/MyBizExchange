// pages/edit-listing/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import supabase from '../../lib/supabaseClient';


export default function EditListing() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        alert('Error loading listing');
        router.push('/seller-dashboard');
      } else {
        setFormData(data);
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('sellers')
      .update(formData)
      .eq('id', id);

    if (error) {
      alert('Error saving changes');
    } else {
      alert('✅ Listing updated successfully');
      router.push('/seller-dashboard');
    }

    setSaving(false);
  };

  if (loading) return <div className="p-6">Loading listing...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Edit Listing</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="business_name"
            value={formData.business_name || ''}
            onChange={handleChange}
            placeholder="Business Name"
            className="w-full border p-3 rounded"
          />
          <input
            name="industry"
            value={formData.industry || ''}
            onChange={handleChange}
            placeholder="Industry"
            className="w-full border p-3 rounded"
          />
          <input
            name="location"
            value={formData.location || ''}
            onChange={handleChange}
            placeholder="Location"
            className="w-full border p-3 rounded"
          />
          <input
            name="asking_price"
            value={formData.asking_price || ''}
            onChange={handleChange}
            placeholder="Asking Price"
            type="number"
            className="w-full border p-3 rounded"
          />
          <input
            name="annual_revenue"
            value={formData.annual_revenue || ''}
            onChange={handleChange}
            placeholder="Annual Revenue"
            type="number"
            className="w-full border p-3 rounded"
          />
          <input
            name="annual_profit"
            value={formData.annual_profit || ''}
            onChange={handleChange}
            placeholder="Annual Profit"
            type="number"
            className="w-full border p-3 rounded"
          />
          <textarea
            name="business_description"
            value={formData.business_description || ''}
            onChange={handleChange}
            placeholder="Business Description"
            rows="4"
            className="w-full border p-3 rounded"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-semibold"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </main>
  );
}
