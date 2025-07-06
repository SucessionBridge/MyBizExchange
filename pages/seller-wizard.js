// pages/seller-wizard.js
import React, { useState } from "react";

export default function SellerWizard() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    businessType: "",
    customerType: "",
    yearsInBusiness: "",
    numEmployees: "",
    hasWebsite: "",
    websiteURL: "",
    reasonForSelling: "",
    growthOpportunities: "",
    sellerInvolvement: "",
    keyAssets: "",
    profitDriver: ""
  });

  const handleChange = (field, value) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const next = () => setStep((prev) => Math.min(prev + 1, questions.length + 1));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  const questions = [
    {
      label: "What type of business do you operate?",
      field: "businessType",
      placeholder: "e.g. landscaping, bakery, IT services"
    },
    {
      label: "Who are your main customers?",
      field: "customerType",
      placeholder: "e.g. homeowners, businesses, government"
    },
    {
      label: "How many years have you been in business?",
      field: "yearsInBusiness",
      placeholder: "e.g. 12"
    },
    {
      label: "How many employees do you have (if any)?",
      field: "numEmployees",
      placeholder: "e.g. 5 full-time, 2 part-time"
    },
    {
      label: "Do you have a website?",
      field: "hasWebsite",
      placeholder: "Yes or No"
    },
    {
      label: "If yes, what is the website URL?",
      field: "websiteURL",
      placeholder: "e.g. https://mybusiness.com"
    },
    {
      label: "Why are you selling the business?",
      field: "reasonForSelling",
      placeholder: "e.g. retirement, health, new opportunity"
    },
    {
      label: "What growth opportunities exist for a new owner?",
      field: "growthOpportunities",
      placeholder: "e.g. Expand to new markets, hire sales team"
    },
    {
      label: "What is your involvement in daily operations?",
      field: "sellerInvolvement",
      placeholder: "e.g. I manage staff and bookkeeping"
    },
    {
      label: "What are the key assets included (equipment, inventory, etc)?",
      field: "keyAssets",
      placeholder: "e.g. 2 trucks, mower, CRM system"
    },
    {
      label: "What drives most of your business profit?",
      field: "profitDriver",
      placeholder: "e.g. Long-term contracts, seasonal sales"
    }
  ];

  const isFinalStep = step > questions.length;
  const current = questions[step - 1];

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Seller Wizard</h1>

      {!isFinalStep ? (
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="text-gray-600 text-sm mb-2">Step {step} of {questions.length}</div>
          <label className="block mb-2 font-semibold text-lg">{current.label}</label>
          <input
            className="border border-gray-300 p-3 rounded w-full mb-6"
            value={answers[current.field]}
            onChange={(e) => handleChange(current.field, e.target.value)}
            placeholder={current.placeholder}
          />

          <div className="flex justify-between">
            <button
              onClick={back}
              disabled={step === 1}
              className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={next}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Review Your Answers</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(answers).map(([key, value]) => (
              <li key={key}><strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</strong> {value}</li>
            ))}
          </ul>

          <div className="mt-6">
            <button
              onClick={() => alert("AI listing generation will happen here")}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Generate AI Listing
            </button>
            <button
              onClick={() => setStep(1)}
              className="ml-4 text-sm text-blue-600 underline"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
