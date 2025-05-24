import { supabase } from '../lib/supabaseClient'
import React, { useState } from "react";

export default function SellerOnboarding() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    industry: "",
    location: "",
    financingType: "rent-to-own",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, businessName, industry, location, financingType } = formData;

    const { data, error } = await supabase.from('sellers').insert([
      {
        name,
        email,
        business_name: businessName,
        industry,
        location,
        financing_type: financingType,
      },
    ]);

    if (error) {
      console.error("❌ Error submitting form:", error);
      alert("There was a problem submitting your form.");
    } else {
      console.log("✅ Submitted:", data);
      alert("Your listing was submitted successfully!");

      setFormData({
        name: "",
        email: "",
        businessName: "",
        industry: "",
        location: "",
        financingType: "rent-to-own",
      });
    }
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="industry" placeholder="Industry" value={formData.industry} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl" required />
          <div>
            <label className="block text-sm font-medium mb-2">Preferred Financing Option:</label>
            <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-xl">
              <option value="rent-to-own">Rent-to-Own</option>
              <option value="seller-financing">Seller Financing</option>
              <option value="third-party">3rd-Party Financing</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-lg font-semibold">Submit Listing</button>
        </form>
      </div>
    </main>
  );
}
