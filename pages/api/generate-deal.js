// pages/api/generate-deal.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { listing, buyer } = req.body;

  if (!listing || !buyer) {
    return res.status(400).json({ error: "Missing listing or buyer data." });
  }

  const prompt = `
Create 3 creative acquisition deal structures for this business that benefit both buyer and seller.

Business: ${listing.business_name || 'Unknown'}
Asking Price: $${listing.asking_price || 0}
Industry: ${listing.industry || 'N/A'}
City: ${listing.city || 'N/A'}

Buyer:
Name: ${buyer.name || 'Buyer'}
Experience: ${buyer.experience || 'N/A'}/5
Financing Type: ${buyer.financing_type || 'N/A'}
Available Capital: $${buyer.capital_investment || 0}
Budget: $${buyer.budget_for_purchase || 0}

For each deal, include:
- A short title
- Down payment or terms
- Payment structure
- A short explanation of why it benefits BOTH buyer and seller.
Return all 3 deals clearly separated.
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
        max_tokens: 500,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("OpenAI API error:", data);
      return res.status(500).json({ error: "AI generation failed." });
    }

    const aiSummary = data.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ summary: aiSummary });
  } catch (err) {
    console.error("Fetch error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
