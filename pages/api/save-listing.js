// pages/api/save-listing.js
import supabase from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { listing_id, buyer_id } = req.body;

  if (!listing_id || !buyer_id) {
    return res.status(400).json({ error: 'Missing listing_id or buyer_id' });
  }

  const { error } = await supabase
    .from('saved_listings')
    .insert({ listing_id, buyer_id });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
