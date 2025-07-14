import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
export default function SellerWizard() {
  
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  // ✅ New submission state hooks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');


  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    hideBusinessName: false,
    industry: '',
    location: '',
    website: '',
    annualRevenue: '',
    sde: '',
    askingPrice: '',
    employees: '',
    monthly_lease: '',
    inventory_value: '',
    equipment_value: '',
    includesInventory: false,
    includesBuilding: false,
    real_estate_included: false,
    relocatable: false,
    home_based: false,
    financingType: 'buyer-financed',
    businessDescription: '',
    aiDescription: '',
    descriptionChoice: 'manual',
    customerType: '',
    ownerInvolvement: '',
    growthPotential: '',
    reasonForSelling: '',
    trainingOffered: '',
    sentenceSummary: '',
    customers: '',
    bestSellers: '',
    customerLove: '',
    repeatCustomers: '',
    keepsThemComing: '',
    proudOf: '',
    adviceToBuyer: '',
    annualProfit: '',
    images: []
  });

  useEffect(() => {
    if (previewMode && !formData.aiDescription) {
      const fetchDescription = async () => {
        try {
          const res = await fetch('/api/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sentenceSummary: formData.sentenceSummary,
              customers: formData.customers,
              opportunity: formData.growthPotential,
              uniqueEdge: formData.customerLove || formData.proudOf,
              industry: formData.industry,
              location: formData.location
            })
          });

          if (!res.ok) {
            const err = await res.json();
            console.error('AI description error:', err.message);
            return;
          }

          const data = await res.json();
          setFormData(prev => ({ ...prev, aiDescription: data.description }));
        } catch (err) {
          console.error('AI fetch failed:', err);
        }
      };
      fetchDescription();
    }
  }, [previewMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    setImagePreviews(prev => [...prev, ...previews]);
  };
