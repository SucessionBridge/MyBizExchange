// pages/sellers.js

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
  const [uploadStatus, setUploadStatus] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [descriptionMode, setDescriptionMode] = useState("ai");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...validFiles] }));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files) => {
    const uploadedUrls = [];
    setUploadStatus("Uploading images...");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `business-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('new-business-photos').upload(fileName, file);

      if (uploadError) continue;

      const { data, error: urlError } = supabase.storage.from('new-business-photos').getPublicUrl(fileName);
      if (!urlError) uploadedUrls.push(data.publicUrl);
    }

    setUploadStatus("");
    return uploadedUrls;
  };

  const handleFinalSubmit = async (finalFormData) => {
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
    if (!error) {
      alert("✅ Listing submitted successfully!");
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
      setShowForm(true);
      setShowAI(false);
      setShowPreview(false);
    } else {
      alert("There was an error submitting your listing.");
    }
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>

        {uploadStatus && <p className="text-blue-500 text-center mb-4">{uploadStatus}</p>}

        {showForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const required = ['name', 'email', 'businessName', 'industry', 'location', 'annualRevenue', 'annualProfit', 'askingPrice'];
              const missing = required.filter(key => !formData[key]);
              if (missing.length > 0) return alert("Missing: " + missing.join(", "));

              if (descriptionMode === 'manual' && !formData.businessDescription) {
                return alert("Please write your business description.");
              }

              setShowForm(false);
              descriptionMode === 'ai' ? setShowAI(true) : setShowPreview(true);
            }}
            className="space-y-4"
          >
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" className="w-full border p-2 rounded" />
            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full border p-2 rounded" />
            <input name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Business Name" className="w-full border p-2 rounded" />
            <input name="industry" value={formData.industry} onChange={handleChange} placeholder="Industry" className="w-full border p-2 rounded" />
            <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" className="w-full border p-2 rounded" />
            <input name="annualRevenue" value={formData.annualRevenue} onChange={handleChange} placeholder="Annual Revenue" className="w-full border p-2 rounded" />
            <input name="annualProfit" value={formData.annualProfit} onChange={handleChange} placeholder="Annual Profit" className="w-full border p-2 rounded" />
            <input name="askingPrice" value={formData.askingPrice} onChange={handleChange} placeholder="Asking Price" className="w-full border p-2 rounded" />

            <select name="includesInventory" value={formData.includesInventory} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="No">Includes Inventory?</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>

            <select name="includesBuilding" value={formData.includesBuilding} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="No">Includes Building?</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>

            <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="buyer-financed">Buyer Financed</option>
              <option value="seller-financing">Seller Financing</option>
              <option value="rent-to-own">Rent to Own</option>
            </select>

            <label className="block font-medium">Business Description</label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setDescriptionMode("ai")} className={`px-4 py-2 rounded ${descriptionMode === "ai" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Use AI</button>
              <button type="button" onClick={() => setDescriptionMode("manual")} className={`px-4 py-2 rounded ${descriptionMode === "manual" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Write My Own</button>
            </div>
            {descriptionMode === 'manual' && (
              <textarea name="businessDescription" value={formData.businessDescription} onChange={handleChange} placeholder="Describe your business..." className="w-full border p-2 rounded" rows={4} />
            )}

            {/* Updated Photo Upload Section */}
            <div className="space-y-1">
              <label className="block font-medium text-gray-700">
                Upload Photos of Your Business
              </label>
              <p className="text-sm text-gray-500 mb-1">
                Add clear photos of your storefront, equipment, team, or anything that helps buyers visualize the opportunity. (Up to 8 images, max 5MB each)
              </p>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="w-full border p-2 rounded" />
            </div>

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

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold">Next Step</button>
          </form>
        )}

        {showAI && formData.name && (
          <AIDescriptionWizard
            uploadedImages={imagePreviews}
            sellerInfo={formData}
            onComplete={(desc) => {
              setFormData((prev) => ({ ...prev, aiGeneratedDescription: desc }));
              setTimeout(() => {
                setShowAI(false);
                setShowPreview(true);
              }, 100);
            }}
          />
        )}

        {showPreview && (
          <SellerListingPreview
            formData={formData}
            imagePreviews={imagePreviews}
            onBack={() => {
              descriptionMode === "manual" ? setShowForm(true) : setShowAI(true);
              setShowPreview(false);
            }}
            onSubmit={handleFinalSubmit}
          />
        )}
      </div>
    </main>
  );
}


