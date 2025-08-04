import { useState } from 'react';
import supabase from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Sellers() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    business_name: '',
    hide_business_name: false,
    industry: '',
    location: '',
    asking_price: '',
    annual_revenue: '',
    annual_profit: '',
    sde: '',
    inventory_value: '',
    equipment_value: '',
    employees: '',
    monthly_lease: '',
    home_based: false,
    relocatable: false,
    years_in_business: '',
    financing_type: '',
    consider_seller_financing: 'no', // ✅ new field
    possible_seller_financing: false, // ✅ flag for buyers to see
    includes_real_estate: false,
    includes_building: false,
    asking_price_includes_property: false, // ✅ new for clarity
    business_description: '',
    ai_description: '',
    description_choice: 'manual',
    image_urls: [],
  });

  const [images, setImages] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'consider_seller_financing' && (value === 'yes' || value === 'maybe')
        ? { possible_seller_financing: true }
        : name === 'consider_seller_financing'
        ? { possible_seller_financing: false }
        : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData, image_urls: images };

    const { error } = await supabase.from('sellers').insert([payload]);

    if (error) {
      alert('❌ Submission failed.');
      setLoading(false);
    } else {
      alert('✅ Listing submitted!');
      router.push('/thank-you');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-6">Seller Onboarding</h1>

        {!showPreview ? (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ✅ Basic Business Info */}
            <div>
              <label className="block font-semibold mb-1">Business Name</label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
              <label className="inline-flex items-center mt-2">
                <input
                  type="checkbox"
                  name="hide_business_name"
                  checked={formData.hide_business_name}
                  onChange={handleChange}
                  className="mr-2"
                />
                Hide business name from public listing
              </label>
            </div>

            {/* ✅ Location */}
            <div>
              <label className="block font-semibold mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* ✅ Asking Price */}
            <div>
              <label className="block font-semibold mb-1">Asking Price</label>
              <input
                type="number"
                name="asking_price"
                value={formData.asking_price}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
              <label className="inline-flex items-center mt-2">
                <input
                  type="checkbox"
                  name="asking_price_includes_property"
                  checked={formData.asking_price_includes_property}
                  onChange={handleChange}
                  className="mr-2"
                />
                Does the asking price include building/property?
              </label>
            </div>

            {/* ✅ Financials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-1">Annual Revenue</label>
                <input
                  type="number"
                  name="annual_revenue"
                  value={formData.annual_revenue}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Annual Profit</label>
                <input
                  type="number"
                  name="annual_profit"
                  value={formData.annual_profit}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            {/* ✅ Lease */}
            <div>
              <label className="block font-semibold mb-1">
                Monthly Lease Payment for Business Premises
              </label>
              <input
                type="number"
                name="monthly_lease"
                value={formData.monthly_lease}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* ✅ Payment Options Preferences */}
            <div>
              <label className="block text-lg font-bold mb-2">Payment Options Preferences</label>
              <p className="text-gray-600 text-sm mb-3">
                Would you consider seller financing if the buyer and seller could create a deal that
                works for both? Offering seller financing under your own terms can help attract more
                buyers and increase listing visibility.
              </p>
              <select
                name="consider_seller_financing"
                value={formData.consider_seller_financing}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="no">No</option>
                <option value="maybe">Maybe</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {/* ✅ Financing Type */}
            <div>
              <label className="block font-semibold mb-1">Preferred Exit / Payment Structure</label>
              <select
                name="financing_type"
                value={formData.financing_type}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select...</option>
                <option value="buyer-financed">Buyer Financed (Cash/Loan)</option>
                <option value="seller-financed">Seller Financed</option>
                <option value="rent-to-own">Rent to Own</option>
              </select>
            </div>

            {/* ✅ Home Based & Relocatable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="home_based"
                  checked={formData.home_based}
                  onChange={handleChange}
                  className="mr-2"
                />
                Home-Based Business
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="relocatable"
                  checked={formData.relocatable}
                  onChange={handleChange}
                  className="mr-2"
                />
                Relocatable
              </label>
            </div>
// >>> START PART 2 <<<

// ✅ Business Details Section
<div className="bg-white p-6 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold mb-4">Business Details</h2>

  {/* ✅ Monthly Lease */}
  <label className="block text-sm font-medium mb-1">
    Monthly Lease Payment for Business Premises
  </label>
  <input
    type="number"
    className="w-full p-2 border rounded mb-4"
    placeholder="e.g. 2500"
    value={formData.monthly_lease || ''}
    onChange={(e) => setFormData({ ...formData, monthly_lease: e.target.value })}
  />

  {/* ✅ Asking Price */}
  <label className="block text-sm font-medium mb-1">Asking Price</label>
  <input
    type="number"
    className="w-full p-2 border rounded mb-4"
    placeholder="e.g. 150000"
    value={formData.asking_price || ''}
    onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
  />

  {/* ✅ Asking Price Includes Property */}
  <div className="flex items-center gap-2 mb-4">
    <input
      type="checkbox"
      checked={formData.asking_price_includes_property || false}
      onChange={(e) =>
        setFormData({ ...formData, asking_price_includes_property: e.target.checked })
      }
    />
    <label className="text-sm">Asking Price Includes Building / Property</label>
  </div>

  {/* ✅ Home-Based */}
  <div className="flex items-center gap-2 mb-4">
    <input
      type="checkbox"
      checked={formData.home_based || false}
      onChange={(e) => setFormData({ ...formData, home_based: e.target.checked })}
    />
    <label className="text-sm">Home-Based Business</label>
  </div>

  {/* ✅ Relocatable */}
  <div className="flex items-center gap-2 mb-4">
    <input
      type="checkbox"
      checked={formData.relocatable || false}
      onChange={(e) => setFormData({ ...formData, relocatable: e.target.checked })}
    />
    <label className="text-sm">Relocatable Business</label>
  </div>
</div>

{/* ✅ Payment Options Preferences */}
<div className="bg-white p-6 rounded-lg shadow-md mt-6">
  <h2 className="text-2xl font-bold mb-4">Payment Options Preferences</h2>
  <p className="text-gray-600 text-sm mb-4">
    Would you consider seller financing if the buyer and seller could create a deal that works for both parties?
    Listings that allow seller financing typically get more attention from buyers.
  </p>

  <select
    className="w-full p-2 border rounded mb-4"
    value={formData.financing_type || ''}
    onChange={(e) => setFormData({ ...formData, financing_type: e.target.value })}
  >
    <option value="">Select a preference</option>
    <option value="buyer-financed">Buyer Financed (Cash or Bank Loan)</option>
    <option value="seller-financed">Seller Financing (Payments Over Time)</option>
    <option value="rent-to-own">Rent-to-Own Structure</option>
  </select>

  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">Would you consider seller financing?</label>
    <select
      className="w-full p-2 border rounded"
      value={formData.consider_seller_financing || ''}
      onChange={(e) => setFormData({ ...formData, consider_seller_financing: e.target.value })}
    >
      <option value="">Select</option>
      <option value="yes">Yes</option>
      <option value="maybe">Maybe</option>
      <option value="no">No</option>
    </select>
  </div>
</div>

{/* ✅ Description Section */}
<div className="bg-white p-6 rounded-lg shadow-md mt-6">
  <h2 className="text-2xl font-bold mb-4">Business Description</h2>

  {/* ✅ Toggle AI or Manual */}
  <div className="flex gap-4 mb-4">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        value="manual"
        checked={formData.description_choice === 'manual'}
        onChange={() => setFormData({ ...formData, description_choice: 'manual' })}
      />
      <span>Manual Description</span>
    </label>
    <label className="flex items-center gap-2">
      <input
        type="radio"
        value="ai"
        checked={formData.description_choice === 'ai'}
        onChange={() => setFormData({ ...formData, description_choice: 'ai' })}
      />
      <span>AI-Generated Description</span>
    </label>
  </div>

  {/* ✅ Manual Description */}
  {formData.description_choice === 'manual' && (
    <textarea
      className="w-full p-3 border rounded mb-4"
      rows="5"
      placeholder="Describe your business..."
      value={formData.business_description || ''}
      onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
    />
  )}

  {/* ✅ AI Description Input Fields */}
  {formData.description_choice === 'ai' && (
    <div className="space-y-3">
      <input
        type="text"
        className="w-full p-2 border rounded"
        placeholder="What does your business do?"
        value={formData.ai_business_do || ''}
        onChange={(e) => setFormData({ ...formData, ai_business_do: e.target.value })}
      />
      <input
        type="text"
        className="w-full p-2 border rounded"
        placeholder="Who are your customers?"
        value={formData.ai_customers || ''}
        onChange={(e) => setFormData({ ...formData, ai_customers: e.target.value })}
      />
      <input
        type="text"
        className="w-full p-2 border rounded"
        placeholder="What makes your business unique?"
        value={formData.ai_unique_edge || ''}
        onChange={(e) => setFormData({ ...formData, ai_unique_edge: e.target.value })}
      />
    </div>
  )}
</div>

// >>> END PART 2 <<<
// >>> START PART 3 <<<

// ✅ Preview Section
{showPreview && (
  <div className="bg-gray-50 p-6 rounded-lg mt-8 shadow-lg">
    <h2 className="text-3xl font-bold mb-4">Listing Preview</h2>

    {/* ✅ Business Name */}
    <h3 className="text-2xl font-semibold mb-2">
      {formData.hide_business_name
        ? 'Confidential Business Listing'
        : formData.business_name || 'Business for Sale'}
    </h3>
    <p className="text-gray-600 mb-2">{formData.location}</p>

    {/* ✅ Asking Price */}
    <p className="text-xl font-bold text-emerald-700 mb-2">
      Asking Price: {formData.asking_price ? `$${parseFloat(formData.asking_price).toLocaleString()}` : 'Inquire'}
    </p>

    {/* ✅ Seller Financing Tag */}
    {formData.consider_seller_financing === 'yes' || formData.consider_seller_financing === 'maybe' ? (
      <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded font-medium mb-4">
        💰 Seller Financing Possible
      </div>
    ) : null}

    {/* ✅ Lease Info */}
    <p className="text-gray-800">
      <strong>Monthly Lease Payment for Business Premises:</strong>{' '}
      {formData.monthly_lease ? `$${parseFloat(formData.monthly_lease).toLocaleString()}` : 'N/A'}
    </p>

    {/* ✅ Asking Price Includes Property */}
    {formData.asking_price_includes_property && (
      <p className="text-gray-800">🏢 Asking price includes building/property</p>
    )}

    {/* ✅ Business Description */}
    <div className="mt-4">
      <h4 className="text-lg font-semibold mb-2">Business Description:</h4>
      <p className="text-gray-700">
        {formData.description_choice === 'ai'
          ? aiDescription || 'AI description will be generated...'
          : formData.business_description || 'No description provided yet.'}
      </p>
    </div>
  </div>
)}

// ✅ Submit Handler
async function handleSubmit(e) {
  e.preventDefault();
  setSubmitting(true);

  const payload = {
    ...formData,
    asking_price: parseFloat(formData.asking_price) || null,
    monthly_lease: parseFloat(formData.monthly_lease) || null,
    asking_price_includes_property: formData.asking_price_includes_property || false,
    consider_seller_financing: formData.consider_seller_financing || '',
    description_choice: formData.description_choice || 'manual',
    image_urls: uploadedImages,
  };

  const { data, error } = await supabase.from('sellers').insert([payload]);

  if (error) {
    console.error('❌ Error submitting listing:', error);
    alert('There was a problem submitting your listing.');
  } else {
    alert('✅ Your listing has been submitted!');
    router.push('/thank-you');
  }
  setSubmitting(false);
}

// ✅ Main Form
<form onSubmit={handleSubmit} className="space-y-8">
  {/* All sections above */}
  <button
    type="submit"
    disabled={submitting}
    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
  >
    {submitting ? 'Submitting...' : 'Submit Listing'}
  </button>
</form>

// >>> END PART 3 <<<

  
