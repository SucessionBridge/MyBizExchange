// STEP 2 — Replace file: pages/api/valuations.js
// Accepts POST with or without listing_id. GET loads last valuation:
// - if listing_id provided: by (listing_id + buyer_email)
// - else: by (buyer_email only)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { listing_id, buyer_email } = req.query;
    if (!buyer_email) return res.status(400).json({ error: 'buyer_email is required' });

    let q = supabase
      .from('valuations')
      .select('*')
      .eq('buyer_email', String(buyer_email).toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (listing_id) {
      q = supabase
        .from('valuations')
        .select('*')
        .eq('buyer_email', String(buyer_email).toLowerCase())
        .eq('listing_id', Number(listing_id))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    }

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ valuation: data || null });
  }

  if (req.method === 'POST') {
    const { listing_id, buyer_email, inputs, outputs } = req.body || {};
    if (!buyer_email || !inputs || !outputs) {
      return res.status(400).json({ error: 'buyer_email, inputs, outputs are required' });
    }

    const payload = {
      listing_id: listing_id ? Number(listing_id) : null,
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
