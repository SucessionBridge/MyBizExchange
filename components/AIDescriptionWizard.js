// pages/sellers.js
import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import AIDescriptionWizard from "../components/AIDescriptionWizard";
import SellerListingPreview from "../components/SellerListingPreview";

export default function SellersPage() {
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    location: "",
    annualRevenue: "",
    annualProfit: "",
    description: "",
    images: [],
    aiGeneratedDescription: ""
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [showAI, setShowAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];

    for (let file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload failed:", uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      urls.push(data.publicUrl);
    }

    setFormData((prev) => ({ ...prev, images: urls }));
    setImagePreviews(urls);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("sellers").insert([
      {
        ...formData,
        description: formData.aiGeneratedDescription || formData.description,
      },
    ]);

    if (error) {
      alert("Failed to submit: " + error.message);
    } else {
      alert("Listing submitted!");
      setFormData({
        businessName: "",
        industry: "",
        location: "",
        annualRevenue: "",
        annualProfit: "",
        description: "",
        images: [],
        aiGeneratedDescription: ""
      });
      setImagePreviews([]);
      setShowAI(false);
      setShowPreview(false);
    }

    setSubmitting(false);
  };

  if (showAI) {
    return (
      <AIDescriptionWizard
        uploadedImages={imagePreviews}
        sellerInfo={formData}
        onBack={() => {
          setShowAI(false);
        }}
        onComplete={(aiDesc) => {
          setFormData((prev) => ({ ...prev, aiGeneratedDescription: aiDesc }));
          setTimeout(() => {
            setShowAI(false);
            setShowPreview(true);
          }, 100);
        }}
      />
    );
  }

  if (showPreview) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <SellerListingPreview
          business={formData}
          images={imagePreviews}
          aiDescription={formData.aiGeneratedDescription}
        />
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setShowAI(true)}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {submitting ? "Submitting..." : "Submit Listing"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Create a Seller Listing</h1>

      <input
        className="w-full mb-4 border p-3 rounded"
        placeholder="Business Name"
        value={formData.businessName}
        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
      />
      <input
        className="w-full mb-4 border p-3 rounded"
        placeholder="Industry"
        value={formData.industry}
        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
      />
      <input
        className="w-full mb-4 border p-3 rounded"
        placeholder="Location"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
      />
      <input
        className="w-full mb-4 border p-3 rounded"
        placeholder="Annual Revenue"
        value={formData.annualRevenue}
        onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
      />
      <input
        className="w-full mb-4 border p-3 rounded"
        placeholder="Annual Profit"
        value={formData.annualProfit}
        onChange={(e) => setFormData({ ...formData, annualProfit: e.target.value })}
      />

      <textarea
        className="w-full mb-4 border p-3 rounded"
        rows={4}
        placeholder="Short Description (or use AI instead)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <label className="block mb-2 font-medium">Upload Images</label>
      <input type="file" multiple onChange={handleImageUpload} className="mb-4" />

      <div className="flex justify-between">
        <button
          onClick={() => setShowAI(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Use AI to Write Description
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Preview Listing
        </button>
      </div>
    </div>
  );
}


