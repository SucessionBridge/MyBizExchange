// pages/api/generate-deal.js

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
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("OpenAI API error:", data);
      return res.status(500).json({ error: "AI generation failed." });
    }

    const aiSummary = data.choices[0].message.content.trim();
    return res.status(200).json({ summary: aiSummary });
  } catch (err) {
    console.error("Fetch error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
