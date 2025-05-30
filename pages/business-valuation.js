import { useState } from "react";
import Link from "next/link";

export default function BusinessValuation() {
  const [formData, setFormData] = useState({
    businessName: "",
    annualRevenue: "",
    annualProfit: "",
    inventoryValue: "",
    capitalInvestment: "",
    industryPreference: "", // New field for industry
    location: "", // New field for location
    equipmentValue: "", // New field for equipment (mowers, forklifts, etc.)
    performanceBasedDeal: false, // New field for performance-based deal
    revenuePercentage: "", // Seller percentage of revenue for performance-based deal
    annualSales: "", // New field for annual sales
  });

  const [valuation, setValuation] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle changes to form fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Business Valuation Calculation
  const calculateBusinessValue = () => {
    const {
      annualProfit,
      inventoryValue,
      capitalInvestment,
      industryPreference,
      equipmentValue,
      performanceBasedDeal,
      revenuePercentage,
      annualSales,
    } = formData;

    // Set industry multipliers based on the business type
    let industryMultiplier = 2; // Default multiplier for small businesses
    if (industryPreference === "tech") {
      industryMultiplier = 5; // Higher multiple for tech businesses
    }

    let estimatedValue = annualProfit * industryMultiplier;

    // Add inventory value if provided
    if (inventoryValue) {
      estimatedValue += inventoryValue * 0.10; // Add 10% of inventory value
    }

    // Add capital investment if provided
    if (capitalInvestment) {
      estimatedValue += capitalInvestment * 0.05; // Add 5% of capital investment
    }

    // Include equipment value (mowers, forklifts, etc.) if provided
    if (equipmentValue) {
      estimatedValue += parseFloat(equipmentValue);
    }

    // Include annual sales if provided (especially relevant for stores or retail)
    if (annualSales) {
      estimatedValue += annualSales * 0.02; // Add 2% of annual sales to value
    }

    // Adjust valuation if performance-based deal
    if (performanceBasedDeal && revenuePercentage) {
      estimatedValue -= estimatedValue * (revenuePercentage / 100); // Reduce by the agreed revenue share percentage
    }

    return estimatedValue;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate the form
    if (!formData.businessName || !formData.annualProfit || !formData.location) {
      setErrorMessage("Please fill in all the required fields.");
      return;
    }

    setErrorMessage(""); // Clear error if validation passes

    const estimatedValue = calculateBusinessValue();
    setValuation(estimatedValue);
  };

  return (
    <main className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold mb-4">AI-Driven Business Valuation Tool</h2>
          <p className="text-lg mb-6">
            This AI-powered tool provides an estimated value of your business based on the information provided.
            Please note that the accuracy of the valuation is dependent on the details you input. The more accurate your
            information, the better the estimate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Business Name:</label>
            <input
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Enter your business name"
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
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Enter your annual profit"
              required
            />
          </div>

          {/* Industry Preference */}
          <div>
            <label className="block text-sm font-medium mb-2">Industry Preference:</label>
            <input
              name="industryPreference"
              value={formData.industryPreference}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Enter your industry (e.g., Tech, Retail, Landscaping)"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">Business Location:</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Enter the business location"
              required
            />
          </div>

          {/* Equipment Value */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Equipment Value (e.g., Mowers if you are in landscaping, Forklifts if you are in manufacturing):
            </label>
            <input
              type="number"
              name="equipmentValue"
              value={formData.equipmentValue}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Enter the value of your equipment (mowers, forklifts, etc.)"
            />
          </div>

          {/* Annual Sales */}
          <div>
            <label className="block text-sm font-medium mb-2">Annual Sales:</label>
            <input
              type="number"
              name="annualSales"
              value={formData.annualSales}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Enter your annual sales (for retail businesses)"
            />
          </div>

          {/* Performance-Based Deal */}
          <div>
            <label className="block text-sm font-medium mb-2">Performance-Based Deal?</label>
            <input
              type="checkbox"
              name="performanceBasedDeal"
              checked={formData.performanceBasedDeal}
              onChange={handleChange}
              className="mr-2"
            />
            <span>Yes, I want to offer performance-based payment (revenue share).</span>
          </div>

          {/* Revenue Share Percentage (appears only if Performance-Based Deal is checked) */}
          {formData.performanceBasedDeal && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Revenue Share Percentage:
                <span className="text-xs text-gray-500"> (e.g., You keep 85%, and the buyer gets 15% of the revenue for the first season.)</span>
              </label>
              <input
                type="number"
                name="revenuePercentage"
                value={formData.revenuePercentage}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl text-black"
                placeholder="Enter percentage of revenue to share"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold"
          >
            Get My Business Valuation
          </button>
        </form>

        {/* Valuation Result */}
        {valuation && (
          <div className="mt-8 text-center">
            <h3 className="text-2xl font-semibold mb-4">Estimated Business Value</h3>
            <p className="text-xl">
              Based on the information provided, your business is estimated to be worth:
            </p>
            <p className="text-3xl font-bold text-blue-600">${valuation.toFixed(2)}</p>
          </div>
        )}
      </div>
    </main>
  );
}
