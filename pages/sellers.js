import { supabase } from '../lib/supabaseClient'
import React, { useState } from "react";

export default function SellerOnboarding() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    industry: "",
    location: "",
    financingType: "rent-to-own",
    images: [],  // Add this field to hold the image URLs
  });

  const [imagePreviews, setImagePreviews] = useState([]);

  // Handle changes to form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image selection
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + formData.images.length <= 8) {
      const previews = files.map((file) => URL.createObjectURL(file));

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...files],
      }));

      setImagePreviews((prev) => [...prev, ...previews]);
    } else {
      alert('You can only upload up to 8 images.');
    }
  };

  // Remove image from selection
  const removeImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);

    setFormData({ ...formData, images: updatedImages });
    setImagePreviews(updatedPreviews);
  };

  // Upload images to Supabase and return their URLs
  const uploadImages = async (files) => {
    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `business-${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from('business-photos')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error.message);
        return;
      }

      const url = supabase.storage.from('business-photos').getPublicUrl(fileName).publicURL;
      uploadedUrls.push(url);
    }

    return uploadedUrls;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Upload images and get URLs
    const uploadedUrls = await uploadImages(formData.images);

    // Submit form data including image URLs
    const { name, email, businessName, industry, location, financingType } = formData;

    const { data, error } = await supabase.from('sellers').insert([
      {
        name,
        email,
        business_name: businessName,
        industry,
        location,
        financing_type: financingType,
        images: uploadedUrls,  // Save image URLs in the database
      },
    ]);

    if (error) {
      console.error("❌ Error submitting form:", error);
      alert("There was a problem submitting your form.");
    } else {
      console.log("✅ Submitted:", data);
      alert("Your listing was submitted successfully!");

      // Reset form data
      setFormData({
        name: "",
        email: "",
        businessName: "",
        industry: "",
        location: "",
        financingType: "rent-to-own",
        images: [],  // Clear images
      });
      setImagePreviews([]);  // Clear previews
    }
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          
          <div>
            <label className="block text-sm font-medium mb-2">Preferred Financing Option:</label>
            <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl">
              <option value="rent-to-own">Rent-to-Own</option>
              <option value="seller-financing">Seller Financing</option>
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
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold">Submit Listing</button>
        </form>
      </div>
    </main>
  );
}

