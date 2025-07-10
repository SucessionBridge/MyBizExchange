// pages/seller-wizard.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SellerWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [aiDescription, setAiDescription] = useState('');
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
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
          businessName: 'N/A',
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

  const Step = ({ title, children }) => (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h2>
      {children}
    </section>
  );

  const steps = [
    <Step title="Financials">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="askingPrice" type="number" placeholder="Asking Price" className="input" onChange={handleChange} />
        <input name="annualRevenue" type="number" placeholder="Annual Revenue" className="input" onChange={handleChange} />
        <input name="sde" type="number" placeholder="Seller Discretionary Earnings (SDE)" className="input" onChange={handleChange} />
        <input name="inventoryValue" type="number" placeholder="Inventory Value" className="input" onChange={handleChange} />
        <input name="equipmentValue" type="number" placeholder="Equipment/FF&E Value" className="input" onChange={handleChange} />
        <input name="rent" type="text" placeholder="Rent (monthly)" className="input" onChange={handleChange} />
      </div>
      <label className="block mt-4"><input name="inventoryIncluded" type="checkbox" className="mr-2" onChange={handleChange} /> Inventory Included?</label>
      <label><input name="realEstateIncluded" type="checkbox" className="mr-2" onChange={handleChange} /> Real Estate Included?</label>
    </Step>,

    <Step title="Business Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="yearEstablished" type="number" placeholder="Year Established" className="input" onChange={handleChange} />
        <input name="employees" type="number" placeholder="Number of Employees" className="input" onChange={handleChange} />
        <input name="location" type="text" placeholder="Location (City, State)" className="input" onChange={handleChange} />
        <input name="website" type="url" placeholder="Website (optional)" className="input" onChange={handleChange} />
      </div>
      <label className="block mt-4"><input name="homeBased" type="checkbox" className="mr-2" onChange={handleChange} /> Home-Based?</label>
      <label><input name="relocatable" type="checkbox" className="mr-2" onChange={handleChange} /> Relocatable?</label>
    </Step>,

    <Step title="Operations">
      <textarea name="businessDescription" placeholder="What does your business do?" className="textarea" onChange={handleChange}></textarea>
      <input name="customerType" type="text" placeholder="Who are your customers?" className="input" onChange={handleChange} />
      <input name="marketingMethod" type="text" placeholder="How do you find customers?" className="input" onChange={handleChange} />
      <input name="ownerInvolvement" type="text" placeholder="Your role in the business" className="input" onChange={handleChange} />
      <input name="canRunWithoutOwner" type="text" placeholder="Can it run without you?" className="input" onChange={handleChange} />
    </Step>,

    <Step title="Opportunity">
      <textarea name="competitiveEdge" placeholder="Why do customers choose you?" className="textarea" onChange={handleChange}></textarea>
      <textarea name="competitors" placeholder="Who are your competitors?" className="textarea" onChange={handleChange}></textarea>
      <textarea name="growthPotential" placeholder="How could a new owner grow the business?" className="textarea" onChange={handleChange}></textarea>
      <textarea name="reasonForSelling" placeholder="Why are you selling?" className="textarea" onChange={handleChange}></textarea>
    </Step>,

    <Step title="Support & Financing">
      <input name="trainingOffered" type="text" placeholder="How much training will you offer?" className="input" onChange={handleChange} />
      <label className="block mt-4"><input name="creativeFinancing" type="checkbox" className="mr-2" onChange={handleChange} /> Open to creative financing (e.g. rent-to-own)?</label>
      <label><input name="willingToMentor" type="checkbox" className="mr-2" onChange={handleChange} /> Willing to mentor or stay involved post-sale?</label>
    </Step>,

    <Step title="Review & Generate Listing Description">
      <p className="text-sm text-gray-600 mb-2">Click below to generate your professional listing summary based on your answers.</p>
      <button onClick={generateDescription} className="btn btn-secondary">
        {loadingDescription ? 'Generating...' : 'Generate Description'}
      </button>
      {aiDescription && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold mb-2">AI-Generated Description:</h3>
          <p>{aiDescription}</p>
        </div>
      )}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </Step>,
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow space-y-6">
      {steps[step - 1]}
      <div className="flex justify-between pt-4">
        {step > 1 && <button onClick={prevStep} className="btn">Back</button>}
        {step < steps.length && <button onClick={nextStep} className="btn">Next</button>}
        {step === steps.length && <button onClick={handleSubmit} className="btn btn-primary">Submit</button>}
      </div>
    </div>
  );
}
