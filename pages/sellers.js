// pages/seller-wizard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function SellerWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [aiDescription, setAiDescription] = useState('');
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    askingPrice: '',
    annualRevenue: '',
    sde: '',
    inventoryValue: '',
    inventoryIncluded: false,
    equipmentValue: '',
    rent: '',
    realEstateIncluded: false,
    yearEstablished: '',
    employees: '',
    location: '',
    homeBased: false,
    relocatable: false,
    website: '',
    businessDescription: '',
    customerType: '',
    marketingMethod: '',
    ownerInvolvement: '',
    canRunWithoutOwner: '',
    competitiveEdge: '',
    competitors: '',
    growthPotential: '',
    reasonForSelling: '',
    trainingOffered: '',
    creativeFinancing: false,
    willingToMentor: false,
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFormData((prev) => ({ ...prev, email: user.email }));
      }
    };
    getUser();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    const res = await fetch('/api/submit-seller-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, aiDescription }),
    });
    if (res.ok) router.push('/dashboard');
  };

  const generateDescription = async () => {
    setLoadingDescription(true);
    setError('');

    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName || 'N/A',
          industry: formData.industry || 'Small Business',
          location: formData.location,
          sentenceSummary: formData.businessDescription,
          customers: formData.customerType,
          bestSellers: '',
          customerLove: '',
          repeatCustomers: '',
          keepsThemComing: '',
          ownerInvolvement: formData.ownerInvolvement,
          opportunity: formData.growthPotential,
          proudOf: '',
          adviceToBuyer: formData.trainingOffered,
          annualRevenue: formData.annualRevenue,
          annualProfit: formData.sde,
          includesInventory: formData.inventoryIncluded,
          includesBuilding: formData.realEstateIncluded,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiDescription(data.description);
      } else {
        setError(data.error || 'Failed to generate description');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoadingDescription(false);
    }
  };

  const StepZero = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Tell us about yourself</h2>
      <input name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" className="w-full border p-3 rounded" />
      <input name="email" value={formData.email} onChange={handleChange} placeholder="Your Email" className="w-full border p-3 rounded" disabled />
      <input name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Business Name (optional)" className="w-full border p-3 rounded" />
    </div>
  );

  const StepOne = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Financials</h2>
      <input name="askingPrice" value={formData.askingPrice} onChange={handleChange} placeholder="Asking Price" className="input" />
      <input name="annualRevenue" value={formData.annualRevenue} onChange={handleChange} placeholder="Annual Revenue" className="input" />
      <input name="sde" value={formData.sde} onChange={handleChange} placeholder="Seller Discretionary Earnings (SDE)" className="input" />
      <input name="inventoryValue" value={formData.inventoryValue} onChange={handleChange} placeholder="Inventory Value" className="input" />
      <label className="flex items-center"><input name="inventoryIncluded" type="checkbox" className="mr-2" onChange={handleChange} />Inventory Included?</label>
      <input name="equipmentValue" value={formData.equipmentValue} onChange={handleChange} placeholder="Equipment/FF&E Value" className="input" />
      <input name="rent" value={formData.rent} onChange={handleChange} placeholder="Rent (monthly)" className="input" />
      <label className="flex items-center"><input name="realEstateIncluded" type="checkbox" className="mr-2" onChange={handleChange} />Real Estate Included?</label>
    </div>
  );

  // (Keep StepTwo to StepSix same as before)

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 space-y-6">
        {step === 0 && <StepZero />}
        {step === 1 && <StepOne />}
        {/* Add StepTwo ... StepSix */}

        <div className="flex justify-between pt-4">
          {step > 0 && <button onClick={prevStep} className="bg-gray-300 px-4 py-2 rounded">Back</button>}
          {step < 6 && <button onClick={nextStep} className="bg-blue-600 text-white px-4 py-2 rounded">Next</button>}
          {step === 6 && <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded">Submit</button>}
        </div>
      </div>
    </main>
  );
}


