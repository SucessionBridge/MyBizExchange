// pages/api/generate-description.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    sentenceSummary,
    customers,
    bestSellers,
    customerLove,
    repeatCustomers,
    keepsThemComing,
    ownerInvolvement,
    opportunity,
    proudOf,
    adviceToBuyer,
    businessName,
    industry,
    location,
    annualRevenue,
    annualProfit,
    includesInventory,
    includesBuilding
  } = req.body;

  // Better error messaging
  const requiredFields = { sentenceSummary, customers, opportunity, industry };
  const missing = Object.entries(requiredFields).filter(([_, v]) => !v);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.map(([k]) => k).join(', ')}` });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OpenAI API key in environment.' });
  }

  const prompt = `
You are a professional business broker writing a buyer-friendly business-for-sale listing description.

Using the information below, write a detailed description broken into multiple paragraphs with clear headings:

Overview:
Financial Summary:
What’s Included:
Why Buy This Business:
Investment Snapshot:

Separate each section with a blank line.

Here is the information:

Business Name: ${businessName || "N/A"}
Location: ${location || "N/A"}
Industry: ${industry}
Summary: ${sentenceSummary}
Customers: ${customers}
Best Sellers: ${bestSellers || "N/A"}
What customers love: ${customerLove || "N/A"}
Repeat Customer Info: ${repeatCustomers || "N/A"}
Why they return: ${keepsThemComing || "N/A"}
Owner involvement: ${ownerInvolvement || "N/A"}
What makes it a good opportunity: ${opportunity}
Something the owner is proud of: ${proudOf || "N/A"}
Advice for the next owner: ${adviceToBuyer || "N/A"}
Annual Revenue: $${annualRevenue || "N/A"}
Annual Profit: $${annualProfit || "N/A"}
Includes Inventory: ${includesInventory}
Includes Building: ${includesBuilding}

Tone: Clear, confident, persuasive.
Format: Use headings and paragraphs. No bullet points.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ OpenAI API Error:", data);
      return res.status(500).json({ error: 'OpenAI error', detail: data });
    }

    const description = data.choices?.[0]?.message?.content?.trim();
    if (!description) {
      return res.status(500).json({ error: 'No description returned by AI.' });
    }

    res.status(200).json({ description });
  } catch (error) {
    console.error("❌ Error reaching OpenAI:", error);
    res.status(500).json({ error: 'AI generation failed', detail: error.message });
  }
}

