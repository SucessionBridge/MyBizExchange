// pages/seller-wizard.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SellerWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    hideBusinessName: false,
    industry: '',
    location: '',
    askingPrice: '',
    annualRevenue: '',
    sde: '',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const res = await fetch('/api/submit-seller-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) router.push('/dashboard');
    else alert('There was a problem submitting your listing.');
  };

  const StepOne = () => (
    <div className="space-y-6">
      <input
        name="name"
        placeholder="Your Full Name"
        value={formData.name}
        onChange={handleChange}
        className="w-full border p-3 rounded text-black"
      />
      <input
        name="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={handleChange}
        className="w-full border p-3 rounded text-black"
      />
      <input
        name="businessName"
        placeholder="Business Name"
        value={formData.businessName}
        onChange={handleChange}
        className="w-full border p-3 rounded text-black"
      />
      <label className="flex items-center gap-2">
        <input
          name="hideBusinessName"
          type="checkbox"
          checked={formData.hideBusinessName}
          onChange={handleChange}
        />
        Hide business name from public listing
      </label>
    </div>
  );

  const StepTwo = () => (
    <div className="space-y-6">
      <input
        name="industry"
        placeholder="Industry (e.g. Landscaping, Cafe)"
        value={formData.industry}
        onChange={handleChange}
        className="w-full border p-3 rounded text-black"
      />
      <input
        name="location"
        placeholder="Location (City, State)"
        value={formData.location}
        onChange={handleChange}
        className="w-full border p-3 rounded text-black"
      />
      <input
        name="askingPrice"
        placeholder="Asking Price ($)"
        type="number"
        value={formData.askingPrice}
        onChange={handleChange}
        className="w-full border p-3 rounded text-black"
      />
      <input
        name="annualRevenue"
        placeholder="Annual Revenue ($)"
        type="number"
        value={formData.annualRevenue}
        onChange={handleChange}
        className="w-full border p-3 rounded text-black"
      />
      <input
        name="sde"
        placeholder="Seller Discretionary Earnings (SDE)"
        type="number"
        value={formData.sde}
        onChange={handleChange}
        className="w-full border p-3 rounded text-black"
      />
    </div>
  );

  const StepThree = () => (
    <div className="space-y-6">
      <textarea
        name="description"
        placeholder="Briefly describe your business, what it does, and any key highlights."
        value={formData.description}
        onChange={handleChange}
        className="w-full border p-3 rounded text-black min-h-[150px]"
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Seller Onboarding</h1>

        {step === 1 && <StepOne />}
        {step === 2 && <StepTwo />}
        {step === 3 && <StepThree />}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Submit Listing
            </button>
          )}
        </div>
      </div>
    </main>
  );
}



