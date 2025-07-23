// pages/api/send-message.js
import supabase from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { seller_id, message, extension, topic, buyer_name, buyer_email } = req.body;

  if (!seller_id || !message || !extension || !topic || !buyer_name || !buyer_email) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const { error } = await supabase
    .from('messages')
    .insert([{ seller_id, message, extension, topic, buyer_name, buyer_email }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
