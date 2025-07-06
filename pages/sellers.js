
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [invalidFiles, setInvalidFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
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
        console.error('Error uploading image:', uploadError.message);
        errors.push(uploadError.message);
        continue;
      }

      const { data, error: urlError } = supabase.storage
        .from('new-business-photos')
        .getPublicUrl(fileName);

      if (urlError) {
        console.error('Error getting public URL:', urlError.message);
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

  const handleFinalSubmit = async () => {
    const uploadedUrls = await uploadImages(formData.images);
    const {
      name, email, businessName, industry, location,
      annualRevenue, annualProfit, askingPrice,
      includesInventory, includesBuilding, financingType,
      businessDescription
    } = formData;

    const { error } = await supabase.from('sellers').insert([{
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
    }]);

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
      setShowPreview(false);
    }
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>
        {uploadStatus && <div className="text-center text-blue-600 font-semibold mb-4">{uploadStatus}</div>}

        {!showPreview ? (
          <form onSubmit={(e) => { e.preventDefault(); setShowPreview(true); }} className="space-y-6">
            {/* all your existing inputs here, unchanged */}
            {/* ... keep your full form exactly as you had it */}

            {/* Only show a preview button now */}
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold">Preview Listing</button>
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
