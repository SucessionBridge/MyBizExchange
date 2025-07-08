"use client";

import { useState } from "react";

export default function DealBuilderForm() {
  const [valuation, setValuation] = useState(400000);
  const [jobRevenue, setJobRevenue] = useState(50000);
  const [jobCost, setJobCost] = useState(10000);
  const [buyerSplit, setBuyerSplit] = useState(33);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setSummary("");

    try {
      const response = await fetch("/api/generate-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valuation,
          jobRevenue,
          jobCost,
          buyerSplit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.summary);
    } catch (err) {
      console.error("Error generating deal:", err);
      setError("❌ Failed to generate deal summary. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4 rounded-xl shadow bg-white">
      <h2 className="text-xl font-bold mb-4">AI-Powered Deal Builder</h2>

      <div className="space-y-4">
        <input
          type="number"
          value={valuation}
          onChange={(e) => setValuation(Number(e.target.value))}
          placeholder="Business Valuation ($)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="number"
          value={jobRevenue}
          onChange={(e) => setJobRevenue(Number(e.target.value))}
          placeholder="Example Job Revenue ($)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="number"
          value={jobCost}
          onChange={(e) => setJobCost(Number(e.target.value))}
          placeholder="Example Job Cost ($)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="number"
          value={buyerSplit}
          onChange={(e) => setBuyerSplit(Number(e.target.value))}
          placeholder="Buyer Profit Split (%)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />

        <button
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg w-full"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Deal Summary with AI"}
        </button>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {summary && (
          <textarea
            readOnly
            value={summary}
            rows={10}
            className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg"
          />
        )}
      </div>
    </div>
  );
}



