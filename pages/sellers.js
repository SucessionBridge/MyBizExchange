import { supabase } from '../lib/supabaseClient';
import React, { useState } from "react";

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
    includesInventory: "",
    includesBuilding: "",
    financingType: "seller-financing",
    images: [],
    businessDescription: "",
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [invalidFiles, setInvalidFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");

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
        console.error('Error uploading image:', uploadError.message);
        errors.push(uploadError.message);
        continue;
      }

      const { data, error: urlError } = await supabase.storage
        .from('new-business-photos')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7-day URL

      if (urlError) {
        console.error('Error creating signed URL:', urlError.message);
        errors.push(urlError.message);
        continue;
      }

      uploadedUrls.push(data.signedUrl);
    }

    setUploadStatus("");

    if (errors.length > 0) {
      alert(`Some images failed to upload: ${errors.join(', ')}`);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uploadedUrls = await uploadImages(formData.images);
    const {
      name, email, businessName, industry, location,
      annualRevenue, annualProfit, askingPrice,
      includesInventory, includesBuilding, financingType,
      businessDescription
    } = formData;

    const { error } = await supabase.from('sellers').insert([
      {
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
      },
    ]);

    if (error) {
      console.error("❌ Error submitting form:", error);
      alert("There was a problem submitting your form.");
    } else {
      alert("Your listing was submitted successfully!");
      setFormData({
        name: "",
        email: "",
        businessName: "",
        industry: "",
        location: "",
        annualRevenue: "",
        annualProfit: "",
        askingPrice: "",
        includesInventory: "",
        includesBuilding: "",
        financingType: "seller-financing",
        images: [],
        businessDescription: "",
      });
      setImagePreviews([]);
      setErrorMessage("");
    }
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>
        {uploadStatus && (
          <div className="text-center text-blue-600 font-semibold mb-4">{uploadStatus}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="annualRevenue" type="number" placeholder="Annual Revenue (e.g., 200000)" value={formData.annualRevenue} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="annualProfit" type="number" placeholder="Annual Profit / SDE (e.g., 75000)" value={formData.annualProfit} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="askingPrice" type="number" placeholder="Asking Price (e.g., 150000)" value={formData.askingPrice} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />

          <div>
            <label className="block text-sm font-medium mb-2">Does the price include inventory?</label>
            <select name="includesInventory" value={formData.includesInventory} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl">
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Does the price include a building?</label>
            <select name="includesBuilding" value={formData.includesBuilding} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl">
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preferred Financing Option:</label>
            <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl">
              <option value="seller-financing">Seller Financing</option>
              <option value="rent-to-own">Rent-to-Own</option>
              <option value="third-party">3rd-Party Financing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Brief Description of the Business:</label>
            <textarea
              name="businessDescription"
              value={formData.businessDescription}
              onChange={handleChange}
              rows="4"
              placeholder="What does your business do? Who are the customers?"
              className="w-full border border-gray-300 p-3 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload up to 8 photos:</label>
            <input type="file" name="images" accept="image/*" multiple onChange={handleImageUpload} className="w-full border border-gray-300 p-3 rounded-xl" />
            <div className="mt-4 flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt={`Preview ${index}`} className="h-20 w-20 object-cover rounded-md" />
                  <button onClick={() => removeImage(index)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full">X</button>
                  {invalidFiles.includes(formData.images[index]?.name) && (
                    <span className="absolute top-0 left-0 bg-red-500 text-white text-xs p-1">Invalid</span>
                  )}
                </div>
              ))}
            </div>
            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
          </div>

          {uploadStatus && (
            <div className="text-center text-blue-600 font-semibold mt-4">{uploadStatus}</div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold">Submit Listing</button>
        </form>
      </div>
    </main>
  );
}
