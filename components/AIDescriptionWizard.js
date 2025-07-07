import React, { useEffect, useState } from "react";

export default function AIDescriptionWizard({ uploadedImages, sellerInfo, onComplete, onBackToManual }) {
  const [loading, setLoading] = useState(true);
  const [aiText, setAiText] = useState("");
  const [error, setError] = useState("");

  const fetchAIDescription = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sellerInfo),
      });

      const data = await response.json();
      if (response.ok && data.description) {
        setAiText(data.description);
      } else {
        setError(data.error || "Failed to generate description.");
      }
    } catch (err) {
      console.error("AI fetch error:", err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIDescription();
  }, []);

  if (loading) return <p className="text-center text-blue-600">Generating your business description...</p>;

  if (error) {
    return (
      <div className="text-center text-red-600">
        <p>{error}</p>
        <button
          onClick={fetchAIDescription}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

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
          onClick={fetchAIDescription}
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
