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
    includeRealEstate: 'no',
    equipment: [{ name: '', value: '' }],
    realEstateValue: '',
    sellerFinancing: 'no',
  });

  const industries = [
    'Landscaping', 'Construction', 'Cleaning', 'Retail', 'E-commerce', 'Consulting',
    'Accounting', 'Legal', 'Restaurant', 'Health & Wellness', 'Transportation',
    'Technology', 'Education', 'Manufacturing', 'Automotive', 'Real Estate',
    'Hospitality', 'Home Services', 'Fitness', 'Event Planning', 'Photography',
    'Other'
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
    const realEstate = formData.includeRealEstate === 'yes' ? (parseFloat(formData.realEstateValue) || 0) : 0;

    const equipmentValue = formData.equipment.reduce((sum, eq) => {
      return sum + (parseFloat(eq.value) || 0);
    }, 0);

    const sde = revenue - expenses + ownerSalaryAddBack + addBacks;

    const multiplier = equipmentValue > 0
      ? (formData.hasEmployees === 'yes' ? 2.5 : 2.0)
      : (formData.hasEmployees === 'yes' ? 2.2 : 1.8);

    const sdeValue = sde * multiplier;

    return {
      businessValue: sdeValue,
      totalValue: sdeValue + realEstate,
      equipmentValue,
      realEstate
    };
  };

  const generatePDF = () => {
    const { businessValue, totalValue } = calculateValuation();
    const doc = new jsPDF();
    const lineHeight = 8;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SuccessionBridge Business Valuation', 20, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      'Disclaimer: This valuation is a simple tool to help business owners get a general sense of what their business may be worth. It should not be used for investment, loan, or legal decisions.',
      20,
      y,
      { maxWidth: 170 }
    );
    y += 20;

    const addLine = (label, value) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || '-', 80, y);
      y += lineHeight;
    };

    addLine('Business Name:', formData.businessName);
    addLine('Years in Business:', formData.yearsInBusiness);
    addLine('Email:', formData.email);
    addLine('Industry:', formData.industry);

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Financials', 20, y);
    y += lineHeight;

    addLine('Annual Revenue:', `$${parseFloat(formData.annualRevenue || 0).toLocaleString()}`);
    addLine('Annual Expenses:', `$${parseFloat(formData.annualExpenses || 0).toLocaleString()}`);
    addLine('Total Salaries Paid:', `$${parseFloat(formData.totalSalariesPaid || 0).toLocaleString()}`);
    addLine("Owner's Salary Add-Back:", `$${parseFloat(formData.ownerSalaryAddBack || 0).toLocaleString()}`);
    addLine('Personal Add-Backs:', `$${parseFloat(formData.personalAddBacks || 0).toLocaleString()}`);
    addLine('Employees:', formData.hasEmployees);

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Equipment', 20, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    if (formData.equipment.length > 0) {
      formData.equipment.forEach(eq => {
        if (eq.name || eq.value) {
          doc.text(`- ${eq.name || 'Unnamed'}: $${eq.value || 0}`, 30, y);
          y += lineHeight;
        }
      });
    } else {
      doc.text('None listed', 30, y);
      y += lineHeight;
    }

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Real Estate', 20, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text(`Include Real Estate: ${formData.includeRealEstate}`, 30, y);
    y += lineHeight;
    if (formData.includeRealEstate === 'yes') {
      doc.text(`Real Estate Value: $${parseFloat(formData.realEstateValue || 0).toLocaleString()}`, 30, y);
      y += lineHeight;
    }

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Estimated Business Value: $${businessValue.toFixed(2)}`, 20, y);
    y += lineHeight;
    if (formData.includeRealEstate === 'yes') {
      doc.text(`+ Real Estate: $${parseFloat(formData.realEstateValue || 0).toLocaleString()}`, 20, y);
      y += lineHeight;
      doc.text(`Total Estimated Value: $${totalValue.toFixed(2)}`, 20, y);
      y += lineHeight;
    }

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Seller Financing Advantage', 20, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Offering seller financing under your own terms can increase your total payout. For example, financing $250K over 4 years at 6% interest could add tens of thousands in interest income to your sale price.',
      20,
      y,
      { maxWidth: 170 }
    );
    y += 25;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Generated by SuccessionBridge Valuation Wizard', 20, y);

    doc.save('valuation-report.pdf');
  };

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white shadow-md p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Valuation Wizard</h1>

        <p className="mb-4 text-sm text-gray-600">
          📌 This valuation is a simple tool to help business owners get a general sense of what their business may be worth. It should not be used for investment, loan, or legal decisions.
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
          <input name="ownerSalaryAddBack" placeholder="Owner’s Salary (only if already included above)" value={formData.ownerSalaryAddBack} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="personalAddBacks" placeholder="Add-backs (personal expenses, etc.)" value={formData.personalAddBacks} onChange={handleChange} className="w-full border p-3 rounded" />

          <label className="block font-medium">Does your business have employees?</label>
          <select name="hasEmployees" value={formData.hasEmployees} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="yes">Yes</option>
            <option value="no">No, I operate it alone</option>
          </select>

          <label className="block font-medium">List Non-Essential Equipment</label>
          <p className="text-sm text-gray-600">
            💡 Only include equipment here if it is <strong>not essential</strong> to running the business (like extra tools or backup vehicles). If the equipment is required for daily operations (e.g. oven for a bakery, dump truck for landscaping), leave this blank — its value is already reflected in the valuation multiplier.
          </p>

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

          <label className="block font-medium">Include Real Estate in Valuation?</label>
          <p className="text-sm text-gray-600">
            💡 If you own the property and want its value included in the total, select "Yes" and enter its estimated market value. This will be added as a separate line item in the report.
          </p>
          <select name="includeRealEstate" value={formData.includeRealEstate} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>

          {formData.includeRealEstate === 'yes' && (
            <input name="realEstateValue" placeholder="Real Estate Value ($)" value={formData.realEstateValue} onChange={handleChange} className="w-full border p-3 rounded" />
          )}

          <label className="block font-medium">Would you consider seller financing as part of your exit?</label>
          <select name="sellerFinancing" value={formData.sellerFinancing} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="no">No</option>
            <option value="yes">Yes</option>
            <option value="maybe">Maybe, I want to learn more</option>
          </select>

          <div className="mt-6">
            <p className="text-xl font-semibold mb-2">Estimated Business Value: ${calculateValuation().businessValue.toFixed(2)}</p>
            {formData.includeRealEstate === 'yes' && (
              <p className="text-lg font-medium">+ Real Estate: ${calculateValuation().realEstate}</p>
            )}
            {formData.includeRealEstate === 'yes' && (
              <p className="text-lg font-bold">Total Estimated Value: ${calculateValuation().totalValue.toFixed(2)}</p>
            )}

            <p className="text-sm text-gray-700 mt-4">
              💡 The price you choose to sell your business is ultimately your decision. How you get paid and who you sell to will also be your decision. Use this valuation as a guideline — offering seller financing under your terms can help you achieve a higher total payout and reduce taxable gains.
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

