// pages/api/generate-description.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { industry, customers, whatItDoes, whySelling, uniqueEdge } = req.body;

  if (!industry || !customers || !whatItDoes || !whySelling || !uniqueEdge) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `Write a clear, compelling business-for-sale description for a ${industry} business. It primarily serves ${customers}. Here's what it does: ${whatItDoes}. The owner is selling because ${whySelling}. It stands out because: ${uniqueEdge}. Keep it under 150 words, professional, but engaging.`;

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
