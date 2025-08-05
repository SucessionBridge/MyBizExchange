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

    console.log("📨 Incoming seller payload:", data);

    // Basic validation: check required fields
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      return res.status(400).json({ error: 'Missing or invalid "name" field' });
    }
    if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
      return res.status(400).json({ error: 'Missing or invalid "email" field' });
    }
    if (!data.business_name || typeof data.business_name !== 'string' || data.business_name.trim() === '') {
      return res.status(400).json({ error: 'Missing or invalid "business_name" field' });
    }
    if (!data.industry || typeof data.industry !== 'string' || data.industry.trim() === '') {
      return res.status(400).json({ error: 'Missing or invalid "industry" field' });
    }
    if (!data.location || typeof data.location !== 'string' || data.location.trim() === '') {
      return res.status(400).json({ error: 'Missing or invalid "location" field' });
    }

    // Prepare the row to insert with type coercion and fallback defaults
    const row = {
      name: data.name.trim(),
      email: data.email.trim(),
      business_name: data.business_name.trim(),
      industry: data.industry.trim(),
      location: data.location.trim(),
      location_city: data.location_city?.trim() || '',
      location_state: data.location_state?.trim() || '',
      financing_type: data.financing_type?.trim() || '',
      business_description: data.business_description || '',
      asking_price: Number(data.asking_price) || 0,
      includes_inventory: Boolean(data.includes_inventory),
      includes_building: Boolean(data.includes_building),
      inventory_included: Boolean(data.inventory_included),
      annual_revenue: Number(data.annual_revenue) || 0,
      annual_profit: Number(data.annual_profit) || 0,
      original_description: data.original_description || '',
      ai_description: data.ai_description || '',
      sde: Number(data.sde) || 0,
      inventory_value: Number(data.inventory_value) || 0,
      equipment_value: Number(data.equipment_value) || 0,
      rent: Number(data.rent) || 0,
      rent_paid: Boolean(data.rent_paid),
      rent_amount: Number(data.rent_amount) || 0,
      monthly_lease: Number(data.monthly_lease) || 0,
      year_established: data.year_established || '',
      employees: Number(data.employees) || 0,
      home_based: Boolean(data.home_based),
      relocatable: Boolean(data.relocatable),
      website: data.website || '',
      customer_type: data.customer_type || '',
      marketing_method: data.marketing_method || '',
      owner_involvement: data.owner_involvement || '',
      can_run_without_owner: Boolean(data.can_run_without_owner),
      competitive_edge: data.competitive_edge || '',
      competitors: data.competitors || '',
      growth_potential: data.growth_potential || '',
      reason_for_selling: data.reason_for_selling || '',
      training_offered: data.training_offered || '',
      creative_financing: data.creative_financing || '',
      willing_to_mentor: Boolean(data.willing_to_mentor),
      hide_business_name: Boolean(data.hide_business_name),
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
      // FIX HERE: insert null if auth_id missing or empty string (to satisfy UUID constraint)
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

