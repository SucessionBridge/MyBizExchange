import React, { useState } from 'react';
import jsPDF from 'jspdf';

export default function BusinessValuation() {
  const [formData, setFormData] = useState({
    businessName: '',
    yearsInBusiness: '',
    email: '',
    industry: '',
    annualRevenue: '',
    annualExpenses: '',
    totalSalariesPaid: '',
    ownerSalaryAddBack: '',
    personalAddBacks: '',
    hasEmployees: 'yes',
    equipment: [{ name: '', value: '' }],
    realEstateValue: '',
    wouldConsiderSellerFinancing: '',
    returnCustomersNotes: '',
    contractsNotes: '',
  });

  const industries = [
    'Landscaping', 'Construction', 'Cleaning', 'Retail', 'E-commerce', 'Consulting',
    'Accounting', 'Legal', 'Restaurant', 'Health & Wellness', 'Transportation',
    'Technology', 'Education', 'Manufacturing', 'Automotive', 'Real Estate',
    'Hospitality', 'Home Services', 'Fitness', 'Event Planning', 'Photography', 'Other'
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
    const ownerSalaryAddBack = parseFloat(formData.ownerSalaryAddBack) || 0;
    const addBacks = parseFloat(formData.personalAddBacks) || 0;
    const realEstate = parseFloat(formData.realEstateValue) || 0;

    const equipmentValue = formData.equipment.reduce((sum, eq) => {
      return sum + (parseFloat(eq.value) || 0);
    }, 0);

    const sde = revenue - expenses + ownerSalaryAddBack + addBacks;

    const multiplier = equipmentValue > 0
      ? (formData.hasEmployees === 'yes' ? 2.5 : 2.0)
      : (formData.hasEmployees === 'yes' ? 2.2 : 1.8);

    const sdeValue = sde * multiplier;

    return sdeValue + realEstate + (equipmentValue > 0 ? 0 : equipmentValue);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('SuccessionBridge Business Valuation', 20, 20);

    doc.setFontSize(11);
    doc.text('Disclaimer: This valuation is a simple tool to help business owners get a general sense of what their business may be worth.', 20, 30, { maxWidth: 170 });
    doc.text('It should not be used for investment, loan, or legal decisions.', 20, 36, { maxWidth: 170 });

    let y = 50;
    doc.setFontSize(12);
    doc.text(`Business Name: ${formData.businessName}`, 20, y); y += 8;
    doc.text(`Years in Business: ${formData.yearsInBusiness}`, 20, y); y += 8;
    doc.text(`Email: ${formData.email}`, 20, y); y += 8;
    doc.text(`Industry: ${formData.industry}`, 20, y); y += 8;
    doc.text(`Annual Revenue: $${formData.annualRevenue}`, 20, y); y += 8;
    doc.text(`Annual Expenses: $${formData.annualExpenses}`, 20, y); y += 8;
    doc.text(`Total Salaries Paid: $${formData.totalSalariesPaid}`, 20, y); y += 8;
    doc.text(`Owner's Salary Add-Back: $${formData.ownerSalaryAddBack}`, 20, y); y += 8;
    doc.text(`Personal Add-Backs: $${formData.personalAddBacks}`, 20, y); y += 8;
    doc.text(`Employees: ${formData.hasEmployees}`, 20, y); y += 8;

    doc.text('Equipment:', 20, y); y += 8;
    formData.equipment.forEach(eq => {
      doc.text(`- ${eq.name}: $${eq.value}`, 30, y);
      y += 8;
    });

    doc.text(`Real Estate Value: $${formData.realEstateValue}`, 20, y); y += 12;

    doc.setFontSize(14);
    doc.text(`Estimated Valuation: $${calculateValuation().toFixed(2)}`, 20, y); y += 14;

    doc.setFontSize(12);
    doc.text('Seller Financing Advantage:', 20, y); y += 8;
    doc.setFontSize(11);
    doc.text(
      'Offering seller financing under your own terms can increase your total payout.',
      20, y, { maxWidth: 170 }
    ); y += 6;
    doc.text(
      'For example, financing $250K over 4 years at 6% interest could add tens of thousands in interest income to your sale price.',
      20, y, { maxWidth: 170 }
    ); y += 12;

    doc.save('valuation-report.pdf');
  };

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white shadow-md p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-4">Valuation Wizard</h1>

        <p className="mb-4 text-sm text-gray-600">
          Disclaimer: This valuation is a simple tool to help business owners get a general sense of what their business may be worth.
          It should not be used for investment, loan, or legal decisions.
        </p>

        <div className="space-y-4">
          <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="yearsInBusiness" placeholder="Years in Business" value={formData.yearsInBusiness} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="email" type="email" placeholder="Email Address (we’ll send your report)" value={formData.email} onChange={handleChange} className="w-full border p-3 rounded" required />

          <select name="industry" value={formData.industry} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="">Select Industry</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>

          <input name="annualRevenue" placeholder="Annual Revenue ($)" value={formData.annualRevenue} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="annualExpenses" placeholder="Annual Expenses ($)" value={formData.annualExpenses} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="totalSalariesPaid" placeholder="Total Salaries Paid (including owner)" value={formData.totalSalariesPaid} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="ownerSalaryAddBack" placeholder="Owner’s Salary (if included above)" value={formData.ownerSalaryAddBack} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="personalAddBacks" placeholder="Add-backs (personal expenses, etc.)" value={formData.personalAddBacks} onChange={handleChange} className="w-full border p-3 rounded" />

          <label className="block font-medium">Does your business have employees?</label>
          <select name="hasEmployees" value={formData.hasEmployees} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="yes">Yes</option>
            <option value="no">No, I operate it alone</option>
          </select>

          <label className="block font-medium">Would you consider seller financing as part of your exit?</label>
          <select name="wouldConsiderSellerFinancing" value={formData.wouldConsiderSellerFinancing} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="">Select Option</option>
            <option value="yes">Yes</option>
            <option value="maybe">Maybe</option>
            <option value="no">No</option>
          </select>

          <label className="block font-medium">Notes on Return Customers</label>
          <textarea name="returnCustomersNotes" value={formData.returnCustomersNotes} onChange={handleChange} className="w-full border p-3 rounded" placeholder="How many customers are repeat buyers? % or details..." />

          <label className="block font-medium">Notes on Contracts in Place</label>
          <textarea name="contractsNotes" value={formData.contractsNotes} onChange={handleChange} className="w-full border p-3 rounded" placeholder="Any long-term contracts? List value or details..." />

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
            <p className="text-sm text-gray-600">
              💡 Offering seller financing under your own terms can increase your total payout. Financing part of the sale over a few years with interest can add significant income while making your business more attractive to buyers.
            </p>

            <button onClick={generatePDF} className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
              Download PDF Report
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
