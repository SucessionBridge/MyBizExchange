import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import supabase from '../lib/supabaseClient'; // ✅ correct
import FloatingInput from '../components/FloatingInput';
import EditDescriptionModal from '../components/EditDescriptionModal'; // ✅ NEW

export default function SellerWizard() {

  const router = useRouter();
  const [step, setStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [listingId, setListingId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [editTarget, setEditTarget] = useState(null); // ✅ NEW for modal target
  const [showModal, setShowModal] = useState(false);
const [currentEditType, setCurrentEditType] = useState('manual'); // 'manual' or 'ai'
const [tempDescription, setTempDescription] = useState('');
const [tempAIDescription, setTempAIDescription] = useState('');
 
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    hideBusinessName: false,
    industry: '',
    location: '',
    location_city: '',
    location_state: '',
    years_in_business: '',
owner_hours_per_week: '',
seller_financing_considered: '',
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
  bestSellers: formData.bestSellers,
  customerLove: formData.customerLove,
  repeatCustomers: formData.repeatCustomers,
  keepsThemComing: formData.keepsThemComing,
  ownerInvolvement: formData.ownerInvolvement,
  opportunity: formData.growthPotential,
  proudOf: formData.proudOf,
  adviceToBuyer: formData.adviceToBuyer,
  businessName: formData.businessName,
  industry: formData.industry,
  location: formData.location || `${formData.location_city}, ${formData.location_state}`,
  annualRevenue: formData.annualRevenue,
  annualProfit: formData.annualProfit,
  includesInventory: formData.includesInventory,
  includesBuilding: formData.includesBuilding
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
// ✅ Modal controls for editing descriptions
const openModal = (type) => {
  setEditTarget(type);
  if (type === 'manual') {
    setTempDescription(formData.businessDescription || '');
  } else {
    setTempAIDescription(formData.aiDescription || '');
  }
  setShowModal(true);
};

const closeModal = () => {
  setShowModal(false);
  setEditTarget(null);
};

const saveModalChanges = () => {
  if (editTarget === 'manual') {
    setFormData(prev => ({ ...prev, businessDescription: tempDescription }));
  } else if (editTarget === 'ai') {
    setFormData(prev => ({ ...prev, aiDescription: tempAIDescription }));
  }
  closeModal();
};

   const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    setImagePreviews(prev => [...prev, ...previews]);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // Upload images to Supabase Storage
    const uploadedImageUrls = [];
    for (let i = 0; i < formData.images.length; i++) {
      const image = formData.images[i];
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}_${i}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('seller-images')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('seller-images')
        .getPublicUrl(filePath);

      uploadedImageUrls.push(publicUrlData.publicUrl);
    }

    // Prepare payload matching Supabase table
    const payload = {
      business_name: formData.businessName,
      email: formData.email,
      industry: formData.industry,
      years_in_business: Number(formData.yearsInBusiness),
      location: formData.location,
      sde: Number(formData.sde),
      revenue: Number(formData.revenue),
      asking_price: Number(formData.askingPrice),
      customers: formData.customers,
      opportunity: formData.opportunity,
      reason_for_selling: formData.reasonForSelling,
      seller_financing_considered: formData.sellerFinancingConsidered || false,
      seller_financing_terms: formData.sellerFinancingTerms,
      financing_type: formData.financingType,
      down_payment_required: formData.downPaymentRequired ? Number(formData.downPaymentRequired) : null,
      interest_rate: formData.interestRate ? Number(formData.interestRate) : null,
      term_length_months: formData.termLengthMonths ? Number(formData.termLengthMonths) : null,
      home_based: formData.homeBased || false,
      relocatable: formData.relocatable || false,
      website: formData.website || '',
      image_urls: uploadedImageUrls,
      business_description: formData.businessDescription,
      ai_description: formData.aiGeneratedDescription,
      monthly_lease: formData.monthlyLease ? Number(formData.monthlyLease) : null,
    };

    const response = await fetch('/api/submit-seller-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Insert failed');

    router.push('/thank-you');
  } catch (error) {
    console.error('❌ Submission error:', error);
    alert('Submission failed. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};


  const formatCurrency = (val) => val ? `$${parseFloat(val).toLocaleString()}` : '';
  const renderBackButton = () => (
    <button onClick={() => setStep(s => Math.max(1, s - 1))} className="text-sm text-blue-600 underline mt-2">Back</button>
  );

  const renderImages = () => (
    <div className="space-y-2">
      <label className="block font-medium text-gray-700">Photos of your business (max 8)</label>
      <input type="file" multiple onChange={handleImageUpload} accept="image/*" className="w-full border rounded p-2" />
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
      <p className="text-md text-gray-600">
        {formData.location_city && formData.location_state
          ? `${formData.location_city}, ${formData.location_state}`
          : formData.location}
      </p>

      {formData.images && formData.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {formData.images.map((url, i) => (
            <div key={i} className="relative">
              <img
                src={typeof url === 'string' ? url : URL.createObjectURL(url)}
                alt={`Image ${i + 1}`}
                className="rounded-md border h-32 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  const updatedImages = formData.images.filter((img) => img !== url);
                  setFormData((prev) => ({ ...prev, images: updatedImages }));
                }}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full px-2 py-1 hover:bg-red-700"
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Financials + Business Details */}
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
          <p><strong>Years in Business:</strong> {formData.years_in_business || 'Undisclosed'}</p>
          <p><strong>Owner Hours/Week:</strong> {formData.owner_hours_per_week || 'Undisclosed'}</p>
          <p><strong>Seller Financing Considered:</strong>
            {formData.seller_financing_considered
              ? formData.seller_financing_considered.charAt(0).toUpperCase() + formData.seller_financing_considered.slice(1)
              : 'Undisclosed'}
          </p>
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

      {/* Description Section */}
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
              <h4 className="font-semibold mb-1 flex justify-between items-center">
                Written by Seller:
                <button
                  type="button"
                  onClick={() => openModal('manual')}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
                >
                  ✏️ Edit
                </button>
              </h4>
              <p className="text-gray-800 whitespace-pre-wrap border p-3 rounded bg-gray-50">
                {formData.businessDescription || 'No description provided.'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1 flex justify-between items-center">
                AI-Enhanced Version:
                <button
                  type="button"
                  onClick={() => openModal('ai')}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
                >
                  ✏️ Edit
                </button>
              </h4>
              <p className="text-gray-800 whitespace-pre-wrap border p-3 rounded bg-gray-50">
                {formData.aiDescription || 'AI description not yet generated.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

 

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
          {isSubmitting && <p className="text-sm text-gray-600">⏳ Please wait while we submit your listing...</p>}
          {submitSuccess && <p className="text-sm text-green-600">✅ Your listing has been submitted successfully!</p>}
          {submitError && <p className="text-sm text-red-600">❌ {submitError}</p>}
        </div>
         {/* ✨ Edit Description Modal */}
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
      <h3 className="text-xl font-bold mb-4">
        Edit {currentEditType === 'manual' ? 'Seller-Written' : 'AI-Enhanced'} Description
      </h3>
      <textarea
        className="w-full border p-3 rounded mb-4 min-h-[150px]"
        value={currentEditType === 'manual' ? tempDescription : tempAIDescription}
        onChange={(e) =>
          currentEditType === 'manual'
            ? setTempDescription(e.target.value)
            : setTempAIDescription(e.target.value)
        }
      />
      <div className="flex justify-end gap-3">
        <button
          onClick={closeModal}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          onClick={saveModalChanges}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}
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
              <FloatingInput
  label="Business Name"
  name="businessName"
  value={formData.businessName}
  onChange={handleChange}
/>

              <label className="flex items-center"><input name="hideBusinessName" type="checkbox" checked={formData.hideBusinessName} onChange={handleChange} className="mr-2" />Hide Business Name</label>
              <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-3 rounded">Next</button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full border p-3 rounded" />

              {/* ✅ New City + State Dropdowns */}
              <input name="location_city" placeholder="City" value={formData.location_city} onChange={handleChange} className="w-full border p-3 rounded" />
             <select
  name="location_state"
  value={formData.location_state}
  onChange={handleChange}
  className="w-full border p-3 rounded"

>
  <option value="">Select State/Province</option>

  {/* 🇨🇦 Canadian Provinces & Territories */}
  <option value="Alberta">Alberta</option>
  <option value="British Columbia">British Columbia</option>
  <option value="Manitoba">Manitoba</option>
  <option value="New Brunswick">New Brunswick</option>
  <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
  <option value="Nova Scotia">Nova Scotia</option>
  <option value="Ontario">Ontario</option>
  <option value="Prince Edward Island">Prince Edward Island</option>
  <option value="Quebec">Quebec</option>
  <option value="Saskatchewan">Saskatchewan</option>
  <option value="Northwest Territories">Northwest Territories</option>
  <option value="Nunavut">Nunavut</option>
  <option value="Yukon">Yukon</option>

  {/* 🇺🇸 US States */}
  <option value="Alabama">Alabama</option>
  <option value="Alaska">Alaska</option>
  <option value="Arizona">Arizona</option>
  <option value="Arkansas">Arkansas</option>
  <option value="California">California</option>
  <option value="Colorado">Colorado</option>
  <option value="Connecticut">Connecticut</option>
  <option value="Delaware">Delaware</option>
  <option value="Florida">Florida</option>
  <option value="Georgia">Georgia</option>
  <option value="Hawaii">Hawaii</option>
  <option value="Idaho">Idaho</option>
  <option value="Illinois">Illinois</option>
  <option value="Indiana">Indiana</option>
  <option value="Iowa">Iowa</option>
  <option value="Kansas">Kansas</option>
  <option value="Kentucky">Kentucky</option>
  <option value="Louisiana">Louisiana</option>
  <option value="Maine">Maine</option>
  <option value="Maryland">Maryland</option>
  <option value="Massachusetts">Massachusetts</option>
  <option value="Michigan">Michigan</option>
  <option value="Minnesota">Minnesota</option>
  <option value="Mississippi">Mississippi</option>
  <option value="Missouri">Missouri</option>
  <option value="Montana">Montana</option>
  <option value="Nebraska">Nebraska</option>
  <option value="Nevada">Nevada</option>
  <option value="New Hampshire">New Hampshire</option>
  <option value="New Jersey">New Jersey</option>
  <option value="New Mexico">New Mexico</option>
  <option value="New York">New York</option>
  <option value="North Carolina">North Carolina</option>
  <option value="North Dakota">North Dakota</option>
  <option value="Ohio">Ohio</option>
  <option value="Oklahoma">Oklahoma</option>
  <option value="Oregon">Oregon</option>
  <option value="Pennsylvania">Pennsylvania</option>
  <option value="Rhode Island">Rhode Island</option>
  <option value="South Carolina">South Carolina</option>
  <option value="South Dakota">South Dakota</option>
  <option value="Tennessee">Tennessee</option>
  <option value="Texas">Texas</option>
  <option value="Utah">Utah</option>
  <option value="Vermont">Vermont</option>
  <option value="Virginia">Virginia</option>
  <option value="Washington">Washington</option>
  <option value="West Virginia">West Virginia</option>
  <option value="Wisconsin">Wisconsin</option>
  <option value="Wyoming">Wyoming</option>
</select>
<input
  name="years_in_business"
  placeholder="Years in Business"
  value={formData.years_in_business}
  onChange={handleChange}
  className="w-full border p-3 rounded"
/>

<input
  name="owner_hours_per_week"
  placeholder="Owner Hours per Week"
  value={formData.owner_hours_per_week}
  onChange={handleChange}
  className="w-full border p-3 rounded"
/>

<label className="block font-medium text-gray-700">Would you consider seller financing if terms were favorable?</label>
<select
  name="seller_financing_considered"
  value={formData.seller_financing_considered}
  onChange={handleChange}
  className="w-full border p-3 rounded"
>
  <option value="">Select</option>
  <option value="yes">Yes</option>
  <option value="no">No</option>
  <option value="maybe">Maybe</option>
</select>

              <input name="website" placeholder="Website" value={formData.website} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="annualRevenue" placeholder="Annual Revenue" value={formData.annualRevenue} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="annualProfit" placeholder="Annual Profit" value={formData.annualProfit} onChange={handleChange} className="w-full border p-3 rounded" />
             <input
  name="sde"
  placeholder="SDE"
  value={formData.sde}
  onChange={handleChange}
  className="w-full border p-3 rounded"
/>
<p className="text-sm text-gray-500 mt-1">
  Seller’s Discretionary Earnings (SDE) is the total financial benefit to a single owner-operator in a year.
  Includes net profit <strong>before taxes</strong>, owner’s salary, discretionary expenses, interest, depreciation,
  and one-time expenses. Commonly used to value small businesses.
</p>

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

 

