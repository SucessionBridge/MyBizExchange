import { useState, useEffect } from "react";

export default function BusinessValuation() {
  const [formData, setFormData] = useState({
    businessName: "",
    annualRevenue: "",
    annualProfit: "",
    inventoryValue: "",
    capitalInvestment: "",
    industryPreference: "",
    location: "",
  });

  const [valuation, setValuation] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle changes to form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Business Valuation Calculation
  const calculateBusinessValue = () => {
    const { annualProfit, inventoryValue, capitalInvestment, industryPreference } = formData;

    let industryMultiplier = 2; // Default multiplier for small businesses
    if (industryPreference === "tech") {
      industryMultiplier = 5; // Tech businesses typically have higher multiples
    }

    let estimatedValue = annualProfit * industryMultiplier;

    if (inventoryValue) {
      estimatedValue += inventoryValue * 0.10; // Add 10% of inventory value
    }

    if (capitalInvestment) {
      estimatedValue += capitalInvestment * 0.05; // Add 5% of capital investment
    }

    return estimatedValue;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the form
    if (!formData.businessName || !formData.annualProfit || !formData.location) {
      setErrorMessage("Please fill in all the required fields.");
      return;
    }

    setErrorMessage(""); // Clear error if validation passes
    setLoading(true); // Show loading indicator while calculating

    // Calculate business valuation
    const estimatedValue = calculateBusinessValue();
    setValuation(estimatedValue);

    setLoading(false); // Hide loading indicator after calculation

    // Scroll to the result
    window.scrollTo({
      top: document.getElementById("valuation-result").offsetTop,
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Disclaimer and Heading */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold mb-4">AI-Driven Business Valuation Tool</h2>
          <p className="text-lg mb-6">
            This AI-powered tool provides an estimated value of your business based on the information provided.
            Please note that the accuracy of the valuation is dependent on the details you input. The more accurate your
            information, the better the estimate.
          </p>
        </div>

        {/* Valuation Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Business Name:</label>
            <input
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your business name"
              required
            />
          </div>

          {/* Annual Revenue */}
          <div>
            <label className="block text-sm font-medium mb-2">Annual Revenue:</label>
            <input
              type="number"
              name="annualRevenue"
              value={formData.annualRevenue}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your annual revenue"
              required
            />
          </div>

          {/* Annual Profit */}
          <div>
            <label className="block text-sm font-medium mb-2">Annual Profit (EBITDA):</label>
            <input
              type="number"
              name="annualProfit"
              value={formData.annualProfit}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your annual profit"
              required
            />
          </div>

          {/* Inventory Value */}
          <div>
            <label className="block text-sm font-medium mb-2">Inventory Value:</label>
            <input
              type="number"
              name="inventoryValue"
              value={formData.inventoryValue}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the value of your inventory"
            />
          </div>

          {/* Capital Investment */}
          <div>
            <label className="block text-sm font-medium mb-2">Capital Investment:</label>
            <input
              type="number"
              name="capitalInvestment"
              value={formData.capitalInvestment}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your capital investment"
            />
          </div>

          {/* Industry Preference */}
          <div>
            <label className="block text-sm font-medium mb-2">Industry Preference:</label>
            <input
              name="industryPreference"
              value={formData.industryPreference}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your industry (e.g., Tech, Retail)"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">Business Location:</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the business location"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold"
          >
            Get My Business Valuation
          </button>
        </form>

        {/* Valuation Result */}
        <div id="valuation-result" className="mt-8 text-center">
          {valuation && (
            <>
              <h3 className="text-2xl font-semibold mb-4">Estimated Business Value</h3>
              <p className="text-xl">
                Based on the information provided, your business is estimated to be worth:
              </p>
              <p className="text-3xl font-bold text-blue-600">${valuation.toFixed(2)}</p>
            </>
          )}

          {/* Loading Indicator */}
          {loading && <p className="text-lg text-blue-600">Calculating your valuation...</p>}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-8 text-center text-red-600">
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </main>
  );
}

