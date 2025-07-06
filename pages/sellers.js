// pages/sellers.js
import { supabase } from '../lib/supabaseClient';
import React, { useState } from "react";
import SellerListingPreview from '../components/SellerListingPreview';

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
    includesInventory: "no",
    includesBuilding: "no",
    financingType: "buyer-financed",
    images: [],
    businessDescription: "",
    aiGeneratedDescription: ""
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024;
    const validFiles = files.filter(file => file.size <= maxSize);

    if (validFiles.length + formData.images.length > 8) {
      alert('You can only upload up to 8 images.');
      return;
    }

    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updatedImages });
    setImagePreviews(updatedPreviews);
  };

  const uploadImages = async (files) => {
    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `business-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('new-business-photos').upload(fileName, file);
      if (uploadError) continue;
      const { data } = supabase.storage.from('new-business-photos').getPublicUrl(fileName);
      uploadedUrls.push(data.publicUrl);
    }
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
      original_description: formData.businessDescription,
      ai_description: formData.aiGeneratedDescription
    };

    const { error } = await supabase.from('sellers').insert([payload]);
    if (error) {
      alert("Submission error. Check console.");
      console.error(error);
    } else {
      alert("✅ Listing submitted!");
      setFormData({
        name: "",
        email: "",
        businessName: "",
        industry: "",
        location: "",
        annualRevenue: "",
        annualProfit: "",
        askingPrice: "",
        includesInventory: "no",
        includesBuilding: "no",
        financingType: "buyer-financed",
        images: [],
        businessDescription: "",
        aiGeneratedDescription: ""
      });
      setImagePreviews([]);
      setShowPreview(false);
    }
  };

  const example = "Example: Wine store for sale on Main Street. Operating for over 30 years, serving loyal locals. Employs 2 staff.";

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>
        {uploadStatus && <div className="text-center text-blue-600 mb-4">{uploadStatus}</div>}

        {!showPreview ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowPreview(true);
            }}
            className="space-y-4"
          >
            <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="annualRevenue" placeholder="Annual Revenue" value={formData.annualRevenue} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="annualProfit" placeholder="Annual Profit" value={formData.annualProfit} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="askingPrice" placeholder="Asking Price" value={formData.askingPrice} onChange={handleChange} className="w-full p-2 border rounded" />

            <select name="includesInventory" value={formData.includesInventory} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="no">Includes Inventory?</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>

            <select name="includesBuilding" value={formData.includesBuilding} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="no">Includes Building?</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>

            <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="buyer-financed">Buyer Financed</option>
              <option value="seller-financing">Seller Financing</option>
              <option value="rent-to-own">Rent to Own</option>
            </select>

            <textarea
              name="businessDescription"
              placeholder={example}
              value={formData.businessDescription}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={4}
            />

            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="w-full" />

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl">Preview Listing</button>
          </form>
        ) : (
          <SellerListingPreview
            formData={formData}
            imagePreviews={imagePreviews}
            onBack={() => setShowPreview(false)}
            onSubmit={handleFinalSubmit}
          />
        )}
      </div>
    </main>
  );
}

