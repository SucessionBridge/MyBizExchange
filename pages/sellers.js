import { supabase } from '../lib/supabaseClient';
import React, { useState } from "react";
import SellerListingPreview from '../components/SellerListingPreview';
import AIDescriptionWizard from '../components/AIDescriptionWizard';

export default function SellerOnboarding() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    industry: "",
    location: "",
    annualRevenue: "",
    annualProfit: "",
    askingPrice: "",
    includesInventory: "No",
    includesBuilding: "No",
    financingType: "buyer-financed",
    images: [],
    businessDescription: "",
    aiGeneratedDescription: "",
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [invalidFiles, setInvalidFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024;
    const validFiles = files.filter(file => file.size <= maxSize);
    const invalid = files.filter(file => file.size > maxSize);

    if (invalid.length > 0) {
      setErrorMessage(`Some files exceed the 5MB size limit and will not be uploaded.`);
      setInvalidFiles(invalid.map(file => file.name));
    } else {
      setErrorMessage("");
      setInvalidFiles([]);
    }

    if (validFiles.length + formData.images.length <= 8) {
      const previews = validFiles.map((file) => URL.createObjectURL(file));
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...validFiles],
      }));
      setImagePreviews((prev) => [...prev, ...previews]);
    } else {
      alert('You can only upload up to 8 images.');
    }
  };

  const removeImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updatedImages });
    setImagePreviews(updatedPreviews);
    setErrorMessage("");
  };

  const uploadImages = async (files) => {
    const uploadedUrls = [];
    const errors = [];
    setUploadStatus("Uploading images, please keep browser open...");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `business-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('new-business-photos')
        .upload(fileName, file);

      if (uploadError) {
        console.error('❌ Error uploading image:', uploadError.message);
        errors.push(uploadError.message);
        continue;
      }

      const { data, error: urlError } = supabase.storage
        .from('new-business-photos')
        .getPublicUrl(fileName);

      if (urlError) {
        console.error('❌ Error getting public URL:', urlError.message);
        errors.push(urlError.message);
        continue;
      }

      uploadedUrls.push(data.publicUrl);
    }

    setUploadStatus("");

    if (errors.length > 0) {
      alert(`Some images failed to upload: ${errors.join(', ')}`);
    }

    return uploadedUrls;
  };

  const handleFinalSubmit = async (finalFormData) => {
    try {
      const uploadedUrls = await uploadImages(finalFormData.images);
      const {
        name, email, businessName, industry, location,
        annualRevenue, annualProfit, askingPrice,
        includesInventory, includesBuilding, financingType,
        businessDescription, aiGeneratedDescription
      } = finalFormData;

      const payload = {
        name,
        email,
        business_name: businessName,
        industry,
        location,
        annual_revenue: parseFloat(annualRevenue),
        annual_profit: parseFloat(annualProfit),
        asking_price: parseFloat(askingPrice),
        includes_inventory: includesInventory,
        includes_building: includesBuilding,
        financing_type: financingType,
        images: uploadedUrls,
        business_description: businessDescription,
        original_description: businessDescription,
        ai_description: aiGeneratedDescription,
      };

      const { error } = await supabase.from('sellers').insert([payload]);

      if (error) {
        console.error("❌ Supabase insert error:", error.message, error.details, error.hint);
        alert("There was a problem submitting your form. Check console for details.");
      } else {
        alert("✅ Your listing was submitted successfully!");
        setFormData({
          name: "",
          email: "",
          businessName: "",
          industry: "",
          location: "",
          annualRevenue: "",
          annualProfit: "",
          askingPrice: "",
          includesInventory: "No",
          includesBuilding: "No",
          financingType: "buyer-financed",
          images: [],
          businessDescription: "",
          aiGeneratedDescription: "",
        });
        setImagePreviews([]);
        setErrorMessage("");
        setShowForm(true);
        setShowAI(false);
        setShowPreview(false);
      }
    } catch (e) {
      console.error("🔥 Unexpected error in handleFinalSubmit:", e);
      alert("Unexpected error occurred. See console.");
    }
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>
        {uploadStatus && <div className="text-center text-blue-600 font-semibold mb-4">{uploadStatus}</div>}

        {showForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const requiredFields = ['name', 'email', 'businessName', 'industry', 'location', 'annualRevenue', 'annualProfit', 'askingPrice'];
              const missing = requiredFields.filter((f) => !formData[f]);
              if (missing.length > 0) {
                alert("Please fill out: " + missing.join(', '));
                return;
              }
              setShowForm(false);
              setShowAI(true);
            }}
            className="space-y-4"
          >
            <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="email" placeholder="Email" type="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="annualRevenue" placeholder="Annual Revenue" value={formData.annualRevenue} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="annualProfit" placeholder="Annual Profit" value={formData.annualProfit} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="askingPrice" placeholder="Asking Price" value={formData.askingPrice} onChange={handleChange} className="w-full p-2 border rounded" />

            <select name="includesInventory" value={formData.includesInventory} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="No">Includes Inventory?</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            <select name="includesBuilding" value={formData.includesBuilding} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="No">Includes Building?</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="buyer-financed">Buyer Financed</option>
              <option value="seller-financing">Seller Financing</option>
              <option value="rent-to-own">Rent to Own</option>
            </select>

            <textarea
              name="businessDescription"
              placeholder="Example: Wine store on Main St. operating for 30+ years, employs 2 people and serves local townspeople."
              value={formData.businessDescription}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={5}
            />

            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="w-full" />

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} className="rounded w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-white text-red-600 px-2 py-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold">
              Next: Improve with AI
            </button>
          </form>
        )}

        {showAI && (
          <AIDescriptionWizard
            uploadedImages={imagePreviews}
            onBack={() => { setShowAI(false); setShowForm(true); }}
            onComplete={(desc) => {
              setFormData((prev) => ({ ...prev, aiGeneratedDescription: desc }));
              setShowAI(false);
              setShowPreview(true);
            }}
          />
        )}

        {showPreview && (
          <SellerListingPreview
            formData={formData}
            imagePreviews={imagePreviews}
            onBack={() => { setShowPreview(false); setShowAI(true); }}
            onSubmit={handleFinalSubmit}
          />
        )}
      </div>
    </main>
  );
}
