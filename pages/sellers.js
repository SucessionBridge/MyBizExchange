import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SellerWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

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

  const handleSubmit = async () => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'images') {
        value.forEach((file, i) => form.append(`images[${i}]`, file));
      } else {
        form.append(key, value);
      }
    });

    const res = await fetch('/api/submit-seller-listing', {
      method: 'POST',
      body: form
    });
    if (res.ok) router.push('/seller-dashboard');
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
        return `${toTitleCase(formData.industry)} for Sale`;
      } else if (formData.hideBusinessName) {
        return 'Confidential Business Listing';
      } else {
        return formData.businessName;
      }
    };

    const selectedDescription =
      formData.descriptionChoice === 'ai'
        ? formData.aiDescription
        : formData.businessDescription;

    return (
      <div className="bg-white rounded shadow p-6 space-y-8 font-serif text-gray-900">
        <h2 className="text-4xl font-bold tracking-tight mb-1">{getListingTitle()}</h2>
        <p className="text-md text-gray-600">{formData.location}</p>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {imagePreviews.map((src, idx) => (
              <img key={idx} src={src} className="w-full h-64 object-cover rounded shadow-sm border" />
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

        <div>
          <h3 className="text-xl font-semibold border-b pb-2 mb-3">Business Description</h3>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedDescription || 'No description provided.'}</p>
        </div>

        {formData.aiDescription && formData.businessDescription && (
          <div>
            <label className="block text-sm mt-2 mb-1 font-medium">Choose Description to Display:</label>
            <select
              name="descriptionChoice"
              value={formData.descriptionChoice || 'manual'}
              onChange={handleChange}
              className="border p-2 rounded"
            >
              <option value="manual">Written by Seller</option>
              <option value="ai">AI-Enhanced Version</option>
            </select>
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

        <div className="mt-8 flex gap-4">
          <button onClick={() => setPreviewMode(false)} className="bg-gray-300 hover:bg-gray-400 text-black px-5 py-2 rounded">Edit</button>
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded">Submit Listing</button>
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
          <div> {/* Your form steps remain unchanged here */} </div>
        )}
      </div>
    </main>
  );
}
