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
    <div className="bg-white">
      {imagePreviews.length > 0 && (
        <div className="mb-6">
          <img
            src={imagePreviews[0]}
            alt="Business main"
            className="w-full h-72 object-cover rounded shadow-md"
          />
        </div>
      )}

      <div className="mb-6 border-b pb-4">
        {!formData.hideBusinessName && (
          <h2 className="text-3xl font-bold text-gray-800">{formData.businessName}</h2>
        )}
        <p className="text-gray-600 text-lg">{formData.industry} · {formData.location}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg mb-8">
        <div><span className="font-semibold">Asking Price:</span> {formatCurrency(formData.askingPrice)}</div>
        <div><span className="font-semibold">Annual Revenue:</span> {formatCurrency(formData.annualRevenue)}</div>
        <div><span className="font-semibold">SDE (Cash Flow):</span> {formatCurrency(formData.sde)}</div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 border-b pb-1">🏢 Business Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
          <p><strong>Employees:</strong> {formData.employees}</p>
          <p><strong>Monthly Lease:</strong> {formatCurrency(formData.monthly_lease)}</p>
          <p><strong>Inventory Included:</strong> {formData.includesInventory ? 'Yes' : 'No'}</p>
          <p><strong>Inventory Value:</strong> {formatCurrency(formData.inventory_value)}</p>
          <p><strong>Equipment Value:</strong> {formatCurrency(formData.equipment_value)}</p>
          <p><strong>Includes Building:</strong> {formData.includesBuilding ? 'Yes' : 'No'}</p>
          <p><strong>Real Estate Included:</strong> {formData.real_estate_included ? 'Yes' : 'No'}</p>
          <p><strong>Home-Based:</strong> {formData.home_based ? 'Yes' : 'No'}</p>
          <p><strong>Relocatable:</strong> {formData.relocatable ? 'Yes' : 'No'}</p>
          <p><strong>Financing Type:</strong> {formData.financingType.replace(/-/g, ' ')}</p>
        </div>
      </div>

      {(formData.businessDescription || formData.aiDescription) && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 border-b pb-1">📝 Business Description</h3>
          {formData.businessDescription && (
            <div className="text-gray-700 whitespace-pre-wrap mb-4">{formData.businessDescription}</div>
          )}
          {formData.aiDescription && (
            <div className="text-gray-800 bg-blue-50 p-4 rounded whitespace-pre-wrap border border-blue-200">
              {formData.aiDescription}
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 border-b pb-1">📈 Growth & Expansion</h3>
        <p className="text-gray-800 whitespace-pre-wrap">
          {formData.growthPotential || 'Seller has not specified growth opportunities.'}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 border-b pb-1">👨‍💼 Operations & Transition</h3>
        <p><strong>Customer Type:</strong> {formData.customerType}</p>
        <p><strong>Owner Involvement:</strong> {formData.ownerInvolvement}</p>
        <p><strong>Reason for Selling:</strong> {formData.reasonForSelling}</p>
        <p><strong>Training Offered:</strong> {formData.trainingOffered}</p>
      </div>

      {imagePreviews.length > 1 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2 border-b pb-1">🖼 Additional Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            {imagePreviews.slice(1).map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Photo ${idx + 2}`}
                className="rounded w-full h-40 object-cover border"
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => setPreviewMode(false)}
          className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
        >
          Edit
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Submit Listing
        </button>
      </div>
    </div>
  );

  // rest of the form and return statement stays the same...
}
