// pages/seller-wizard.js
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
    annualRevenue: '',
    sde: '',
    askingPrice: '',
    includesInventory: false,
    includesBuilding: false,
    real_estate_included: false,
    monthly_lease: '',
    inventory_value: '',
    equipment_value: '',
    financingType: 'buyer-financed',
    website: '',
    home_based: false,
    relocatable: false,
    employees: '',
    businessDescription: '',
    aiDescription: '',
    customerType: '',
    ownerInvolvement: '',
    growthPotential: '',
    reasonForSelling: '',
    trainingOffered: '',
    images: []
  });

  useEffect(() => {
    if (previewMode && !formData.aiDescription) {
      const generateDescription = async () => {
        const res = await fetch('/api/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({ ...prev, aiDescription: data.description }));
        }
      };
      generateDescription();
    }
  }, [previewMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleSubmit = async () => {
    const form = new FormData();
    for (const key in formData) {
      if (key === 'images') {
        formData.images.forEach((file, i) => form.append(`images[${i}]`, file));
      } else {
        form.append(key, formData[key]);
      }
    }
    const res = await fetch('/api/submit-seller-listing', {
      method: 'POST',
      body: form
    });
    if (res.ok) router.push('/seller-dashboard');
  };

  const formatCurrency = (val) => val ? `$${parseFloat(val).toLocaleString()}` : '';

  const renderImages = () => (
    <div className="space-y-2">
      <label className="text-sm font-medium">Upload Photos:</label>
      <input type="file" multiple onChange={handleImageUpload} accept="image/*" />
    </div>
  );

  const renderBackButton = () => (
    <button onClick={() => setStep((s) => Math.max(1, s - 1))} className="text-sm text-blue-600 underline mt-2">Back</button>
  );

  if (previewMode) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Preview Your Listing</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3 text-gray-800">
            {!formData.hideBusinessName && <p><strong>Business Name:</strong> {formData.businessName}</p>}
            <p><strong>Location:</strong> {formData.location}</p>
            <p><strong>Website:</strong> {formData.website}</p>
            <p><strong>Asking Price:</strong> {formatCurrency(formData.askingPrice)}</p>
            <p><strong>Annual Revenue:</strong> {formatCurrency(formData.annualRevenue)}</p>
            <p><strong>SDE:</strong> {formatCurrency(formData.sde)}</p>
            <p><strong>Employees:</strong> {formData.employees}</p>
            <p><strong>Monthly Lease:</strong> {formatCurrency(formData.monthly_lease)}</p>
            <p><strong>Inventory Value:</strong> {formatCurrency(formData.inventory_value)}</p>
            <p><strong>Equipment Value:</strong> {formatCurrency(formData.equipment_value)}</p>
            <p><strong>Includes Inventory:</strong> {formData.includesInventory ? 'Yes' : 'No'}</p>
            <p><strong>Includes Building:</strong> {formData.includesBuilding ? 'Yes' : 'No'}</p>
            <p><strong>Real Estate Included:</strong> {formData.real_estate_included ? 'Yes' : 'No'}</p>
            <p><strong>Relocatable:</strong> {formData.relocatable ? 'Yes' : 'No'}</p>
            <p><strong>Home-Based:</strong> {formData.home_based ? 'Yes' : 'No'}</p>
            <p><strong>Customer Type:</strong> {formData.customerType}</p>
            <p><strong>Owner Involvement:</strong> {formData.ownerInvolvement}</p>
            <p><strong>Growth Potential:</strong> {formData.growthPotential}</p>
            <p><strong>Reason for Selling:</strong> {formData.reasonForSelling}</p>
            <p><strong>Training Offered:</strong> {formData.trainingOffered}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {imagePreviews.map((src, idx) => (
              <img key={idx} src={src} className="rounded w-full h-32 object-cover border" />
            ))}
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Business Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed border p-4 rounded bg-gray-50">
            {formData.businessDescription || 'No description provided.'}
          </p>
        </div>
        {formData.aiDescription && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">AI-Enhanced Description</h2>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed border p-4 rounded bg-blue-50">
              {formData.aiDescription}
            </p>
          </div>
        )}
        <div className="mt-6 flex gap-4">
          <button onClick={() => setPreviewMode(false)} className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded">Edit</button>
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Submit Listing</button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen p-6 font-sans">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>
        {/* Form steps go here */}
      </div>
    </main>
  );
}
