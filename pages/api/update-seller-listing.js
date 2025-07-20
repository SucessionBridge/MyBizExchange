// pages/api/update-seller-listing.js
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const updatedData = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing listing ID' });
  }

  const { error } = await supabase
    .from('sellers')
    .update(updatedData)
    .eq('id', id);

  if (error) {
    console.error('❌ Error updating listing:', error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Listing updated successfully' });
}
