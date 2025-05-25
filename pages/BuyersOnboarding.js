import { useState } from "react";

export default function BuyerOnboarding() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    financingType: "rent-to-own",
    location: "",
    experience: 3, // Default value for experience on a scale of 1-5
    industryPreference: "", // Industry preference text input
    capitalInvestment: "",
    shortIntroduction: "",
    priorIndustryExperience: "No", // Yes/No
    willingToRelocate: "No", // Yes/No
  });

  const [errorMessage, setErrorMessage] = useState(""); // For any validation errors

  // Handle changes to form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.location) {
      setErrorMessage("Please fill in all the required fields.");
      return false;
    }
    setErrorMessage(""); // Clear error if validation passes
    return true;
  };

  // Handle form submission (without Supabase for now)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the form
    if (!validateForm()) return;

    // Just log form data for now (without Supabase)
    console.log("Form data submitted:", formData);

    // If you had Supabase, you would insert data here, but we'll skip that for now.
    alert("Buyer profile submitted (but no database connection for now).");

    // Reset form data
    setFormData({
      name: "",
      email: "",
      financingType: "rent-to-own",
      location: "",
      experience: 3, // Default value
      industryPreference: "",
      capitalInvestment: "",
      shortIntroduction: "",
      priorIndustryExperience: "No", // Default
      willingToRelocate: "No", // Default
    });
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Buyer Onboarding</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <input
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-xl"
            required
          />
          
          {/* Email */}
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-xl"
            required
          />

          {/* Financing Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Preferred Financing Option:</label>
            <select
              name="financingType"
              value={formData.financingType}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl"
            >
              <option value="rent-to-own">Rent-to-Own</option>
              <option value="seller-financing">Seller Financing</option>
              <option value="third-party">3rd-Party Financing</option>
            </select>
          </div>

          {/* Experience in Business Ownership (Scale 1-5) */}
          <div>
            <label className="block text-sm font-medium mb-2">Experience in Business Ownership (Scale 1-5):</label>
            <input
              type="number"
              name="experience"
              min="1"
              max="5"
              value={formData.experience}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl"
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
              className="w-full border border-gray-300 p-3 rounded-xl"
              placeholder="Industry you are interested in"
            />
          </div>

          {/* Capital Investment */}
          <div>
            <label className="block text-sm font-medium mb-2">Available Capital:</label>
            <input
              type="number"
              name="capitalInvestment"
              value={formData.capitalInvestment}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              <em>No one will see this publicly. Used for matching purposes only.</em>
            </p>
          </div>

          {/* Short Introduction */}
          <div>
            <label className="block text-sm font-medium mb-2">Short Introduction:</label>
            <textarea
              name="shortIntroduction"
              value={formData.shortIntroduction}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl"
              placeholder="Tell us a bit about yourself."
              rows="4"
            />
          </div>

          {/* Prior Industry Experience */}
          <div>
            <label className="block text-sm font-medium mb-2">Do you have prior industry experience?</label>
            <select
              name="priorIndustryExperience"
              value={formData.priorIndustryExperience}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {/* Willing to Relocate */}
          <div>
            <label className="block text-sm font-medium mb-2">Willing to Relocate?</label>
            <select
              name="willingToRelocate"
              value={formData.willingToRelocate}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold"
          >
            Submit Buyer Profile
          </button>
        </form>
      </div>
    </main>
  );
}
