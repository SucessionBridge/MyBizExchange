import { useState } from 'react';

export default function LandscapingValuation() {
  const [formData, setFormData] = useState({
    businessName: '',
    annualRevenue: '',
    sde: '',
    realEstateValue: '',
    equipment: [{ name: '', value: '' }],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEquipmentChange = (index, field, value) => {
    const updatedEquipment = [...formData.equipment];
    updatedEquipment[index][field] = value;
    setFormData((prev) => ({ ...prev, equipment: updatedEquipment }));
  };

  const addEquipment = () => {
    setFormData((prev) => ({ ...prev, equipment: [...prev.equipment, { name: '', value: '' }] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
    // TODO: Send data to Supabase or run valuation logic
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Landscaping Business Valuation</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          placeholder="Business Name"
          className="w-full p-3 border rounded text-black"
        />

        <input
          name="annualRevenue"
          value={formData.annualRevenue}
          onChange={handleChange}
          placeholder="Annual Revenue"
          type="number"
          className="w-full p-3 border rounded text-black"
        />

        <input
          name="sde"
          value={formData.sde}
          onChange={handleChange}
          placeholder="Seller's Discretionary Earnings (SDE)"
          type="number"
          className="w-full p-3 border rounded text-black"
        />

        <input
          name="realEstateValue"
          value={formData.realEstateValue}
          onChange={handleChange}
          placeholder="Real Estate Value (if selling)"
          type="number"
          className="w-full p-3 border rounded text-black"
        />

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Equipment</h2>
          {formData.equipment.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                placeholder="Equipment Name"
                value={item.name}
                onChange={(e) => handleEquipmentChange(index, 'name', e.target.value)}
                className="flex-1 p-2 border rounded text-black"
              />
              <input
                placeholder="Value"
                value={item.value}
                onChange={(e) => handleEquipmentChange(index, 'value', e.target.value)}
                type="number"
                className="w-32 p-2 border rounded text-black"
              />
            </div>
          ))}
          <button type="button" onClick={addEquipment} className="text-blue-600 font-semibold underline">
            + Add Another Equipment
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 text-lg font-semibold"
        >
          Generate Valuation
        </button>
      </form>
    </main>
  );
}
