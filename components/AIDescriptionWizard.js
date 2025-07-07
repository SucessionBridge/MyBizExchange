// components/AIDescriptionWizard.js

import React, { useState } from "react";

export default function AIDescriptionWizard({
  uploadedImages,
  sellerInfo = {},
  onComplete,
  onBackToManual
}) {
  const questions = [
    {
      key: "sentenceSummary",
      question: "How would you describe your business in one sentence to a stranger?",
      placeholder: "It’s a cozy wine shop that’s been part of our main street for over 30 years."
    },
    {
      key: "customers",
      question: "What kind of customers do you typically serve?",
      placeholder: "Mostly locals, plus some tourists in the summer."
    },
    {
      key: "bestSellers",
      question: "What are your best-selling products or services?",
      placeholder: "Red wines from small Canadian vineyards and monthly wine subscriptions."
    },
    {
      key: "customerLove",
      question: "What’s something your regulars love about your business?",
      placeholder: "Our knowledgeable staff and personal recommendations."
    },
    {
      key: "repeatCustomers",
      question: "Do you have loyal or repeat customers? How often do they return?",
      placeholder: "Some come in every week for their usual bottle. We know most by name."
    },
    {
      key: "keepsThemComing",
      question: "What do you think keeps people coming back?",
      placeholder: "We’ve built trust over the years — it feels like a community shop."
    },
    {
      key: "ownerInvolvement",
      question: "How involved are you in daily operations?",
      placeholder: "I’m there 3 days a week. Staff handle the rest."
    },
    {
      key: "opportunity",
      question: "What would make this a great opportunity for a new owner?",
      placeholder: "They’re buying a respected name with decades of goodwill."
    },
    {
      key: "proudOf",
      question: "What’s something you’re proud of about the business?",
      placeholder: "We survived COVID by pivoting to delivery — our customers stood by us."
    },
    {
      key: "adviceToBuyer",
      question: "If someone were taking over tomorrow, what would you tell them?",
      placeholder: "Treat the regulars like family. That’s what built this place."
    }
  ];

  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiText, setAiText] = useState("");

  const handleChange = (e) => {
    setAnswers({ ...answers, [questions[step].key]: e.target.value });
  };

  const nextStep = async () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      await generateDescription();
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const generateDescription = async () => {
    setLoading(true);
    setError("");
    setAiText("");

    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...answers,
          ...sellerInfo
        })
      });

      const data = await response.json();
      if (response.ok && data.description) {
        setAiText(data.description);
      } else {
        throw new Error(data.error || "Failed to generate description.");
      }
    } catch (err) {
      console.error("AI error:", err);
      setError("There was a problem generating the description. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-blue-600 py-8">
        Generating your AI business description...
      </div>
    );
  }

  if (aiText) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-center">AI-Generated Business Description</h2>
        <p className="border p-4 rounded bg-gray-50 text-gray-800 whitespace-pre-wrap">
          {aiText}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onComplete(aiText)}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            ✅ Use this version
          </button>
          <button
            onClick={generateDescription}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            🔄 Try Again
          </button>
          <button
            onClick={onBackToManual}
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400"
          >
            ✍️ Write My Own Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-md">
      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

      <label className="block mb-2 font-medium">{questions[step].question}</label>
      <textarea
        rows={4}
        placeholder={questions[step].placeholder}
        value={answers[questions[step].key] || ""}
        onChange={handleChange}
        className="w-full border p-3 rounded-md"
      />

      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          disabled={step === 0}
          className={`px-4 py-2 rounded ${
            step === 0 ? "bg-gray-300" : "bg-gray-500 text-white hover:bg-gray-600"
          }`}
        >
          Back
        </button>

        <button
          onClick={nextStep}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {step === questions.length - 1 ? "Finish" : "Next"}
        </button>
      </div>

      {uploadedImages?.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Your Uploaded Images</h3>
          <div className="grid grid-cols-3 gap-2">
            {uploadedImages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Preview ${i + 1}`}
                className="rounded w-full h-24 object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
