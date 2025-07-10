// pages/seller-wizard.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function SellerWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [aiDescription, setAiDescription] = useState('');
  const [descriptionMode, setDescriptionMode] = useState('ai');

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
    financingType: 'buyer-financed',
    businessDescription: '',
    images: [],
    customerType: '',
    ownerInvolvement: '',
    growthPotential: '',
    reasonForSelling: '',
    trainingOffered: '',
  });

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const uploadImages = async (files) => {
    const uploadedUrls = [];
    setUploadStatus('Uploading images...');

    for (let file of files) {
      const fileName = `seller-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('new-business-photos').upload(fileName, file);
      if (uploadError) continue;
      const { data } = supabase.storage.from('new-business-photos').getPublicUrl(fileName);
      uploadedUrls.push(data.publicUrl);
    }

    setUploadStatus('');
    return uploadedUrls;
  };

  const generateDescription = async () => {
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
      })
    });
    const data = await res.json();
    if (res.ok) setAiDescription(data.description);
  };

  const handleSubmit = async () => {
    const uploadedUrls = await uploadImages(formData.images);
    const payload = {
      ...formData,
      annual_revenue: parseFloat(formData.annualRevenue),
      annual_profit: parseFloat(formData.sde),
      asking_price: parseFloat(formData.askingPrice),
      images: uploadedUrls,
      ai_description: aiDescription,
    };

    const { error } = await supabase.from('sellers').insert([payload]);
    if (!error) router.push('/listings');
  };

  const StepOne = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Step 1: Contact Info</h2>
      <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="input" />
      <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="input" />
      <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="input" />
      <label className="flex items-center">
        <input type="checkbox" name="hideBusinessName" checked={formData.hideBusinessName} onChange={handleChange} className="mr-2" /> Hide business name from public listing
      </label>
    </div>
  );

  const StepTwo = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Step 2: Business Info</h2>
      <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="input" />
      <input name="location" placeholder="Location (City, State)" value={formData.location} onChange={handleChange} className="input" />
      <input name="annualRevenue" placeholder="Annual Revenue" value={formData.annualRevenue} onChange={handleChange} className="input" />
      <input name="sde" placeholder="Annual Profit / SDE" value={formData.sde} onChange={handleChange} className="input" />
      <input name="askingPrice" placeholder="Asking Price" value={formData.askingPrice} onChange={handleChange} className="input" />
      <label className="flex items-center"><input type="checkbox" name="includesInventory" checked={formData.includesInventory} onChange={handleChange} className="mr-2" />Includes Inventory</label>
      <label className="flex items-center"><input type="checkbox" name="includesBuilding" checked={formData.includesBuilding} onChange={handleChange} className="mr-2" />Includes Building</label>
    </div>
  );

  const StepThree = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Step 3: Operations</h2>
      <input name="customerType" placeholder="Who are your customers?" value={formData.customerType} onChange={handleChange} className="input" />
      <input name="ownerInvolvement" placeholder="Your involvement in the business" value={formData.ownerInvolvement} onChange={handleChange} className="input" />
      <textarea name="businessDescription" placeholder="What does your business do?" value={formData.businessDescription} onChange={handleChange} className="textarea" rows={4} />
    </div>
  );

  const StepFour = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Step 4: Opportunity</h2>
      <textarea name="growthPotential" placeholder="How could a new owner grow this business?" value={formData.growthPotential} onChange={handleChange} className="textarea" rows={3} />
      <textarea name="reasonForSelling" placeholder="Why are you selling?" value={formData.reasonForSelling} onChange={handleChange} className="textarea" rows={2} />
      <textarea name="trainingOffered" placeholder="Will you provide training to the new owner?" value={formData.trainingOffered} onChange={handleChange} className="textarea" rows={2} />
    </div>
  );

  const StepFive = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Step 5: Upload Images</h2>
      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="w-full" />
      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {imagePreviews.map((src, idx) => (
            <img key={idx} src={src} alt="preview" className="w-full h-32 object-cover rounded" />
          ))}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium">Business Description Method:</label>
        <div className="flex gap-4 mt-1">
          <button type="button" className={`btn ${descriptionMode === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setDescriptionMode('ai')}>Use AI</button>
          <button type="button" className={`btn ${descriptionMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setDescriptionMode('manual')}>Write Myself</button>
        </div>
        {descriptionMode === 'ai' && <button onClick={generateDescription} className="btn btn-secondary mt-3">Generate AI Description</button>}
        {aiDescription && <div className="mt-3 p-3 bg-gray-100 rounded">{aiDescription}</div>}
      </div>
    </div>
  );

  const StepSix = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Step 6: Review & Submit</h2>
      <button onClick={handleSubmit} className="btn btn-primary">Submit Listing</button>
    </div>
  );

  const steps = [StepOne, StepTwo, StepThree, StepFour, StepFive, StepSix];
  const CurrentStep = steps[step - 1];

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Seller Onboarding Wizard</h1>
        {uploadStatus && <p className="text-blue-600 text-center mb-4">{uploadStatus}</p>}
        <div className="space-y-6 bg-gray-50 p-6 rounded-xl shadow">
          <CurrentStep />
          <div className="flex justify-between">
            {step > 1 && <button onClick={() => setStep((s) => s - 1)} className="btn">Back</button>}
            {step < steps.length && <button onClick={() => setStep((s) => s + 1)} className="btn btn-primary">Next</button>}
          </div>
        </div>
      </div>
    </main>
  );
}



