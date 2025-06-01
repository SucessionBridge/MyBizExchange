import { useState } from 'react';

export default function ScorecardPage() {
  const [formData, setFormData] = useState({
    email: '',
    industry: '',
    description: '',
    askingPrice: '',
    ageOfBusiness: '',
    revenue: '',
    profitability: '',
    hasSystems: '',
    hasTeam: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert("Submitted! We'll send your score via email.");
  };

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-blue-800 mb-6">
        Sellability Scorecard
      </h1>
      <p className="text-center text-gray-700 mb-8">
        Answer a few quick questions to see how sellable your business is. Results will be emailed to you.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">What industry are you in?</label>
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Brief description of your business</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Asking price (optional)</label>
          <input
            type="number"
            name="askingPrice"
            value={formData.askingPrice}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
          />
        </div>

        {[
          { label: 'How many years has your business been running?', name: 'ageOfBusiness' },
          { label: 'Is your revenue over $100K/year?', name: 'revenue' },
          { label: 'Is your business profitable?', name: 'profitability' },
          { label: 'Do you have documented systems/processes?', name: 'hasSystems' },
          { label: 'Do you have a team (employees or contractors)?', name: 'hasTeam' },
        ].map((q) => (
          <div key={q.name}>
            <label className="block text-sm font-medium text-gray-700">{q.label}</label>
            <select
              name={q.name}
              value={formData[q.name]}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            >
              <option value="">Select an option</option>
              <option value="1">No</option>
              <option value="3">Somewhat</option>
              <option value="5">Yes</option>
            </select>
          </div>
        ))}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-semibold"
        >
          Get My Sellability Score
        </button>
      </form>
    </div>
  );
}
