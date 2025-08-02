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
    returnCustomers: '',
    contractsValue: '',
    sellerFinancing: 'maybe'
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

  const formatCurrency = (num) => {
    if (!num || isNaN(num)) return '$0';
    return `$${parseFloat(num).toLocaleString()}`;
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
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SuccessionBridge Business Valuation', 20, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const disclaimer = doc.splitTextToSize(
      'Disclaimer: This valuation is a simple tool to help business owners get a general sense of what their business may be worth. It should not be used for investment, loan, or legal decisions.',
      170
    );
    doc.text(disclaimer, 20, 30);

    let y = 50;

    const addLine = (label, value) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'bold');
      doc.text(value || 'N/A', 90, y);
      y += 8;
    };

    const addSection = (title) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, 20, y);
      y += 6;
      doc.setLineWidth(0.3);
      doc.line(20, y, 190, y);
      y += 8;
    };

    addSection('Business Information');
    addLine('Business Name:', formData.businessName);
    addLine('Years in Business:', formData.yearsInBusiness);
    addLine('Email:', formData.email);
    addLine('Industry:', formData.industry);

    addSection('Financials');
    addLine('Annual Revenue:', formatCurrency(formData.annualRevenue));
    addLine('Annual Expenses:', formatCurrency(formData.annualExpenses));
    addLine('Total Salaries Paid:', formatCurrency(formData.totalSalariesPaid));
    addLine('Owner Salary Add-Back:', formatCurrency(formData.ownerSalaryAddBack));
    addLine('Personal Add-Backs:', formatCurrency(formData.personalAddBacks));
    addLine('Employees:', formData.hasEmployees === 'yes' ? 'Yes' : 'No');
    addLine('Real Estate Value:', formatCurrency(formData.realEstateValue));

    addSection('Equipment');
    if (formData.equipment.every(eq => !eq.name)) {
      addLine('(None listed)', '');
    } else {
      formData.equipment.forEach(eq => {
        addLine(eq.name || '-', formatCurrency(eq.value));
      });
    }

    addSection('Additional Notes');
    addLine('Return Customers %:', formData.returnCustomers);
    addLine('Contracts in Place:', formData.contractsValue);
    addLine('Seller Financing Willingness:', formData.sellerFinancing);

    addSection('Estimated Valuation');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(formatCurrency(calculateValuation().toFixed(2)), 20, y);
    y += 16;

    addSection('Seller Financing Advantage');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const sellerText1 = doc.splitTextToSize(
      'Offering seller financing under your own terms can increase your total payout while making your business more attractive to buyers.',
      170
    );
    doc.text(sellerText1, 20, y);
    y += sellerText1.length * 6 + 4;

    const sellerText2 = doc.splitTextToSize(
      'For example: Financing $250K over 4 years at 6% interest could add tens of thousands in interest income to your sale price.',
      170
    );
    doc.text(sellerText2, 20, y);
    y += sellerText2.length * 6 + 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Generated by SuccessionBridge Valuation Wizard', 20, 280);

    doc.save('valuation-report.pdf');
  };

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white shadow-md p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Valuation Wizard</h1>

        <p className="mb-4 text-sm text-gray-600">
          📌 This valuation is a simple tool to help business owners get a general sense of what their business may be worth. 
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
          <input name="ownerSalaryAddBack" placeholder="Owner’s Salary (only if already included above)" value={formData.ownerSalaryAddBack} onChange={handleChange} className="w-full border p-3 rounded" />
          <input name="personalAddBacks" placeholder="Add-backs (personal expenses, etc.)" value={formData.personalAddBacks} onChange={handleChange} className="w-full border p-3 rounded" />

          <label className="block font-medium">Does your business have employees?</label>
          <select name="hasEmployees" value={formData.hasEmployees} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="yes">Yes</option>
            <option value="no">No, I operate it alone</option>
          </select>

          <label className="block font-medium">List Equipment</label>
          {formData.equipment.map((eq, idx) => (
            <div key={idx} className="flex space-x-2 mb-2">
              <input placeholder="Equipment Name" value={eq.name} onChange={(e) => handleEquipmentChange(idx, 'name', e.target.value)} className="flex-1 border p-2 rounded" />
              <input placeholder="Value ($)" value={eq.value} onChange={(e) => handleEquipmentChange(idx, 'value', e.target.value)} className="w-32 border p-2 rounded" />
            </div>
          ))}
          <button onClick={addEquipment} className="text-blue-600 hover:underline">+ Add Equipment</button>

          <input name="realEstateValue" placeholder="Real Estate Value ($)" value={formData.realEstateValue} onChange={handleChange} className="w-full border p-3 rounded" />

          <label className="block font-medium">Percentage of Return Customers (%)</label>
          <input name="returnCustomers" placeholder="e.g. 70%" value={formData.returnCustomers} onChange={handleChange} className="w-full border p-3 rounded" />

          <label className="block font-medium">Contracts in Place (Estimated $ Value)</label>
          <input name="contractsValue" placeholder="e.g. $100,000" value={formData.contractsValue} onChange={handleChange} className="w-full border p-3 rounded" />

          <label className="block font-medium">Would you consider seller financing as part of your exit?</label>
          <select name="sellerFinancing" value={formData.sellerFinancing} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="yes">Yes</option>
            <option value="maybe">Maybe</option>
            <option value="no">No</option>
          </select>

          <div className="mt-6">
            <p className="text-xl font-semibold mb-2">Estimated Valuation: {formatCurrency(calculateValuation().toFixed(2))}</p>
            <p className="text-sm text-gray-600 mb-4">
              💡 Remember: The price you choose to sell your business is ultimately your decision. 
              Offering seller financing under your terms can increase your payout and reduce tax burdens 
              while attracting more buyers.
            </p>

            <button onClick={generatePDF} className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
              Download PDF Report
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

