// pages/seller-wizard.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SellerWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
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
      body: JSON.stringify(formData),
    });
    if (res.ok) router.push('/dashboard');
  };

  const StepOne = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Financials</h2>
      <input name="askingPrice" type="number" placeholder="Asking Price" className="input" onChange={handleChange} />
      <input name="annualRevenue" type="number" placeholder="Annual Revenue" className="input" onChange={handleChange} />
      <input name="sde" type="number" placeholder="Seller Discretionary Earnings (SDE)" className="input" onChange={handleChange} />
      <input name="inventoryValue" type="number" placeholder="Inventory Value" className="input" onChange={handleChange} />
      <label className="flex items-center"><input name="inventoryIncluded" type="checkbox" className="mr-2" onChange={handleChange} />Inventory Included?</label>
      <input name="equipmentValue" type="number" placeholder="Equipment/FF&E Value" className="input" onChange={handleChange} />
      <input name="rent" type="text" placeholder="Rent (monthly)" className="input" onChange={handleChange} />
      <label className="flex items-center"><input name="realEstateIncluded" type="checkbox" className="mr-2" onChange={handleChange} />Real Estate Included?</label>
    </div>
  );

  const StepTwo = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Business Overview</h2>
      <input name="yearEstablished" type="number" placeholder="Year Established" className="input" onChange={handleChange} />
      <input name="employees" type="number" placeholder="Number of Employees" className="input" onChange={handleChange} />
      <input name="location" type="text" placeholder="Location (City, State)" className="input" onChange={handleChange} />
      <label className="flex items-center"><input name="homeBased" type="checkbox" className="mr-2" onChange={handleChange} />Home-Based?</label>
      <label className="flex items-center"><input name="relocatable" type="checkbox" className="mr-2" onChange={handleChange} />Relocatable?</label>
      <input name="website" type="url" placeholder="Website (optional)" className="input" onChange={handleChange} />
    </div>
  );

  const StepThree = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Operations</h2>
      <textarea name="businessDescription" placeholder="What does your business do?" className="textarea" onChange={handleChange}></textarea>
      <input name="customerType" type="text" placeholder="Who are your customers?" className="input" onChange={handleChange} />
      <input name="marketingMethod" type="text" placeholder="How do you find customers?" className="input" onChange={handleChange} />
      <input name="ownerInvolvement" type="text" placeholder="Your role in the business" className="input" onChange={handleChange} />
      <input name="canRunWithoutOwner" type="text" placeholder="Can it run without you?" className="input" onChange={handleChange} />
    </div>
  );

  const StepFour = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Opportunity</h2>
      <textarea name="competitiveEdge" placeholder="Why do customers choose you?" className="textarea" onChange={handleChange}></textarea>
      <textarea name="competitors" placeholder="Who are your competitors?" className="textarea" onChange={handleChange}></textarea>
      <textarea name="growthPotential" placeholder="How could a new owner grow the business?" className="textarea" onChange={handleChange}></textarea>
      <textarea name="reasonForSelling" placeholder="Why are you selling?" className="textarea" onChange={handleChange}></textarea>
    </div>
  );

  const StepFive = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Support & Financing</h2>
      <input name="trainingOffered" type="text" placeholder="How much training will you offer?" className="input" onChange={handleChange} />
      <label className="flex items-center"><input name="creativeFinancing" type="checkbox" className="mr-2" onChange={handleChange} />Open to creative financing (e.g. rent-to-own)?</label>
      <label className="flex items-center"><input name="willingToMentor" type="checkbox" className="mr-2" onChange={handleChange} />Willing to mentor or stay involved post-sale?</label>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow space-y-6">
      {step === 1 && <StepOne />}
      {step === 2 && <StepTwo />}
      {step === 3 && <StepThree />}
      {step === 4 && <StepFour />}
      {step === 5 && <StepFive />}

      <div className="flex justify-between pt-4">
        {step > 1 && <button onClick={prevStep} className="btn">Back</button>}
        {step < 5 && <button onClick={nextStep} className="btn">Next</button>}
        {step === 5 && <button onClick={handleSubmit} className="btn btn-primary">Submit</button>}
      </div>
    </div>
  );
}  
