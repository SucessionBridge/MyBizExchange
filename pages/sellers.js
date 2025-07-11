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
    <div className="space-y-2">
      <label>Upload Photos:</label>
      <input type="file" multiple onChange={handleImageUpload} accept="image/*" />
      <div className="grid grid-cols-2 gap-2 mt-2">
        {imagePreviews.map((src, idx) => (
          <img key={idx} src={src} className="rounded w-full h-32 object-cover" />
        ))}
      </div>
    </div>
  );

  const renderBackButton = () => (
    <button onClick={() => setStep((s) => Math.max(1, s - 1))} className="text-sm text-blue-500 underline mt-2">Back</button>
  );

  if (previewMode) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Preview Your Listing</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
          <div className="grid grid-cols-2 gap-2">
            {imagePreviews.map((src, idx) => (
              <img key={idx} src={src} className="rounded w-full h-32 object-cover" />
            ))}
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Business Overview</h2>
          <p className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{aiDescription}</p>
        </div>
        <div className="mt-6 flex gap-4">
          <button onClick={() => setPreviewMode(false)} className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded">Edit</button>
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Submit Listing</button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>

        {step === 1 && (
          <div className="space-y-4">
            <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full border p-3 rounded" />
            <label className="flex items-center"><input name="hideBusinessName" type="checkbox" checked={formData.hideBusinessName} onChange={handleChange} className="mr-2" />Hide Business Name</label>
            <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-3 rounded">Next</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="website" placeholder="Website" value={formData.website} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="annualRevenue" placeholder="Annual Revenue" value={formData.annualRevenue} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="sde" placeholder="Seller Discretionary Earnings (SDE)" value={formData.sde} onChange={handleChange} className="w-full border p-3 rounded" />
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
        )}

        {step === 3 && (
          <div className="space-y-4">
            <textarea name="businessDescription" placeholder="Brief business description" value={formData.businessDescription} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="customerType" placeholder="Customer Type" value={formData.customerType} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="ownerInvolvement" placeholder="Owner Involvement" value={formData.ownerInvolvement} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="growthPotential" placeholder="Growth Potential" value={formData.growthPotential} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="reasonForSelling" placeholder="Reason for Selling" value={formData.reasonForSelling} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="trainingOffered" placeholder="Training Offered" value={formData.trainingOffered} onChange={handleChange} className="w-full border p-3 rounded" />
            <button onClick={handlePreview} className="w-full bg-yellow-500 text-white py-3 rounded">Preview My Listing</button>
            {loadingAI && <p className="text-sm text-blue-500">Generating AI-enhanced summary…</p>}
            {renderBackButton()}
          </div>
        )}
      </div>
    </main>
  );
}


