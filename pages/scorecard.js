import { useState, useRef } from 'react';

export default function ScorecardPage() {
  const [formData, setFormData] = useState({
    email: '',
    industry: '',
    description: '',
    askingPrice: '',
    annualRevenue: '',
    annualProfit: '',
    ageOfBusiness: '',
    profitability: '',
    hasSystems: '',
    hasTeam: '',
    includedAssets: '',
  });

  const [score, setScore] = useState(null);
  const resultRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateScore = () => {
    const fields = ['profitability', 'hasSystems', 'hasTeam'];
    const values = fields.map((field) => parseInt(formData[field] || '0'));

    const age = parseInt(formData.ageOfBusiness || '0');
    let ageScore = 1;
    if (age >= 3 && age < 5) ageScore = 3;
    else if (age >= 5) ageScore = 5;

    const revenue = parseInt(formData.annualRevenue || '0');
    let revenueScore = 1;
    if (revenue >= 100000 && revenue < 300000) revenueScore = 3;
    else if (revenue >= 300000) revenueScore = 5;

    const asking = parseFloat(formData.askingPrice || '0');
    const profit = parseFloat(formData.annualProfit || '0');
    const hasAssetExplanation = formData.includedAssets && formData.includedAssets.length > 10;

    let priceToProfitScore = 3;
    if (asking > 0 && profit > 0) {
      const ratio = asking / profit;
      if (ratio <= 1.5) priceToProfitScore = 5;
      else if (ratio <= 2.5) priceToProfitScore = 3;
      else priceToProfitScore = hasAssetExplanation ? 3 : 1;
    }

    const total = values.reduce((acc, val) => acc + val, 0) + ageScore + revenueScore + priceToProfitScore;
    return (total / (values.length + 3) * 2).toFixed(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const calculated = calculateScore();
    setScore(calculated);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    alert(`Submitted! Your Sellability Score is ${calculated}/10. It will be emailed to you.`);
  };

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-blue-800 mb-6">Sellability Scorecard</h1>
      <p className="text-center text-gray-700 mb-8">
        Answer a few questions to get your Sellability Score. We’ll email the results with personalized tips.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Industry</label>
          <input type="text" name="industry" value={formData.industry} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Brief description of your business</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="4" required className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Asking Price</label>
          <small className="text-gray-500">What would you realistically expect to sell for? Many businesses sell for 2–3× annual profit.</small>
          <input type="number" name="askingPrice" value={formData.askingPrice} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">What’s included in your asking price?</label>
          <small className="text-gray-500">Optional: real estate, inventory, vehicles, equipment, trademarks, or digital assets.</small>
          <textarea name="includedAssets" value={formData.includedAssets} onChange={handleChange} rows="3" className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Annual Revenue</label>
          <input type="number" name="annualRevenue" value={formData.annualRevenue} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Annual Profit (or Seller Discretionary Earnings – SDE)</label>
          <input type="number" name="annualProfit" value={formData.annualProfit} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">How many years has your business been running?</label>
          <small className="text-gray-500">Buyers prefer businesses that are at least 2+ years old.</small>
          <input type="number" name="ageOfBusiness" value={formData.ageOfBusiness} onChange={handleChange} required min="0" className="mt-2 block w-full rounded-md border border-gray-300 p-2 shadow-sm" />
        </div>

        {[{
          label: 'Is your business consistently profitable?',
          name: 'profitability',
          help: 'Consistent profitability means your business brings in more than it spends — after paying you.',
        }, {
          label: 'Do you have documented systems/processes?',
          name: 'hasSystems',
          help: 'Example: checklists, SOPs, or videos for onboarding, fulfillment, etc.',
        }, {
          label: 'Do you have a team helping run the business?',
          name: 'hasTeam',
          help: 'A team (employees, VAs, or contractors) makes the business less owner-dependent.',
        }].map(({ label, name, help }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <small className="text-gray-500">{help}</small>
            <div className="flex gap-4 mt-2">
              <label><input type="radio" name={name} value="1" onChange={handleChange} /> No</label>
              <label><input type="radio" name={name} value="3" onChange={handleChange} /> Somewhat</label>
              <label><input type="radio" name={name} value="5" onChange={handleChange} /> Yes</label>
            </div>
          </div>
        ))}

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-semibold">
          Get My Sellability Score
        </button>
      </form>

      {score && (
        <div ref={resultRef} className="mt-8 bg-white shadow-md rounded-md p-6 text-center">
          <h2 className="text-xl font-bold text-blue-700 mb-2">Your Sellability Score</h2>
          <p className="text-3xl font-semibold text-green-700">{score} / 10</p>
          <p className="text-gray-600 mt-2">Check your inbox shortly for a full breakdown and next steps.</p>

          {formData.includedAssets && formData.includedAssets.length > 10 && (
            <div className="mt-4 text-sm text-gray-700">
              💡 Your asking price includes additional assets (e.g., property, inventory, or equipment). Buyers may evaluate your business ROI separately from these.
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600 bg-yellow-50 border border-yellow-300 rounded p-4">
            <strong>Disclaimer:</strong> Your score is based on general sellability factors. But every buyer is different — and timing matters. For example, a snow plow company might buy a grass-cutting route to keep their staff working in summer. The right buyer may already be looking.
          </div>
        </div>
      )}
    </div>
  );
}
