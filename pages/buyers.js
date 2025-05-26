
           import { supabase } from '../lib/supabaseClient';
import React, { useState } from "react";

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
    city: "", // Add city field
    stateOrProvince: "", // Add state or province field
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
    if (!formData.name || !formData.email || !formData.location || !formData.city || !formData.stateOrProvince) {
      setErrorMessage("Please fill in all the required fields.");
      return false;
    }
    setErrorMessage(""); // Clear error if validation passes
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the form
    if (!validateForm()) return;

    // Send form data to Supabase for storage
    const { name, email, financingType, location, experience, industryPreference, capitalInvestment, shortIntroduction, priorIndustryExperience, willingToRelocate, city, stateOrProvince } = formData;

    const { data, error } = await supabase.from('buyers').insert([
      {
        name,
        email,
        financing_type: financingType,
        location,
        experience,
        industry_preference: industryPreference,
        capital_investment: capitalInvestment,
        short_introduction: shortIntroduction,
        prior_industry_experience: priorIndustryExperience,
        willing_to_relocate: willingToRelocate,
        city, // Save city data
        state_or_province: stateOrProvince, // Save state/province data
      },
    ]);

    if (error) {
      console.error("❌ Error submitting form:", error);
      alert("There was a problem submitting your form.");
    } else {
      console.log("✅ Submitted:", data);
      alert("Your buyer profile was submitted successfully!");

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
        city: "", // Reset city
        stateOrProvince: "", // Reset state/province
      });
    }
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

          {/* City */}
          <div>
            <label className="block text-sm font-medium mb-2">City:</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl"
              placeholder="Enter your city"
            />
          </div>

          {/* State or Province */}
          <div>
            <label className="block text-sm font-medium mb-2">State/Province:</label>
            <input
              name="stateOrProvince"
              value={formData.stateOrProvince}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl"
              placeholder="Enter your state or province"
            />
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
