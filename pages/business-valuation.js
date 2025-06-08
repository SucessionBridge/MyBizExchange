import { useState } from 'react';

export default function BusinessValuation() {
  const [form, setForm] = useState({
    businessName: '',
    yearsInBusiness: '',
    email: '',
    annualSales: '',
    expenses: '',
    ownerSalary: '',
    addBacks: '',
    equipmentList: '',
    equipmentValue: '',
    realEstateValue: '',
    ownerOperated: 'yes',
    hasTeam: 'no',
  });
  const [valuation, setValuation] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const calculateValuation = () => {
    const sales = parseFloat(form.annualSales) || 0;
    const expenses = parseFloat(form.expenses) || 0;
    const ownerSalary = parseFloat(form.ownerSalary) || 0;
    const addBacks = parseFloat(form.addBacks) || 0;
    const equipment = parseFloat(form.equipmentValue) || 0;
    const realEstate = parseFloat(form.realEstateValue) || 0;

    const sde = sales - expenses + ownerSalary + addBacks;

    let multiple = 2.0;
    if (form.ownerOperated === 'yes' && form.hasTeam === 'no') multiple = 1.5;
    else if (form.hasTeam === 'yes') multiple = 2.5;

    const valuationEstimate = sde * multiple + equipment + realEstate;
    setValuation(valuationEstimate);
  };

  return (
    <main className="p-8 bg-blue-50 min-h-screen text-black">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">Landscaping Business Valuation</h1>

        <input name="businessName" placeholder="Business Name" onChange={handleChange} className="w-full border p-3 rounded" />
        <input name="yearsInBusiness" placeholder="Years in Business" onChange={handleChange} className="w-full border p-3 rounded" />
        <input name="email" placeholder="Email Address (for report)" onChange={handleChange} className="w-full border p-3 rounded" />

        <input name="annualSales" placeholder="Annual Sales ($)" onChange={handleChange} className="w-full border p-3 rounded" />
        <input name="expenses" placeholder="Annual Expenses ($)" onChange={handleChange} className="w-full border p-3 rounded" />
        <input name="ownerSalary" placeholder="Owner Salary ($)" onChange={handleChange} className="w-full border p-3 rounded" />
        <input name="addBacks" placeholder="Discretionary Add-Backs ($)" onChange={handleChange} className="w-full border p-3 rounded" />

        <textarea name="equipmentList" placeholder="List of Equipment (e.g. Excavator, F-550 Dump Truck)" onChange={handleChange} className="w-full border p-3 rounded" rows="3" />
        <input name="equipmentValue" placeholder="Estimated Equipment Value ($)" onChange={handleChange} className="w-full border p-3 rounded" />
        <input name="realEstateValue" placeholder="Real Estate Value (if selling property) ($)" onChange={handleChange} className="w-full border p-3 rounded" />

        <div className="flex gap-4">
          <label className="flex-1">
            Is the business owner-operated?
            <select name="ownerOperated" onChange={handleChange} className="w-full border p-2 rounded">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="flex-1">
            Do you have a team in place?
            <select name="hasTeam" onChange={handleChange} className="w-full border p-2 rounded">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
        </div>

        <button onClick={calculateValuation} className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-semibold">
          Calculate Valuation
        </button>

        {valuation !== null && (
          <div className="bg-white p-6 rounded shadow text-center">
            <h2 className="text-xl font-semibold mb-2">Estimated Business Value</h2>
            <p className="text-2xl font-bold text-green-700">${valuation.toLocaleString()}</p>
          </div>
        )}
      </div>
    </main>
  );
}

