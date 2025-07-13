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

  const renderPreview = () => (
    <div className="bg-white border rounded p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          {!formData.hideBusinessName && (
            <h2 className="text-3xl font-bold text-gray-900">{formData.businessName}</h2>
          )}
          <p className="text-lg text-gray-700"><strong>Location:</strong> {formData.location}</p>
          <p className="text-lg text-gray-700"><strong>Website:</strong> {formData.website}</p>
          <p className="text-lg text-gray-700"><strong>Asking Price:</strong> {formatCurrency(formData.askingPrice)}</p>
          <p className="text-lg text-gray-700"><strong>Annual Revenue:</strong> {formatCurrency(formData.annualRevenue)}</p>
          <p className="text-lg text-gray-700"><strong>SDE:</strong> {formatCurrency(formData.sde)}</p>
          <p className="text-lg text-gray-700"><strong>Employees:</strong> {formData.employees}</p>
          <p className="text-lg text-gray-700"><strong>Monthly Lease:</strong> {formatCurrency(formData.monthly_lease)}</p>
          <p className="text-lg text-gray-700"><strong>Inventory Value:</strong> {formatCurrency(formData.inventory_value)}</p>
          <p className="text-lg text-gray-700"><strong>Equipment Value:</strong> {formatCurrency(formData.equipment_value)}</p>
          <p className="text-lg text-gray-700"><strong>Includes Inventory:</strong> {formData.includesInventory ? 'Yes' : 'No'}</p>
          <p className="text-lg text-gray-700"><strong>Includes Building:</strong> {formData.includesBuilding ? 'Yes' : 'No'}</p>
          <p className="text-lg text-gray-700"><strong>Real Estate Included:</strong> {formData.real_estate_included ? 'Yes' : 'No'}</p>
          <p className="text-lg text-gray-700"><strong>Relocatable:</strong> {formData.relocatable ? 'Yes' : 'No'}</p>
          <p className="text-lg text-gray-700"><strong>Home-Based:</strong> {formData.home_based ? 'Yes' : 'No'}</p>
          <p className="text-lg text-gray-700"><strong>Customer Type:</strong> {formData.customerType}</p>
          <p className="text-lg text-gray-700"><strong>Owner Involvement:</strong> {formData.ownerInvolvement}</p>
          <p className="text-lg text-gray-700"><strong>Growth Potential:</strong> {formData.growthPotential}</p>
          <p className="text-lg text-gray-700"><strong>Reason for Selling:</strong> {formData.reasonForSelling}</p>
          <p className="text-lg text-gray-700"><strong>Training Offered:</strong> {formData.trainingOffered}</p>
        </div>
        <div className="space-y-2">
          {imagePreviews.map((src, idx) => (
            <img key={idx} src={src} alt="Business photo" className="w-full h-40 object-cover rounded border" />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-semibold mb-2">Business Description</h3>
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed border p-4 rounded bg-gray-50">
          {formData.businessDescription || 'No description provided.'}
        </p>
      </div>
      {formData.aiDescription && (
        <div>
          <h3 className="text-2xl font-semibold mb-2">AI-Enhanced Description</h3>
          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed border p-4 rounded bg-blue-50">
            {formData.aiDescription}
          </p>
        </div>
      )}
      <div className="flex gap-4">
        <button onClick={() => setPreviewMode(false)} className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded">Edit</button>
        <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Submit Listing</button>
      </div>
    </div>
  );

  return (
    <main className="bg-white min-h-screen p-6 font-sans">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>
        {previewMode ? renderPreview() : (
          <div>...</div>  {/* form steps unchanged */}
        )}
      </div>
    </main>
  );
}

