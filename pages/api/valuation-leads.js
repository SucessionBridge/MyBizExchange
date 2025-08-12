// pages/api/valuation-leads.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, owner_name, business_name, industry, sde, fair_low, fair_base, fair_high, years_in_business } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !service) return res.status(500).json({ error: 'Missing Supabase env vars' });

    const supabase = createClient(url, service);
    const { error } = await supabase.from('valuation_leads').insert([{
      email,
      owner_name: owner_name || null,
      business_name: business_name || null,
      industry: industry || null,
      sde: Number.isFinite(Number(sde)) ? Number(sde) : null,
      fair_low: Number.isFinite(Number(fair_low)) ? Number(fair_low) : null,
      fair_base: Number.isFinite(Number(fair_base)) ? Number(fair_base) : null,
      fair_high: Number.isFinite(Number(fair_high)) ? Number(fair_high) : null,
      years_in_business: Number.isFinite(Number(years_in_business)) ? Number(years_in_business) : null,
    }]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}
