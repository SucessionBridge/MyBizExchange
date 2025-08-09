// pages/api/update-listing-status.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { listingId, status, deleteReason } = req.body;

  if (!listingId || !status) {
    return res.status(400).json({ error: 'Missing required fields: listingId or status' });
  }

  try {
    const { error } = await supabase
      .from('sellers')
      .update({
        status,
        delete_reason: deleteReason || null,
      })
      .eq('id', listingId);

    if (error) {
      console.error('❌ Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to update listing status', detail: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