import { supabase } from '../lib/supabaseClient'; // Make sure this is at the top of your file

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitSuccess(false);
  setSubmitError('');

  try {
    const uploadedImageUrls = [];

    // Upload images to Supabase Storage
    for (const file of formData.images) {
      const filePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('seller-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Image upload failed:', uploadError.message);
        setSubmitError('Image upload failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const { publicUrl } = supabase.storage
        .from('seller-images')
        .getPublicUrl(filePath).data;

      uploadedImageUrls.push(publicUrl);
    }

    // Prepare the form data to send to API
    const form = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'images') {
        form.append(key, value);
      }
    });

    form.append('image_urls', JSON.stringify(uploadedImageUrls));

    const res = await fetch('/api/submit-seller-listing', {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Server error');
    }

    setSubmitSuccess(true);
    setIsSubmitting(false);
    setPreviewMode(false);
    router.push('/thank-you'); // optional: redirect to thank you page

  } catch (err) {
    console.error('❌ Submission error:', err);
    setSubmitError(err.message || 'Submission failed');
    setIsSubmitting(false);
  }
};


 
  const formatCurrency = (val) => val ? `$${parseFloat(val).toLocaleString()}` : '';

  const renderBackButton = () => (
    <button onClick={() => setStep(s => Math.max(1, s - 1))} className="text-sm text-blue-600 underline mt-2">Back</button>
  );

  const renderImages = () => (
    <div className="space-y-2">
      <label className="text-sm font-medium">Upload Photos:</label>
      <input type="file" multiple onChange={handleImageUpload} accept="image/*" />
    </div>
  );
 const renderPreview = () => {
  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const getListingTitle = () => {
    if (formData.industry) {
      return `${toTitleCase(formData.industry)} Business for Sale`;
    } else if (formData.hideBusinessName) {
      return 'Confidential Business Listing';
    } else {
      return formData.businessName;
    }
  };

  return (
    <div className="bg-white rounded shadow p-6 space-y-8 font-serif text-gray-900">
      <h2 className="text-4xl font-bold tracking-tight mb-1">{getListingTitle()}</h2>
      <p className="text-md text-gray-600">{formData.location}</p>

      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {imagePreviews.map((src, idx) => (
            <img
              key={idx}
              src={src}
              className="w-full h-64 object-cover rounded shadow-sm border"
            />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-10 text-base mt-6">
        <div>
          <h3 className="text-xl font-semibold border-b pb-2 mb-3">Financial Overview</h3>
          <p><strong>Asking Price:</strong> {formatCurrency(formData.askingPrice)}</p>
          <p><strong>Annual Revenue:</strong> {formatCurrency(formData.annualRevenue)}</p>
          <p><strong>SDE:</strong> {formatCurrency(formData.sde)}</p>
          <p><strong>Annual Profit:</strong> {formatCurrency(formData.annualProfit)}</p>
          <p><strong>Inventory Value:</strong> {formatCurrency(formData.inventory_value)}</p>
          <p><strong>Equipment Value:</strong> {formatCurrency(formData.equipment_value)}</p>
          <p><strong>Includes Inventory:</strong> {formData.includesInventory ? 'Yes' : 'No'}</p>
          <p><strong>Includes Building:</strong> {formData.includesBuilding ? 'Yes' : 'No'}</p>
          <p><strong>Real Estate Included:</strong> {formData.real_estate_included ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold border-b pb-2 mb-3">Business Details</h3>
          <p><strong>Employees:</strong> {formData.employees}</p>
          <p><strong>Monthly Lease:</strong> {formatCurrency(formData.monthly_lease)}</p>
          <p><strong>Home-Based:</strong> {formData.home_based ? 'Yes' : 'No'}</p>
          <p><strong>Relocatable:</strong> {formData.relocatable ? 'Yes' : 'No'}</p>
          <p><strong>Financing Type:</strong> {formData.financingType.replace('-', ' ')}</p>
          <p><strong>Customer Type:</strong> {formData.customerType}</p>
          <p><strong>Owner Involvement:</strong> {formData.ownerInvolvement}</p>
          <p><strong>Reason for Selling:</strong> {formData.reasonForSelling}</p>
          <p><strong>Training Offered:</strong> {formData.trainingOffered}</p>
        </div>
      </div>

      {(formData.aiDescription || formData.businessDescription) && (
        <div>
          <h3 className="text-xl font-semibold border-b pb-2 mb-3">Business Description</h3>
          <div className="mb-4">
            <label className="block font-medium mb-1">Choose which description to publish:</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="descriptionChoice"
                  value="manual"
                  checked={formData.descriptionChoice === 'manual'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Written by Seller
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="descriptionChoice"
                  value="ai"
                  checked={formData.descriptionChoice === 'ai'}
                  onChange={handleChange}
                  className="mr-2"
                />
                AI-Enhanced Version
              </label>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-1">Written by Seller:</h4>
              <p className="text-gray-800 whitespace-pre-wrap border p-3 rounded bg-gray-50">
                {formData.businessDescription || 'No description provided.'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">AI-Enhanced Version:</h4>
              <p className="text-gray-800 whitespace-pre-wrap border p-3 rounded bg-gray-50">
                {formData.aiDescription || 'AI description not yet generated.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-10 text-base">
        <div>
          <h3 className="text-xl font-semibold border-b pb-2 mb-3">Customer Insights</h3>
          <p><strong>Who are your customers?</strong> {formData.customers}</p>
          <p><strong>Best Sellers:</strong> {formData.bestSellers}</p>
          <p><strong>What do customers love?</strong> {formData.customerLove}</p>
          <p><strong>Repeat Customers:</strong> {formData.repeatCustomers}</p>
          <p><strong>Why do they return?</strong> {formData.keepsThemComing}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold border-b pb-2 mb-3">Owner Reflections</h3>
          <p><strong>What are you proud of?</strong> {formData.proudOf}</p>
          <p><strong>Advice to Buyer:</strong> {formData.adviceToBuyer}</p>
          <p><strong>Growth Potential:</strong> {formData.growthPotential}</p>
          <p><strong>One-Line Summary:</strong> {formData.sentenceSummary}</p>
        </div>
      </div>
<div className="mt-8 space-y-4">
  <div className="flex gap-4">
    <button
      onClick={() => setPreviewMode(false)}
      className="bg-gray-300 hover:bg-gray-400 text-black px-5 py-2 rounded"
    >
      Edit
    </button>
    <button
      onClick={handleSubmit}
      disabled={isSubmitting}
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
    >
      {isSubmitting ? 'Submitting...' : 'Submit Listing'}
    </button>
  </div>

  {isSubmitting && (
    <p className="text-sm text-gray-600">⏳ Please wait while we submit your listing...</p>
  )}
  {submitSuccess && (
    <p className="text-sm text-green-600">✅ Your listing has been submitted successfully!</p>
  )}
  {submitError && (
    <p className="text-sm text-red-600">❌ {submitError}</p>
  )}
</div>

     
    </div>
  );
};

  return (
    <main className="bg-white min-h-screen p-6 font-sans">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">{previewMode ? 'Listing Preview' : 'Seller Onboarding'}</h1>
        {previewMode ? renderPreview() : (
          step === 1 ? (
            <div className="space-y-4">
              <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full border p-3 rounded" />
              <label className="flex items-center"><input name="hideBusinessName" type="checkbox" checked={formData.hideBusinessName} onChange={handleChange} className="mr-2" />Hide Business Name</label>
              <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-3 rounded">Next</button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="website" placeholder="Website" value={formData.website} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="annualRevenue" placeholder="Annual Revenue" value={formData.annualRevenue} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="annualProfit" placeholder="Annual Profit" value={formData.annualProfit} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="sde" placeholder="SDE" value={formData.sde} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="askingPrice" placeholder="Asking Price" value={formData.askingPrice} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="employees" placeholder="Number of Employees" value={formData.employees} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="monthly_lease" placeholder="Monthly Lease Amount" value={formData.monthly_lease} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="inventory_value" placeholder="Inventory Value" value={formData.inventory_value} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="equipment_value" placeholder="Equipment Value" value={formData.equipment_value} onChange={handleChange} className="w-full border p-3 rounded" />
              <label className="flex items-center"><input name="includesInventory" type="checkbox" checked={formData.includesInventory} onChange={handleChange} className="mr-2" />Includes Inventory</label>
              <label className="flex items-center"><input name="includesBuilding" type="checkbox" checked={formData.includesBuilding} onChange={handleChange} className="mr-2" />Includes Building</label>
              <label className="flex items-center"><input name="real_estate_included" type="checkbox" checked={formData.real_estate_included} onChange={handleChange} className="mr-2" />Real Estate Included</label>
              <label className="flex items-center"><input name="relocatable" type="checkbox" checked={formData.relocatable} onChange={handleChange} className="mr-2" />Relocatable</label>
              <label className="flex items-center"><input name="home_based" type="checkbox" checked={formData.home_based} onChange={handleChange} className="mr-2" />Home-Based</label>
              <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full border p-3 rounded">
                <option value="buyer-financed">Buyer Financed</option>
                <option value="seller-financed">Seller Financed</option>
                <option value="rent-to-own">Rent to Own</option>
              </select>
              {renderImages()}
              <button onClick={() => setStep(3)} className="w-full bg-blue-600 text-white py-3 rounded">Next</button>
              {renderBackButton()}
            </div>
          ) : (
            <div className="space-y-4">
              <textarea name="businessDescription" placeholder="Brief business description" value={formData.businessDescription} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="customerType" placeholder="Customer Type" value={formData.customerType} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="ownerInvolvement" placeholder="Owner Involvement" value={formData.ownerInvolvement} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="growthPotential" placeholder="Growth Potential" value={formData.growthPotential} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="reasonForSelling" placeholder="Reason for Selling" value={formData.reasonForSelling} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="trainingOffered" placeholder="Training Offered" value={formData.trainingOffered} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="sentenceSummary" placeholder="1-sentence summary of business" value={formData.sentenceSummary} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="customers" placeholder="Who are your customers?" value={formData.customers} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="bestSellers" placeholder="What are your best-selling products/services?" value={formData.bestSellers} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="customerLove" placeholder="What do customers love most?" value={formData.customerLove} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="repeatCustomers" placeholder="How many are repeat buyers?" value={formData.repeatCustomers} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="keepsThemComing" placeholder="Why do they return?" value={formData.keepsThemComing} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="proudOf" placeholder="Something you're proud of?" value={formData.proudOf} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="adviceToBuyer" placeholder="Advice for future owner?" value={formData.adviceToBuyer} onChange={handleChange} className="w-full border p-3 rounded" />
              <button onClick={() => setPreviewMode(true)} className="w-full bg-yellow-500 text-white py-3 rounded">Preview My Listing</button>
              {renderBackButton()}
            </div>
          )
        )}
      </div>
    </main>
  );
}
