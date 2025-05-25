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
    images: [],  // To store valid image files
  });

  const [imagePreviews, setImagePreviews] = useState([]);  // For storing preview images
  const [errorMessage, setErrorMessage] = useState("");  // To display validation errors
  const [invalidFiles, setInvalidFiles] = useState([]);  // To store invalid files based on size

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
    const maxSize = 5 * 1024 * 1024; // 5MB limit

    const validFiles = files.filter(file => file.size <= maxSize);
    const invalidFiles = files.filter(file => file.size > maxSize);

    // Handle invalid files and set error message
    if (invalidFiles.length > 0) {
      setErrorMessage(`Some files exceed the 5MB size limit and will not be uploaded.`);
      setInvalidFiles(invalidFiles.map(file => file.name));  // Track invalid files by name or unique identifier
    } else {
      setErrorMessage("");  // Clear the error message if all files are valid
      setInvalidFiles([]);  // Clear invalid files
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

  // Remove image from selection
  const removeImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);

    setFormData({ ...formData, images: updatedImages });
    setImagePreviews(updatedPreviews);

    // Reset error message if removing an invalid file
    setErrorMessage("");
  };

  // Upload a single image to Supabase and return the URL
  const uploadImage = async (file) => {
    const fileName = `business-${Date.now()}-${file.name}`;

    // Upload the image to Supabase storage
    const { data, error } = await supabase.storage
      .from('business-photos')
      .upload(fileName, file);

    // If there's an error, log it
    if (error) {
      console.error('Error uploading image:', error.message);
      return null;
    }

    // Get the public URL of the uploaded image
    const url = supabase.storage.from('business-photos').getPublicUrl(fileName).publicURL;

    // Log the URL of the uploaded image
    console.log('Image uploaded:', url);

    return url;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Upload the first image (for testing)
    const uploadedUrl = await uploadImage(formData.images[0]);

    if (!uploadedUrl) {
      alert("There was a problem uploading the image.");
      return;
    }

    // Submit form data including image URL
    const { name, email, businessName, industry, location, financingType } = formData;

    const { data, error } = await supabase.from('sellers').insert([
      {
        name,
        email,
        business_name: businessName,
        industry,
        location,
        financing_type: financingType,
        images: [uploadedUrl],  // Save single image URL in the database
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
      setErrorMessage("");  // Clear any error messages
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
                  {invalidFiles.includes(formData.images[index].name) && (
                    <span className="absolute top-0 left-0 bg-red-500 text-white text-xs p-1">Invalid</span>
                  )}
                </div>
              ))}
            </div>
            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>} {/* Display error message */}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold">Submit Listing</button>
        </form>
      </div>
    </main>
  );
}



