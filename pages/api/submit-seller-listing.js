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

    const { error } = await supabase.from('sellers').insert([
      {
        name: data.name || '',
        email: data.email || '',
        business_name: data.business_name || '',
        hide_business_name: data.hide_business_name || false,
        industry: data.industry || '',
        location: data.location || '',
        website: data.website || '',
        annual_revenue: data.annual_revenue || 0,
        annual_profit: data.annual_profit || 0,
        sde: data.sde || 0,
        asking_price: data.asking_price || 0,
        employees: data.employees || 0,
        monthly_lease: data.monthly_lease || 0,
        inventory_value: data.inventory_value || 0,
        equipment_value: data.equipment_value || 0,
        includes_inventory: data.includes_inventory || false,
        includes_building: data.includes_building || false,
        real_estate_included: data.real_estate_included || false,
        relocatable: data.relocatable || false,
        home_based: data.home_based || false,
        financing_type: data.financing_type || '',
        business_description: data.business_description || '',
        ai_description: data.ai_description || '',
        description_choice: data.description_choice || '',
        customer_type: data.customer_type || '',
        owner_involvement: data.owner_involvement || '',
        growth_potential: data.growth_potential || '',
        reason_for_selling: data.reason_for_selling || '',
        training_offered: data.training_offered || '',
        sentence_summary: data.sentence_summary || '',
        customers: data.customers || '',
        best_sellers: data.best_sellers || '',
        customer_love: data.customer_love || '',
        repeat_customers: data.repeat_customers || '',
        keeps_them_coming: data.keeps_them_coming || '',
        proud_of: data.proud_of || '',
        advice_to_buyer: data.advice_to_buyer || '',
        image_urls: data.image_urls || [],
      },
    ]);

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({ error: 'Insert failed', detail: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

