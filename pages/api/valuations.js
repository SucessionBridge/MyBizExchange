// pages/api/valuations.js
// Save and load valuations (latest per listing_id + buyer_email)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { listing_id, buyer_email } = req.query;
    if (!listing_id || !buyer_email) {
      return res.status(400).json({ error: 'listing_id and buyer_email are required' });
    }
    const { data, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('listing_id', Number(listing_id))
      .eq('buyer_email', String(buyer_email).toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ valuation: data || null });
  }

  if (req.method === 'POST') {
    const { listing_id, buyer_email, inputs, outputs } = req.body || {};
    if (!listing_id || !buyer_email || !inputs || !outputs) {
      return res.status(400).json({ error: 'listing_id, buyer_email, inputs, outputs are required' });
    }
    const payload = {
      listing_id: Number(listing_id),
      buyer_email: String(buyer_email).toLowerCase(),
      inputs,
      outputs,
    };
    const { data, error } = await supabase.from('valuations').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ valuation: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
