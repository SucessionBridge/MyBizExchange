import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = req.body;

    console.log('📨 Incoming seller payload:', data);

    // Validate required string fields
    const requiredStrings = ['name', 'email', 'business_name', 'industry', 'location'];
    for (const field of requiredStrings) {
      if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
        return res.status(400).json({ error: `Missing or invalid "${field}" field` });
      }
    }

    // Helper to parse booleans safely
    const parseBoolean = (val) => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
      }
      return false; // default fallback
    };

    // Helper to parse numbers safely
    const parseNumber = (val) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    // Build row for DB insert with explicit parsing
    const row = {
      name: data.name.trim(),
      email: data.email.trim(),
      business_name: data.business_name.trim(),
      hide_business_name: parseBoolean(data.hide_business_name),
      industry: data.industry.trim(),
      location: data.location.trim(),
      location_city: (data.location_city || '').trim(),
      location_state: (data.location_state || '').trim(),
      financing_type: (data.financing_type || '').trim(),
      business_description: data.business_description || '',
      asking_price: parseNumber(data.asking_price),
      includes_inventory: parseBoolean(data.includes_inventory),
      includes_building: parseBoolean(data.includes_building),
      inventory_included: parseBoolean(data.inventory_included),
      annual_revenue: parseNumber(data.annual_revenue),
      annual_profit: parseNumber(data.annual_profit),
      original_description: data.original_description || '',
      ai_description: data.ai_description || '',
      sde: parseNumber(data.sde),
      inventory_value: parseNumber(data.inventory_value),
      equipment_value: parseNumber(data.equipment_value),
      rent: parseNumber(data.rent),
      rent_paid: parseBoolean(data.rent_paid),
      rent_amount: parseNumber(data.rent_amount),
      monthly_lease: parseNumber(data.monthly_lease),
      year_established: data.year_established || '',
      employees: parseNumber(data.employees),
      home_based: parseBoolean(data.home_based),
      relocatable: parseBoolean(data.relocatable),
      website: data.website || '',
      customer_type: data.customer_type || '',
      marketing_method: data.marketing_method || '',
      owner_involvement: data.owner_involvement || '',
      can_run_without_owner: parseBoolean(data.can_run_without_owner),
      competitive_edge: data.competitive_edge || '',
      competitors: data.competitors || '',
      growth_potential: data.growth_potential || '',
      reason_for_selling: data.reason_for_selling || '',
      training_offered: data.training_offered || '',
      creative_financing: data.creative_financing || '',
      willing_to_mentor: parseBoolean(data.willing_to_mentor),
      years_in_business: data.years_in_business || '',
      description_choice: data.description_choice || '',
      sentence_summary: data.sentence_summary || '',
      customers: data.customers || '',
      best_sellers: data.best_sellers || '',
      customer_love: data.customer_love || '',
      repeat_customers: data.repeat_customers || '',
      keeps_them_coming: data.keeps_them_coming || '',
      proud_of: data.proud_of || '',
      advice_to_buyer: data.advice_to_buyer || '',
      delete_reason: data.delete_reason || '',
      auth_id: data.auth_id && data.auth_id.trim() !== '' ? data.auth_id : null,
      status: data.status || 'active',
      financing_preference: data.financing_preference || '',
      seller_financing_considered: data.seller_financing_considered || '',
      down_payment: data.down_payment || '',
      term_length: data.term_length || '',
      seller_financing_interest_rate: data.seller_financing_interest_rate || data.interest_rate || '',
      interest_rate: data.interest_rate || '',
      image_urls: Array.isArray(data.image_urls) ? data.image_urls : [],
    };

    const { error } = await supabase.from('sellers').insert([row]);

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({ error: 'Insert failed', detail: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
