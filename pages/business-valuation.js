import { useState } from "react";

export default function BusinessValuation() {
  const [formData, setFormData] = useState({
    businessName: "",
    annualSales: "",
    annualProfit: "",
    inventoryValue: "",
    capitalInvestment: "",
    industryPreference: "",
    location: "",
    equipmentValue: "",
    assetValue: "",
    performanceBasedDeal: false,
    revenuePercentage: "",
  });

  const [valuation, setValuation] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const calculateBusinessValue = () => {
    const {
      annualProfit,
      inventoryValue,
      capitalInvestment,
      industryPreference,
      equipmentValue,
      assetValue,
      performanceBasedDeal,
      revenuePercentage,
      annualSales,
    } = formData;

    let industryMultiplier = 2;
    if (industryPreference.toLowerCase() === "tech") {
      industryMultiplier = 5;
    }

    let estimatedValue = parseFloat(annualProfit || 0) * industryMultiplier;

    estimatedValue += parseFloat(inventoryValue || 0) * 0.10;
    estimatedValue += parseFloat(capitalInvestment || 0) * 0.05;
    estimatedValue += parseFloat(equipmentValue || 0);
    estimatedValue += parseFloat(assetValue || 0);
    estimatedValue += parseFloat(annualSales || 0) * 0.02;

    if (performanceBasedDeal && revenuePercentage) {
      estimatedValue -= estimatedValue * (parseFloat(revenuePercentage || 0) / 100);
    }

    return estimatedValue;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.businessName || !formData.annualProfit || !formData.location) {
      setErrorMessage("Please fill in all the required fields.");
      return;
    }

    setErrorMessage("");
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
            The accuracy depends on the accuracy of your inputs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div>
            <label className="block text-sm font-medium mb-2">Annual Sales:</label>
            <input
              type="number"
              name="annualSales"
              value={formData.annualSales}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Total yearly sales (for stores or service businesses)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Annual Profit (EBITDA):</label>
            <input
              type="number"
              name="annualProfit"
              value={formData.annualProfit}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Net profit before taxes and owner's salary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Industry:</label>
            <input
              name="industryPreference"
              value={formData.industryPreference}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="e.g. Tech, Retail, Landscaping"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location:</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="City and Province/State"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Inventory Value:
            </label>
            <input
              type="number"
              name="inventoryValue"
              value={formData.inventoryValue}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Value of your inventory (e.g., goods in stock)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Equipment Value:
            </label>
            <input
              type="number"
              name="equipmentValue"
              value={formData.equipmentValue}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="e.g. mowers (landscaping), forklifts (manufacturing)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Capital Investment:
            </label>
            <input
              type="number"
              name="capitalInvestment"
              value={formData.capitalInvestment}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="e.g. renovations, expansions, major improvements"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Asset Value (e.g., food truck, building):
            </label>
            <input
              type="number"
              name="assetValue"
              value={formData.assetValue}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Current market value of major business-owned assets"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Performance-Based Deal</label>
            <p className="text-sm text-gray-600 mb-2 italic">
              A flexible structure where the buyer pays a percentage of future sales until the business value is paid off. 
              Example: The seller receives 10% of revenue until full value is paid, helping the buyer preserve cash flow.
            </p>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="performanceBasedDeal"
                checked={formData.performanceBasedDeal}
                onChange={handleChange}
                className="mr-2"
              />
              <span>Yes, offer performance-based payment (revenue share)</span>
            </div>
          </div>

          {formData.performanceBasedDeal && (
            <div>
              <label className="block text-sm font-medium mb-2">Revenue Share Percentage:</label>
              <input
                type="number"
                name="revenuePercentage"
                value={formData.revenuePercentage}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl text-black"
                placeholder="What % of sales the buyer will pay back to you"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold"
          >
            Get My Business Valuation
          </button>
        </form>

        {valuation && (
          <div className="mt-8 text-center">
            <h3 className="text-2xl font-semibold mb-4">Estimated Business Value</h3>
            <p className="text-xl">
              Based on the information provided, your business is estimated to be worth:
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2">${valuation.toFixed(2)}</p>
          </div>
        )}
      </div>
    </main>
  );
}
