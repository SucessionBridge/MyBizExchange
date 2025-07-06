import React, { useState } from "react";

export default function AIDescriptionWizard({ onComplete, uploadedImages = [] }) {
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

  const handleChange = (e) => {
    setAnswers({ ...answers, [questions[step].key]: e.target.value });
  };

  const nextStep = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(answers);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">AI Listing Enhancer</h2>

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
          className={`px-4 py-2 rounded ${step === 0 ? 'bg-gray-300' : 'bg-gray-500 text-white hover:bg-gray-600'}`}
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
              <img key={i} src={url} alt={`Preview ${i + 1}`} className="rounded w-full h-24 object-cover" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

