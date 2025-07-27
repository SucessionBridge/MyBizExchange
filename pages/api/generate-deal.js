// pages/api/generate-deal.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { listing, buyer } = req.body;

  if (!listing || !buyer) {
    return res.status(400).json({ error: "Missing listing or buyer data" });
  }
const prompt = `
Create exactly 3 creative acquisition deal structures for this business that benefit both buyer and seller.
Format the output strictly as a JSON array in this format:
[
  {
    "title": "Deal 1 title",
    "down_payment": "Down payment amount",
    "payment_structure": "Payment structure",
    "benefits": "Why this benefits both buyer and seller"
  },
  {
    "title": "Deal 2 title",
    "down_payment": "Down payment amount",
    "payment_structure": "Payment structure",
    "benefits": "Why this benefits both buyer and seller"
  },
  {
    "title": "Deal 3 title",
    "down_payment": "Down payment amount",
    "payment_structure": "Payment structure",
    "benefits": "Why this benefits both buyer and seller"
  }
]

Business: ${listing.business_name}
Asking Price: $${listing.asking_price}
Industry: ${listing.industry}
City: ${listing.city}

Buyer:
Name: ${buyer.name}
Experience: ${buyer.experience}/5
Financing Type: ${buyer.financing_type}
Available Capital: $${buyer.capital_investment}
Budget: $${buyer.budget_for_purchase}
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
  const rawOutput = data.choices[0].message.content.trim();

  let deals;
  try {
    deals = JSON.parse(rawOutput);
  } catch (err) {
    console.error("❌ JSON parse failed:", rawOutput);
    return res.status(500).json({ error: "AI did not return valid JSON." });
  }

  return res.status(200).json({ deals });
} catch (err) {
  console.error("Fetch error:", err);
  return res.status(500).json({ error: "Something went wrong" });
}
}
