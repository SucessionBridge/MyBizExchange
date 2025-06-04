"use client";

import { useState } from "react";

export default function DealBuilderForm({ buyerId }) {
  const [valuation, setValuation] = useState(400000);
  const [jobRevenue, setJobRevenue] = useState(50000);
  const [jobCost, setJobCost] = useState(10000);
  const [buyerSplit, setBuyerSplit] = useState(33);
  const [summary, setSummary] = useState("");

  const generateSummary = () => {
    const profit = jobRevenue - jobCost;
    const buyerProfit = (profit * buyerSplit) / 100;
    const sellerProfit = profit - buyerProfit;

    const text = `Under this proposal, the seller will retain ownership and continue receiving client payments directly. For each project, such as a $${jobRevenue.toLocaleString()} foundation repair job with $${jobCost.toLocaleString()} in costs, the resulting $${profit.toLocaleString()} profit will be split. The buyer will be paid $${buyerProfit.toLocaleString()} (or ${buyerSplit}%) as a subcontractor, and $${sellerProfit.toLocaleString()} (or ${100 - buyerSplit}%) will be credited toward the agreed business purchase price of $${valuation.toLocaleString()}. Ownership will transfer once the full amount has been repaid.`;

    setSummary(text);
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

        <button
          onClick={generateSummary}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
        >
          Generate Deal Summary
        </button>

        {summary && (
          <textarea
            readOnly
            value={summary}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        )}
      </div>
    </div>
  );
}
