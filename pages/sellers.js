import { supabase } from '../lib/supabaseClient'
import React, { useState } from "react";

export default function SellerOnboarding() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    industry: "",
    location: "",
    financingType: "seller-financing",
    askingPrice: "",
    includesInventory: "",
    includesBuilding: "",
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
      const { error } = await supabase.storage.from('new-business-photos').upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error.message);
        errors.push(error.message);
        continue;
      }

      const url = supabase.storage.from('new-business-photos').getPublicUrl(fileName).publicURL;
      uploadedUrls.push(url);
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
    const { name, email, businessName, industry, location, financingType, askingPrice, includesInventory, includesBuilding, businessDescription } = formData;

    const { error } = await supabase.from('sellers').insert([
      {
        name,
        email,
        business_name: businessName,
        industry,
        location,
        financing_type: financingType,
        asking_price: parseFloat(askingPrice),
        includes_inventory: includesInventory,
        includes_building: includesBuilding,
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
        financingType: "seller-financing",
        askingPrice: "",
        includesInventory: "",
        includesBuilding: "",
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
          <input name="askingPrice" type="number" placeholder="Asking Price" value={formData.askingPrice} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />

          <div>
            <label className="block text-sm font-medium mb-2">Does the asking price include inventory?</label>
            <select name="includesInventory" value={formData.includesInventory} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Does the asking price include a building?</label>
            <select name="includesBuilding" value={formData.includesBuilding} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <textarea name="businessDescription" placeholder="Brief description of the business" value={formData.businessDescription} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" rows="4" required />

          <div>
            <label className="block text-sm font-medium mb-2">Preferred Financing Option:</label>
            <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl">
              <option value="seller-financing">Seller Financing</option>
              <option value="rent-to-own">Rent-to-Own</option>
              <option value="third-party">3rd-Party Financing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload up to 8 photos:</label>
            <input type="file" name="images" accept="image/*" multiple onChange={handleImageUpload} className="w-full border border-gray-300 p-3 rounded-xl" />
            <div className="mt-4 flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt={`Preview ${index}`} className="h-20 w-20 object-cover rounded-md" />
                  <button onClick={() => removeImage(index)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full">X</button>
                  {invalidFiles.includes(formData.images[index].name) && (
                    <span className="absolute top-0 left-0 bg-red-500 text-white text-xs p-1">Invalid</span>
                  )}
                </div>
              ))}
            </div>
            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold">Submit Listing</button>
        </form>
      </div>
    </main>
  );
}





