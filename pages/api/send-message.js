// pages/api/send-message.js
import supabase from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sender_id, seller_id, listing_id, message } = req.body;

  if (!sender_id || !seller_id || !listing_id || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const { error } = await supabase
    .from('messages')
    .insert({ sender_id, seller_id, listing_id, message });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
