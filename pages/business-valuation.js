import { useState } from "react";

export default function BusinessValuation() {
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    location: "",
    revenue: "",
    profit: "",
  });

  const [valuation, setValuation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission to get the valuation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate an AI-powered valuation process (Replace with real AI logic later)
    try {
      const response = await fetch("/api/valuation", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setValuation(data.valuation);
      } else {
        throw new Error(data.message || "Failed to get valuation.");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-blue-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">
          Business Valuation Tool
        </h1>
        <p className="text-lg mb-6 text-center text-yellow-200">
          Enter your business details to get an instant valuation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Name */}
          <input
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="Business Name"
            className="w-full border border-gray-300 p-3 rounded-xl"
            required
          />

          {/* Industry */}
          <input
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            placeholder="Industry"
            className="w-full border border-gray-300 p-3 rounded-xl"
            required
          />

          {/* Location */}
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location"
            className="w-full border border-gray-300 p-3 rounded-xl"
            required
          />

          {/* Revenue */}
          <input
            type="number"
            name="revenue"
            value={formData.revenue}
            onChange={handleChange}
            placeholder="Annual Revenue"
            className="w-full border border-gray-300 p-3 rounded-xl"
            required
          />

          {/* Profit */}
          <input
            type="number"
            name="profit"
            value={formData.profit}
            onChange={handleChange}
            placeholder="Annual Profit"
            className="w-full border border-gray-300 p-3 rounded-xl"
            required
          />

          {/* Submit Button */}
          <div className="flex justify-center mb-8">
            <button
              type="submit"
              className="bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 text-lg font-semibold transition-all duration-300"
            >
              Get Your Business Valuation
            </button>
          </div>
        </form>

        {loading && (
          <div className="text-center text-yellow-200">Loading valuation...</div>
        )}

        {error && (
          <div className="text-center text-red-500">{error}</div>
        )}

        {valuation && (
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Your Estimated Business Valuation</h2>
            <p className="text-lg mb-6">
              Based on the information you provided, your business is worth approximately:
            </p>
            <div className="text-xl font-bold text-green-500">{valuation}</div>
          </div>
        )}
      </div>
    </main>
  );
}
