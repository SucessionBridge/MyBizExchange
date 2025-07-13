import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SellerWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    hideBusinessName: false,
    industry: '',
    location: '',
    website: '',
    annualRevenue: '',
    sde: '',
    askingPrice: '',
    employees: '',
    monthly_lease: '',
    inventory_value: '',
    equipment_value: '',
    includesInventory: false,
    includesBuilding: false,
    real_estate_included: false,
    relocatable: false,
    home_based: false,
    financingType: 'buyer-financed',
    businessDescription: '',
    aiDescription: '',
    customerType: '',
    ownerInvolvement: '',
    growthPotential: '',
    reasonForSelling: '',
    trainingOffered: '',
    sentenceSummary: '',
    customers: '',
    bestSellers: '',
    customerLove: '',
    repeatCustomers: '',
    keepsThemComing: '',
    proudOf: '',
    adviceToBuyer: '',
    annualProfit: '',
    images: []
  });

  // ✅ AI-enhanced description generation on preview
  useEffect(() => {
    if (previewMode && !formData.aiDescription) {
      const fetchDescription = async () => {
        try {
          const res = await fetch('/api/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sentenceSummary: formData.sentenceSummary,
              customers: formData.customers,
              opportunity: formData.growthPotential,
              uniqueEdge: formData.customerLove || formData.proudOf,
              industry: formData.industry,
              location: formData.location
            })
          });

          if (!res.ok) {
            const err = await res.json();
            console.error('AI description error:', err.message);
            return;
          }

          const data = await res.json();
          setFormData(prev => ({ ...prev, aiDescription: data.description }));
        } catch (err) {
          console.error('AI fetch failed:', err);
        }
      };
      fetchDescription();
    }
  }, [previewMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const handleSubmit = async () => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'images') {
        value.forEach((file, i) => form.append(`images[${i}]`, file));
      } else {
        form.append(key, value);
      }
    });

    const res = await fetch('/api/submit-seller-listing', {
      method: 'POST',
      body: form
    });
    if (res.ok) router.push('/seller-dashboard');
  };

  const formatCurrency = (val) => val ? `$${parseFloat(val).toLocaleString()}` : '';

  const renderBackButton = () => (
    <button onClick={() => setStep(s => Math.max(1, s - 1))} className="text-sm text-blue-600 underline mt-2">Back</button>
  );

  const renderImages = () => (
    <div className="space-y-2">
      <label className="text-sm font-medium">Upload Photos:</label>
      <input type="file" multiple onChange={handleImageUpload} accept="image/*" />
    </div>
  );
  const renderPreview = () => (
    <div className="p-6 bg-gray-50 rounded-lg shadow-md">
      {/* Header */}
      <h2 className="text-3xl font-extrabold mb-4 text-gray-900">
        {formData.businessName || 'Business Listing Preview'}
      </h2>

      {/* Image Carousel */}
      {imagePreviews.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {imagePreviews.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`Preview ${idx + 1}`}
              className="w-full h-64 object-cover rounded"
            />
          ))}
        </div>
      )}

      {/* At-a-Glance */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">At a Glance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-gray-700">
          {!formData.hideBusinessName && (
            <>
              <dt className="font-medium">Business Name:</dt>
              <dd>{formData.businessName}</dd>
            </>
          )}
          <dt className="font-medium">Location:</dt>
          <dd>{formData.location}</dd>

          <dt className="font-medium">Website:</dt>
          <dd>
            {formData.website ? (
              <a href={formData.website} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                {formData.website}
              </a>
            ) : 'N/A'}
          </dd>

          <dt className="font-medium">Asking Price:</dt>
          <dd>{formatCurrency(formData.askingPrice)}</dd>

          <dt className="font-medium">Annual Revenue:</dt>
          <dd>{formatCurrency(formData.annualRevenue)}</dd>

          <dt className="font-medium">SDE:</dt>
          <dd>{formatCurrency(formData.sde)}</dd>

          <dt className="font-medium">Employees:</dt>
          <dd>{formData.employees || 'N/A'}</dd>
        </div>
      </section>

      {/* Business Highlights */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Business Highlights</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          {formData.includesInventory && <li>Includes Inventory</li>}
          {formData.includesBuilding && <li>Includes Building</li>}
          {formData.real_estate_included && <li>Real Estate Included</li>}
          {formData.relocatable && <li>Relocatable Business</li>}
          {formData.home_based && <li>Home-Based Operation</li>}
          {formData.trainingOffered && <li>Training Offered</li>}
          {formData.reasonForSelling && <li>Seller's Motivation: {formData.reasonForSelling}</li>}
          {formData.ownerInvolvement && <li>Owner Involvement: {formData.ownerInvolvement}</li>}
          {formData.customerType && <li>Primary Customers: {formData.customerType}</li>}
          {formData.growthPotential && <li>Growth Opportunity: {formData.growthPotential}</li>}
        </ul>
      </section>

      {/* Descriptions */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
        <div className="space-y-4">
          <p className="text-gray-700 whitespace-pre-wrap">{formData.businessDescription}</p>
          {formData.aiDescription && (
            <p className="text-gray-700 whitespace-pre-wrap bg-blue-50 p-4 rounded">{formData.aiDescription}</p>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => setPreviewMode(false)}
          className="flex-1 bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-100"
        >
          Edit
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Listing
        </button>
      </div>
    </div>
  )



  );

  return (
    <main className="bg-white min-h-screen p-6 font-sans">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>
        {previewMode ? renderPreview() : (
          step === 1 ? (
            <div className="space-y-4">
              <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full border p-3 rounded" />
              <label className="flex items-center"><input name="hideBusinessName" type="checkbox" checked={formData.hideBusinessName} onChange={handleChange} className="mr-2" />Hide Business Name</label>
              <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-3 rounded">Next</button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="website" placeholder="Website" value={formData.website} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="annualRevenue" placeholder="Annual Revenue" value={formData.annualRevenue} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="annualProfit" placeholder="Annual Profit" value={formData.annualProfit} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="sde" placeholder="SDE" value={formData.sde} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="askingPrice" placeholder="Asking Price" value={formData.askingPrice} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="employees" placeholder="Number of Employees" value={formData.employees} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="monthly_lease" placeholder="Monthly Lease Amount" value={formData.monthly_lease} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="inventory_value" placeholder="Inventory Value" value={formData.inventory_value} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="equipment_value" placeholder="Equipment Value" value={formData.equipment_value} onChange={handleChange} className="w-full border p-3 rounded" />
              <label className="flex items-center"><input name="includesInventory" type="checkbox" checked={formData.includesInventory} onChange={handleChange} className="mr-2" />Includes Inventory</label>
              <label className="flex items-center"><input name="includesBuilding" type="checkbox" checked={formData.includesBuilding} onChange={handleChange} className="mr-2" />Includes Building</label>
              <label className="flex items-center"><input name="real_estate_included" type="checkbox" checked={formData.real_estate_included} onChange={handleChange} className="mr-2" />Real Estate Included</label>
              <label className="flex items-center"><input name="relocatable" type="checkbox" checked={formData.relocatable} onChange={handleChange} className="mr-2" />Relocatable</label>
              <label className="flex items-center"><input name="home_based" type="checkbox" checked={formData.home_based} onChange={handleChange} className="mr-2" />Home-Based</label>
              <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full border p-3 rounded">
                <option value="buyer-financed">Buyer Financed</option>
                <option value="seller-financed">Seller Financed</option>
                <option value="rent-to-own">Rent to Own</option>
              </select>
              {renderImages()}
              <button onClick={() => setStep(3)} className="w-full bg-blue-600 text-white py-3 rounded">Next</button>
              {renderBackButton()}
            </div>
          ) : (
            <div className="space-y-4">
              <textarea name="businessDescription" placeholder="Brief business description" value={formData.businessDescription} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="customerType" placeholder="Customer Type" value={formData.customerType} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="ownerInvolvement" placeholder="Owner Involvement" value={formData.ownerInvolvement} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="growthPotential" placeholder="Growth Potential" value={formData.growthPotential} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="reasonForSelling" placeholder="Reason for Selling" value={formData.reasonForSelling} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="trainingOffered" placeholder="Training Offered" value={formData.trainingOffered} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="sentenceSummary" placeholder="1-sentence summary of business" value={formData.sentenceSummary} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="customers" placeholder="Who are your customers?" value={formData.customers} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="bestSellers" placeholder="What are your best-selling products/services?" value={formData.bestSellers} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="customerLove" placeholder="What do customers love most?" value={formData.customerLove} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="repeatCustomers" placeholder="How many are repeat buyers?" value={formData.repeatCustomers} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="keepsThemComing" placeholder="Why do they return?" value={formData.keepsThemComing} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="proudOf" placeholder="Something you're proud of?" value={formData.proudOf} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="adviceToBuyer" placeholder="Advice for future owner?" value={formData.adviceToBuyer} onChange={handleChange} className="w-full border p-3 rounded" />
              <button onClick={() => setPreviewMode(true)} className="w-full bg-yellow-500 text-white py-3 rounded">Preview My Listing</button>
              {renderBackButton()}
            </div>
          )
        )}
      </div>
    </main>
  );
}

