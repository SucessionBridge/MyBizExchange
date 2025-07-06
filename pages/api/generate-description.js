// pages/api/generate-description.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

  if (!industry || !customers || !whatItDoes || !whySelling || !uniqueEdge) {
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

  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
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

    const json = await completion.json();

    if (!json.choices || !json.choices[0]?.message?.content) {
      throw new Error('Invalid OpenAI response');
    }

    const description = json.choices[0].message.content.trim();
    res.status(200).json({ description });
  } catch (error) {
    console.error('OpenAI error:', error.message);
    res.status(500).json({ error: 'Failed to generate description' });
  }
}
