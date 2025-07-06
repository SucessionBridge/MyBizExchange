// components/AIDescriptionWizard.js
import React, { useState } from 'react';

export default function AIDescriptionWizard({ onBack, onComplete }) {
  const [answers, setAnswers] = useState({
    industry: '',
    customers: '',
    whatItDoes: '',
    whySelling: '',
    uniqueEdge: '',
    yearsInBusiness: '',
    employeeCount: '',
    website: '',
    annualRevenue: '',
    annualProfit: '',
    includesEquipment: 'No',
    includesProperty: 'No',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Error generating description');
      }
      onComplete(data.description);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Optional: Improve Your Listing with AI</h2>
      <p className="text-sm text-gray-600 mb-4">Answer a few short questions. We'll generate a clean paragraph for your listing.</p>

      <div className="space-y-3">
        <input name="industry" placeholder="Industry" value={answers.industry} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="customers" placeholder="Who are your typical customers?" value={answers.customers} onChange={handleChange} className="w-full p-2 border rounded" />
        <textarea name="whatItDoes" placeholder="What does the business do?" value={answers.whatItDoes} onChange={handleChange} rows={2} className="w-full p-2 border rounded" />
        <input name="uniqueEdge" placeholder="What makes this business unique?" value={answers.uniqueEdge} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="whySelling" placeholder="Why are you selling?" value={answers.whySelling} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="yearsInBusiness" placeholder="Years in Business" value={answers.yearsInBusiness} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="employeeCount" placeholder="Number of Employees" value={answers.employeeCount} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="website" placeholder="Website (if any)" value={answers.website} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="annualRevenue" placeholder="Annual Revenue" value={answers.annualRevenue} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="annualProfit" placeholder="Annual Profit" value={answers.annualProfit} onChange={handleChange} className="w-full p-2 border rounded" />
        <select name="includesEquipment" value={answers.includesEquipment} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="No">Includes Equipment?</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
        <select name="includesProperty" value={answers.includesProperty} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="No">Includes Property?</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      {error && <p className="text-red-500 mt-3">{error}</p>}

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Back</button>
        <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {loading ? 'Generating...' : 'Generate Description'}
        </button>
      </div>
    </div>
  );
}
