// pages/api/generate-description.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log("🔐 OpenAI key exists:", !!process.env.OPENAI_API_KEY);
  console.log("📥 Incoming request body:", req.body);

  const {
    industry,
    customers,
    whatItDoes,
    whySelling,
    uniqueEdge,
    yearsInBusiness,
    employeeCount,
    website,
    annualRevenue,
    annualProfit,
    includesEquipment,
    includesProperty,
  } = req.body;

  // Validate required fields
  if (!industry || !customers || !whatItDoes || !whySelling || !uniqueEdge) {
    console.error("⚠️ Missing required fields.");
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `
Write a professional, buyer-friendly listing paragraph (max 150 words) for a business in the ${industry} sector.

• Customers: ${customers}
• Years in Business: ${yearsInBusiness || "N/A"}
• Employees: ${employeeCount || "N/A"}
• Annual Revenue: $${annualRevenue || "N/A"}
• Annual Profit: $${annualProfit || "N/A"}
• What it does: ${whatItDoes}
• Unique edge: ${uniqueEdge}
• Includes Equipment: ${includesEquipment}
• Includes Property: ${includesProperty}
• Website: ${website || "N/A"}
• Reason for selling: ${whySelling}

The tone should be clear, professional, and persuasive. Avoid bullet points. Write as one clean paragraph buyers would see in a business-for-sale marketplace.
  `;

  console.log("🧠 Prompt sent to OpenAI:", prompt);

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
      console.error("🛑 OpenAI API error response:", data);
      return res.status(500).json({ error: 'OpenAI API error', detail: data });
    }

    const description = data.choices?.[0]?.message?.content?.trim();
    if (!description) {
      console.error("🚫 No description returned:", data);
      return res.status(500).json({ error: 'No description generated', detail: data });
    }

    res.status(200).json({ description });
  } catch (error) {
    console.error('❌ OpenAI fetch error:', error);
    res.status(500).json({ error: 'Failed to generate description', detail: error.message });
  }
}
