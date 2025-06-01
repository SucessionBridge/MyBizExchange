import { useState } from 'react';

export default function ScorecardPage() {
  const [formData, setFormData] = useState({
    email: '',
    ageOfBusiness: '',
    revenue: '',
    profitability: '',
    hasSystems: '',
    hasTeam: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Supabase logic will go here
    alert("Submitted! We'll send your score via email.");
  };

  return (
    <div className="min-h-screen bg-white px-4 py-12 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Sellability Scorecard
      </h1>
      <p className="text-center text-gray-600 mb-8">
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
              value={formData[q.name as keyof typeof formData]}
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
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-md font-semibold"
        >
          Get My Sellability Score
        </button>
      </form>
    </div>
  );
}
