// pages/api/send-message.js
import supabase from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    message,
    seller_id,
    buyer_email,
    buyer_name,
    listing_id,
    extension = 'successionbridge',
    topic = 'business-inquiry',
  } = req.body;

  // ✅ Validate required fields
  if (!message || !seller_id || !buyer_email || !buyer_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ✅ Insert message into Supabase 'messages' table
  const { error } = await supabase.from('messages').insert([
    {
      message,
      seller_id,
      buyer_email,
      buyer_name,
      listing_id,
      extension,
      topic,
    },
  ]);

  if (error) {
    console.error('❌ Supabase insert error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}

