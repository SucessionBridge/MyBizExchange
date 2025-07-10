import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SellerWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
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
    monthlyLease: '',
    financingType: 'buyer-financed',
    businessDescription: '',
    customerType: '',
    ownerInvolvement: '',
    growthPotential: '',
    reasonForSelling: '',
    trainingOffered: '',
    images: [],
  });

  const [aiDescription, setAiDescription] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

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
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const generateAIDescription = async () => {
    setLoadingAI(true);
    const res = await fetch('/api/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: formData.businessName,
        industry: formData.industry,
        location: formData.location,
        sentenceSummary: formData.businessDescription,
        customers: formData.customerType,
        ownerInvolvement: formData.ownerInvolvement,
        opportunity: formData.growthPotential,
        adviceToBuyer: formData.trainingOffered,
        annualRevenue: formData.annualRevenue,
        annualProfit: formData.sde,
        includesInventory: formData.includesInventory,
        includesBuilding: formData.includesBuilding,
      }),
    });

    const data = await res.json();
    setAiDescription(data.description || '');
    setLoadingAI(false);
  };

  const handleSubmit = async () => {
    const res = await fetch('/api/submit-seller-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, aiDescription }),
    });
    if (res.ok) router.push('/seller-dashboard');
  };

  const handlePreview = async () => {
    await generateAIDescription();
    setPreviewMode(true);
  };

  if (previewMode) {
    return (
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Preview Your Listing</h1>
        <p><strong>Name:</strong> {formData.name}</p>
        <p><strong>Email:</strong> {formData.email}</p>
        {!formData.hideBusinessName && <p><strong>Business Name:</strong> {formData.businessName}</p>}
        <p><strong>Industry:</strong> {formData.industry}</p>
        <p><strong>Location:</strong> {formData.location}</p>
        <p><strong>Annual Revenue:</strong> ${formData.annualRevenue}</p>
        <p><strong>SDE:</strong> ${formData.sde}</p>
        <p><strong>Asking Price:</strong> ${formData.askingPrice}</p>
        <p><strong>Monthly Lease Payment:</strong> ${formData.monthlyLease}</p>
        <p><strong>AI-Generated Description:</strong></p>
        <p className="bg-gray-100 p-4 rounded-md mt-2">{aiDescription || 'No AI description generated yet.'}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-4">
          {imagePreviews.map((src, i) => (
            <img key={i} src={src} alt={`Image ${i + 1}`} className="rounded w-full h-32 object-cover" />
          ))}
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
            <label className="flex items-center"><input name="hideBusinessName" type="checkbox" checked={formData.hideBusinessName} onChange={handleChange} className="mr-2" />Hide Business Name on Public Listing</label>
            <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-3 rounded">Next</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="annualRevenue" placeholder="Annual Revenue" value={formData.annualRevenue} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="sde" placeholder="Seller Discretionary Earnings (SDE)" value={formData.sde} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="askingPrice" placeholder="Asking Price" value={formData.askingPrice} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="monthlyLease" placeholder="Monthly Lease Payment (if any)" value={formData.monthlyLease} onChange={handleChange} className="w-full border p-3 rounded" />
            <div className="flex justify-between gap-4">
              <button onClick={() => setStep(1)} className="w-full bg-gray-300 text-black py-3 rounded">Back</button>
              <button onClick={() => setStep(3)} className="w-full bg-blue-600 text-white py-3 rounded">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <textarea name="businessDescription" placeholder="Briefly describe what your business does" value={formData.businessDescription} onChange={handleChange} className="w-full border p-3 rounded" rows={3} />
            <input name="customerType" placeholder="Who are your customers?" value={formData.customerType} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="ownerInvolvement" placeholder="Your involvement in the business" value={formData.ownerInvolvement} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="growthPotential" placeholder="How could a new owner grow the business?" value={formData.growthPotential} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="reasonForSelling" placeholder="Reason for selling" value={formData.reasonForSelling} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="trainingOffered" placeholder="Will you offer training or support?" value={formData.trainingOffered} onChange={handleChange} className="w-full border p-3 rounded" />
            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full" />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} className="rounded w-full h-32 object-cover" />
                    <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white text-red-600 px-2 py-1 rounded">✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button onClick={handlePreview} className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded">Preview My Listing</button>
              <button onClick={() => setStep(2)} className="bg-gray-300 text-black py-2 rounded">Back</button>
              {loadingAI && <p className="text-center text-sm text-blue-500">⏳ Generating AI-enhanced summary…</p>}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
