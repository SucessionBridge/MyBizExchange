import React, { useState } from 'react';
import jsPDF from 'jspdf';

export default function ValuationWizard() {
  const [formData, setFormData] = useState({
    businessName: '',
    yearsInBusiness: '',
    email: '',
    industry: '',
    location: '',
    annualRevenue: '',
    annualExpenses: '',
    ownerSalary: '',
    personalAddBacks: '',
    hasEmployees: 'yes',
    equipment: [{ name: '', value: '' }],
    realEstateValue: '',
    confidenceRating: '3'
  });

  const industries = [
    'Landscaping', 'Construction', 'Cleaning', 'Retail', 'E-commerce', 'Consulting',
    'Accounting', 'Legal', 'Restaurant', 'Health & Wellness', 'Transportation',
    'Technology', 'Education', 'Manufacturing', 'Automotive', 'Real Estate',
    'Hospitality', 'Home Services', 'Fitness', 'Event Planning', 'Photography'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEquipmentChange = (index, field, value) => {
    const updated = [...formData.equipment];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, equipment: updated }));
  };

  const addEquipment = () => {
    setFormData((prev) => ({
      ...prev,
      equipment: [...prev.equipment, { name: '', value: '' }],
    }));
  };

  const calculateValuation = () => {
    const revenue = parseFloat(formData.annualRevenue) || 0;
    const expenses = parseFloat(formData.annualExpenses) || 0;
    const salary = parseFloat(formData.ownerSalary) || 0;
    const addBacks = parseFloat(formData.personalAddBacks) || 0;
    const realEstate = parseFloat(formData.realEstateValue) || 0;
    const sde = revenue - expenses + salary + addBacks;
    const multiplier = formData.hasEmployees === 'yes' ? 2.5 : 2.0;
    const sdeValue = sde * multiplier;
    const equipmentValue = formData.equipment.reduce((sum, eq) => sum + (parseFloat(eq.value) || 0), 0);
    return sdeValue + realEstate + equipmentValue;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Business Valuation Report', 20, 20);
    doc.setFontSize(12);

    let y = 30;
    doc.text(`Business Name: ${formData.businessName}`, 20, y += 10);
    doc.text(`Industry: ${formData.industry}`, 20, y += 10);
    doc.text(`Location: ${formData.location}`, 20, y += 10);
    doc.text(`Years in Business: ${formData.yearsInBusiness}`, 20, y += 10);
    doc.text(`Revenue: $${formData.annualRevenue}`, 20, y += 10);
    doc.text(`Expenses: $${formData.annualExpenses}`, 20, y += 10);
    doc.text(`Owner Salary: $${formData.ownerSalary}`, 20, y += 10);
    doc.text(`Add-backs: $${formData.personalAddBacks}`, 20, y += 10);
    doc.text(`Employees: ${formData.hasEmployees === 'yes' ? 'Yes' : 'Owner-operated'}`, 20, y += 10);
    doc.text(`Confidence Level: ${formData.confidenceRating}/5`, 20, y += 10);

    if (formData.equipment.length > 0) {
      doc.text('Equipment:', 20, y += 10);
      formData.equipment.forEach(eq => {
        doc.text(`- ${eq.name}: $${eq.value}`, 30, y += 10);
      });
    }

    doc.text(`Real Estate Value: $${formData.realEstateValue}`, 20, y += 10);
    doc.setFontSize(14);
    doc.text(`\nEstimated Valuation: $${calculateValuation().toFixed(2)}`, 20, y += 20);

    doc.save('valuation-report.pdf');
  };

  return (
    <main className="min-h-screen p-6 bg-blue-50">
      <div className="max-w-3xl mx-auto bg-white shadow-md p-6 rounded-lg">
        <h1 className="text-4xl font-bold mb-6 text-center">Valuation Wizard</h1>

        <div className="space-y-4">
          <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="yearsInBusiness" placeholder="Years in Business" value={formData.yearsInBusiness} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="email" placeholder="Email (for report)" value={formData.email} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="location" placeholder="City/Province" value={formData.location} onChange={handleChange} className="w-full border p-3 rounded" />

          <select name="industry" value={formData.industry} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="">Select Industry</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>

          <input name="annualRevenue" placeholder="Annual Revenue ($)" value={formData.annualRevenue} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="annualExpenses" placeholder="Annual Expenses ($)" value={formData.annualExpenses} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="ownerSalary" placeholder="Owner Salary ($)" value={formData.ownerSalary} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="personalAddBacks" placeholder="Add-backs (personal items, etc.)" value={formData.personalAddBacks} onChange={handleChange} className="w-full border p-3 rounded" />

          <select name="hasEmployees" value={formData.hasEmployees} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="yes">Has Employees</option>
            <option value="no">Owner-Operated</option>
          </select>

          <label className="block font-semibold">Confidence rating (1 = unsure, 5 = very confident):</label>
          <input type="range" min="1" max="5" name="confidenceRating" value={formData.confidenceRating} onChange={handleChange} className="w-full" />

          <label className="block font-medium">List Equipment</label>
          {formData.equipment.map((eq, idx) => (
            <div key={idx} className="flex space-x-2 mb-2">
              <input
                placeholder="Equipment Name"
                value={eq.name}
                onChange={(e) => handleEquipmentChange(idx, 'name', e.target.value)}
                className="flex-1 border p-2 rounded"
              />
              <input
                placeholder="Value ($)"
                value={eq.value}
                onChange={(e) => handleEquipmentChange(idx, 'value', e.target.value)}
                className="w-32 border p-2 rounded"
              />
            </div>
          ))}
          <button onClick={addEquipment} className="text-blue-600 hover:underline">+ Add Equipment</button>

          <input name="realEstateValue" placeholder="Real Estate Value ($)" value={formData.realEstateValue} onChange={handleChange} className="w-full border p-3 rounded" />

          <div className="mt-6">
            <p className="text-xl font-semibold mb-2">Estimated Valuation: ${calculateValuation().toFixed(2)}</p>
            <button onClick={generatePDF} className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
              Download PDF Report
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}


