// pages/seller-onboarding.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function SellerOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [authEmail, setAuthEmail] = useState('');

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
    aiGeneratedDescription: '',
    images: [],
    customerType: '',
    ownerInvolvement: '',
    growthPotential: '',
    reasonForSelling: '',
    trainingOffered: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setAuthEmail(user.email);
    };
    fetchUser();
  }, []);

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

  const uploadImagesToSupabase = async () => {
    const urls = [];
    for (let file of formData.images) {
      const fileName = `seller-image-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('new-business-photos').upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from('new-business-photos').getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    setUploading(true);
    const uploadedUrls = await uploadImagesToSupabase();
    const payload = {
      ...formData,
      email: authEmail || formData.email,
      images: uploadedUrls,
      ai_description: formData.aiGeneratedDescription,
    };

    const { error } = await supabase.from('sellers').insert([payload]);
    setUploading(false);

    if (error) {
      alert('❌ Failed to submit listing');
    } else {
      alert('✅ Your listing has been submitted!');
      router.push('/seller-dashboard');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">Seller Onboarding</h1>

        {step === 1 && (
          <div className="space-y-4">
            <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full border p-3 rounded" />
            <label className="flex items-center">
              <input type="checkbox" name="hideBusinessName" checked={formData.hideBusinessName} onChange={handleChange} className="mr-2" />
              Hide business name in public listing?
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="location" placeholder="Location (City, State)" value={formData.location} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="annualRevenue" placeholder="Annual Revenue" value={formData.annualRevenue} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="sde" placeholder="Annual Profit / SDE" value={formData.sde} onChange={handleChange} className="w-full border p-3 rounded" />
            <input name="askingPrice" placeholder="Asking Price" value={formData.askingPrice} onChange={handleChange} className="w-full border p-3 rounded" />
            <label className="flex items-center">
              <input type="checkbox" name="includesInventory" checked={formData.includesInventory} onChange={handleChange} className="mr-2" /> Includes Inventory
            </label>
            <label className="flex items-center">
              <input type="checkbox" name="includesBuilding" checked={formData.includesBuilding} onChange={handleChange} className="mr-2" /> Includes Building
            </label>
            <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full border p-3 rounded">
              <option value="buyer-financed">Buyer Financed</option>
              <option value="seller-financing">Seller Financing</option>
              <option value="rent-to-own">Rent-to-Own</option>
            </select>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <textarea name="businessDescription" value={formData.businessDescription} onChange={handleChange} placeholder="Describe your business..." rows="5" className="w-full border p-3 rounded" />
            <textarea name="customerType" value={formData.customerType} onChange={handleChange} placeholder="Who are your customers?" rows="2" className="w-full border p-3 rounded" />
            <textarea name="ownerInvolvement" value={formData.ownerInvolvement} onChange={handleChange} placeholder="What is your role in daily operations?" rows="2" className="w-full border p-3 rounded" />
            <textarea name="growthPotential" value={formData.growthPotential} onChange={handleChange} placeholder="How could the business grow?" rows="3" className="w-full border p-3 rounded" />
            <textarea name="reasonForSelling" value={formData.reasonForSelling} onChange={handleChange} placeholder="Why are you selling?" rows="2" className="w-full border p-3 rounded" />
            <textarea name="trainingOffered" value={formData.trainingOffered} onChange={handleChange} placeholder="Will you offer training or transition help?" rows="2" className="w-full border p-3 rounded" />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <label className="block font-medium">Upload Business Photos</label>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="w-full border p-2 rounded" />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {imagePreviews.map((url, i) => (
                  <img key={i} src={url} className="w-full h-32 object-cover rounded border" alt={`Preview ${i}`} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded bg-gray-300">Back</button>}
          {step < 4 && <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded bg-blue-600 text-white">Next</button>}
          {step === 4 && (
            <button onClick={handleSubmit} className="px-4 py-2 rounded bg-green-600 text-white" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Submit Listing'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

