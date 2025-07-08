"use client";

import { useState } from "react";

export default function DealBuilderForm({ buyerId }) {
  const [valuation, setValuation] = useState(400000);
  const [jobRevenue, setJobRevenue] = useState(50000);
  const [jobCost, setJobCost] = useState(10000);
  const [buyerSplit, setBuyerSplit] = useState(33);
  const [summary, setSummary] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSummary = () => {
    const profit = jobRevenue - jobCost;
    const buyerProfit = (profit * buyerSplit) / 100;
    const sellerProfit = profit - buyerProfit;

    const text = `Under this proposal, the seller will retain ownership and continue receiving client payments directly. For each project, such as a $${jobRevenue.toLocaleString()} foundation repair job with $${jobCost.toLocaleString()} in costs, the resulting $${profit.toLocaleString()} profit will be split. The buyer will be paid $${buyerProfit.toLocaleString()} (or ${buyerSplit}%) as a subcontractor, and $${sellerProfit.toLocaleString()} (or ${100 - buyerSplit}%) will be credited toward the agreed business purchase price of $${valuation.toLocaleString()}. Ownership will transfer once the full amount has been repaid.`;

    setSummary(text);
  };

  const generateAISummary = async () => {
    setLoading(true);
    setAiSummary("");
    try {
      const res = await fetch("/api/generate-deal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ valuation, jobRevenue, jobCost, buyerSplit }),
      });

      const data = await res.json();
      setAiSummary(data.summary);
    } catch (err) {
      setAiSummary("Error generating AI summary.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">Deal Builder: Subcontractor-Style</h2>

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

        <div className="flex gap-4">
          <button
            onClick={generateSummary}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
          >
            Quick Summary
          </button>
          <button
            onClick={generateAISummary}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg"
          >
            {loading ? "Generating..." : "AI Summary"}
          </button>
        </div>

        {summary && (
          <div>
            <h3 className="mt-4 font-semibold">Quick Summary:</h3>
            <textarea
              readOnly
              value={summary}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {aiSummary && (
          <div>
            <h3 className="mt-4 font-semibold">AI-Generated Summary:</h3>
            <textarea
              readOnly
              value={aiSummary}
              rows={6}
              className="w-full px-4 py-2 border border-purple-400 rounded-lg bg-purple-50"
            />
          </div>
        )}
      </div>
    </div>
  );
}

