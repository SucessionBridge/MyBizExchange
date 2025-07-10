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

  const Input = ({ label, ...props }) => (
    <div>
      <label className="block mb-1 font-medium text-gray-700">{label}</label>
      <input {...props} className="w-full border p-3 rounded text-black" />
    </div>
  );

  const Textarea = ({ label, ...props }) => (
    <div>
      <label className="block mb-1 font-medium text-gray-700">{label}</label>
      <textarea {...props} className="w-full border p-3 rounded text-black" rows={4} />
    </div>
  );

  const Checkbox = ({ label, name }) => (
    <label className="flex items-center space-x-2">
      <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange} />
      <span>{label}</span>
    </label>
  );

  const StepOne = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Financials</h2>
      <Input label="Asking Price" name="askingPrice" type="number" onChange={handleChange} />
      <Input label="Annual Revenue" name="annualRevenue" type="number" onChange={handleChange} />
      <Input label="SDE (Profit to Owner)" name="sde" type="number" onChange={handleChange} />
      <Input label="Inventory Value" name="inventoryValue" type="number" onChange={handleChange} />
      <Checkbox label="Includes Inventory?" name="inventoryIncluded" />
      <Input label="Equipment / FF&E Value" name="equipmentValue" type="number" onChange={handleChange} />
      <Input label="Monthly Rent" name="rent" onChange={handleChange} />
      <Checkbox label="Includes Real Estate?" name="realEstateIncluded" />
    </div>
  );

  const StepTwo = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Business Overview</h2>
      <Input label="Year Established" name="yearEstablished" type="number" onChange={handleChange} />
      <Input label="Number of Employees" name="employees" type="number" onChange={handleChange} />
      <Input label="Location (City, State)" name="location" onChange={handleChange} />
      <Checkbox label="Home-Based Business?" name="homeBased" />
      <Checkbox label="Relocatable?" name="relocatable" />
      <Input label="Website (optional)" name="website" type="url" onChange={handleChange} />
    </div>
  );

  const StepThree = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Operations</h2>
      <Textarea label="What does your business do?" name="businessDescription" onChange={handleChange} />
      <Input label="Who are your customers?" name="customerType" onChange={handleChange} />
      <Input label="How do you find customers?" name="marketingMethod" onChange={handleChange} />
      <Input label="Your role in the business" name="ownerInvolvement" onChange={handleChange} />
      <Input label="Can it run without you?" name="canRunWithoutOwner" onChange={handleChange} />
    </div>
  );

  const StepFour = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Opportunity & Transition</h2>
      <Textarea label="What gives your business a competitive edge?" name="competitiveEdge" onChange={handleChange} />
      <Textarea label="Who are your main competitors?" name="competitors" onChange={handleChange} />
      <Textarea label="Growth opportunities for a new owner?" name="growthPotential" onChange={handleChange} />
      <Textarea label="Why are you selling?" name="reasonForSelling" onChange={handleChange} />
    </div>
  );

  const StepFive = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Support & Financing</h2>
      <Input label="How much training will you offer?" name="trainingOffered" onChange={handleChange} />
      <Checkbox label="Open to creative financing (e.g. rent-to-own)?" name="creativeFinancing" />
      <Checkbox label="Willing to mentor after sale?" name="willingToMentor" />
    </div>
  );

  const StepSix = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">AI-Generated Listing Description</h2>
      <button onClick={generateDescription} type="button" className="bg-blue-600 text-white px-4 py-2 rounded">
        {loadingDescription ? 'Generating...' : 'Generate Description'}
      </button>

      {aiDescription && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Preview:</h3>
          <p>{aiDescription}</p>
        </div>
      )}

      {error && <p className="text-red-600 font-medium">{error}</p>}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow space-y-6">
        {step === 1 && <StepOne />}
        {step === 2 && <StepTwo />}
        {step === 3 && <StepThree />}
        {step === 4 && <StepFour />}
        {step === 5 && <StepFive />}
        {step === 6 && <StepSix />}

        <div className="flex justify-between pt-4">
          {step > 1 && <button onClick={prevStep} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Back</button>}
          {step < 6 && <button onClick={nextStep} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Next</button>}
          {step === 6 && <button onClick={handleSubmit} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Submit</button>}
        </div>
      </div>
    </main>
  );
}


