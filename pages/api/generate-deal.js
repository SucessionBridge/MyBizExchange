// pages/api/generate-deal.js

import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure this is set in your .env file
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { valuation, jobRevenue, jobCost, buyerSplit } = req.body;

  if (
    typeof valuation !== "number" ||
    typeof jobRevenue !== "number" ||
    typeof jobCost !== "number" ||
    typeof buyerSplit !== "number"
  ) {
    return res.status(400).json({ error: "Invalid input types" });
  }

  const profit = jobRevenue - jobCost;
  const buyerProfit = (profit * buyerSplit) / 100;
  const sellerProfit = profit - buyerProfit;

  const prompt = `
A buyer and seller are structuring a subcontractor-style business acquisition deal. 
Here are the deal details:

- Business Valuation: $${valuation.toLocaleString()}
- Example Job Revenue: $${jobRevenue.toLocaleString()}
- Job Cost: $${jobCost.toLocaleString()}
- Profit Split: ${buyerSplit}% to buyer, ${100 - buyerSplit}% to seller

Please write a clear and persuasive deal summary from the buyer’s point of view that explains how the buyer will earn income as a subcontractor and how those payments contribute toward ownership transfer. Use simple, business-friendly language.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
    });

    const aiSummary = completion.choices[0].message.content.trim();
    return res.status(200).json({ summary: aiSummary });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
