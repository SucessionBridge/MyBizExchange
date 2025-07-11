// pages/sellers.js
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
    <div>
      <h2 className="text-2xl font-semibold mb-4">Preview Your Listing</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2 text-gray-800">
          {!formData.hideBusinessName && <p><strong>Business Name:</strong> {formData.businessName}</p>}
          <p><strong>Location:</strong> {formData.location}</p>
          <p><strong>Website:</strong> {formData.website}</p>
          <p><strong>Asking Price:</strong> {formatCurrency(formData.askingPrice)}</p>
          <p><strong>Annual Revenue:</strong> {formatCurrency(formData.annualRevenue)}</p>
          <p><strong>SDE:</strong> {formatCurrency(formData.sde)}</p>
          <p><strong>Employees:</strong> {formData.employees}</p>
          <p><strong>Monthly Lease:</strong> {formatCurrency(formData.monthly_lease)}</p>
          <p><strong>Inventory Value:</strong> {formatCurrency(formData.inventory_value)}</p>
          <p><strong>Equipment Value:</strong> {formatCurrency(formData.equipment_value)}</p>
          <p><strong>Includes Inventory:</strong> {formData.includesInventory ? 'Yes' : 'No'}</p>
          <p><strong>Includes Building:</strong> {formData.includesBuilding ? 'Yes' : 'No'}</p>
          <p><strong>Real Estate Included:</strong> {formData.real_estate_included ? 'Yes' : 'No'}</p>
          <p><strong>Relocatable:</strong> {formData.relocatable ? 'Yes' : 'No'}</p>
          <p><strong>Home-Based:</strong> {formData.home_based ? 'Yes' : 'No'}</p>
          <p><strong>Customer Type:</strong> {formData.customerType}</p>
          <p><strong>Owner Involvement:</strong> {formData.ownerInvolvement}</p>
          <p><strong>Growth Potential:</strong> {formData.growthPotential}</p>
          <p><strong>Reason for Selling:</strong> {formData.reasonForSelling}</p>
          <p><strong>Training Offered:</strong> {formData.trainingOffered}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {imagePreviews.map((src, idx) => (
            <img key={idx} src={src} className="rounded w-full h-32 object-cover border" />
          ))}
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Business Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed border p-4 rounded bg-gray-50">
          {formData.businessDescription || 'No description provided.'}
        </p>
      </div>
      {formData.aiDescription && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">AI-Enhanced Description</h2>
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed border p-4 rounded bg-blue-50">
            {formData.aiDescri

