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

  const [isLoading, setIsLoading] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const next = () => setStep(step + 1);
  const back = () => setStep(step - 1);

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

  const generateDescription = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          industry: answers.businessType,
          customers: answers.customerType,
          whatItDoes: answers.profitDriver,
          whySelling: answers.reasonForSelling,
          uniqueEdge: answers.growthOpportunities
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "API Error");

      setGeneratedDescription(data.description);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Seller Wizard</h1>

      {!isFinalStep ? (
        <div>
          <label className="block mb-2 font-semibold">{current.label}</label>
          <input
            className="border p-3 rounded w-full mb-6"
            value={answers[current.field]}
            onChange={(e) => handleChange(current.field, e.target.value)}
            placeholder={current.placeholder}
          />

          <div className="flex justify-between">
            {step > 1 ? (
              <button
                onClick={back}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Back
              </button>
            ) : <span></span>}

            <button
              onClick={next}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Review Your Answers</h2>
          <ul className="space-y-2">
            {Object.entries(answers).map(([key, value]) => (
              <li key={key}><strong>{key}:</strong> {value}</li>
            ))}
          </ul>

          <div className="mt-6">
            <button
              onClick={generateDescription}
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded"
            >
              {isLoading ? "Generating..." : "Generate Listing with AI"}
            </button>
          </div>

          {error && (
            <p className="text-red-600 mt-4">{error}</p>
          )}

          {generatedDescription && (
            <div className="mt-6 bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">AI-Generated Description</h3>
              <p>{generatedDescription}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
