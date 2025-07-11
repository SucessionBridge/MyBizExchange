// pages/seller-wizard.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SellerWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
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
    customerType: '',
    ownerInvolvement: '',
    growthPotential: '',
    reasonForSelling: '',
    trainingOffered: '',
    images: []
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const generateAIDescription = async () => {
    setLoadingAI(true);
    const res = await fetch('/api/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData })
    });
    const data = await res.json();
    if (res.ok) setAiDescription(data.description);
    setLoadingAI(false);
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
    form.append('ai_description', aiDescription);
    const res = await fetch('/api/submit-seller-listing', {
      method: 'POST',
      body: form
    });
    if (res.ok) router.push('/seller-dashboard');
  };

  const handlePreview = async () => {
    await generateAIDescription();
    setPreviewMode(true);
  };

  const formatCurrency = (val) => val ? `$${parseFloat(val).toLocaleString()}` : '';

  const renderImages = () => (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {imagePreviews.map((src, idx) => (
        <img key={idx} src={src} className="rounded w-full h-32 object-cover" />
      ))}
    </div>
  );

  const renderBackButton = () => (
    <button onClick={() => setStep((s) => Math.max(1, s - 1))} className="text-sm text-blue-500 underline mt-2">Back</button>
  );

  if (previewMode) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Preview Your Listing</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            {!formData.hideBusinessName && <p><strong>Business Name:</strong> {formData.businessName}</p>}
            <p><strong>Location:</strong> {formData.location}</p>
            <p><strong>Website:</strong> {formData.website}</p>
            <p><strong>Asking Price:</strong> {formatCurrency(formData.askingPrice)}</p>
            <p><strong>Annual Revenue:</strong> {formatCurrency(formData.annualRevenue)}</p>
            <p><strong>SDE:</strong> {formatCurrency(formData.sde)}</p>
            <p><strong>Employees:</strong> {formData.employees}</p>
            <p><strong>Monthly Lease:</strong> {formatCurrency(formData.monthly_lease)}</p>
            <p><strong>Includes Inventory:</strong> {formData.includesInventory ? 'Yes' : 'No'}</p>
            <p><strong>Includes Building:</strong> {formData.includesBuilding ? 'Yes' : 'No'}</p>
            <p><strong>Real Estate Included:</strong> {formData.real_estate_included ? 'Yes' : 'No'}</p>
            <p><strong>Relocatable:</strong> {formData.relocatable ? 'Yes' : 'No'}</p>
            <p><strong>Home-Based:</strong> {formData.home_based ? 'Yes' : 'No'}</p>
            <p><strong>Financing Type:</strong> {formData.financingType.replace('-', ' ')}</p>
          </div>
          <div>{renderImages()}</div>
        </div>

        {aiDescription && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Business Summary</h2>
            <p className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{aiDescription}</p>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <button onClick={() => setPreviewMode(false)} className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded">Edit</button>
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Submit Listing</button>
        </div>
      </main>
    );
  }

  return <></>; // placeholder
}
