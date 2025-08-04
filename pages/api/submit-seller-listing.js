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
        business_name: data.businessName || '', // from formData.businessName
        industry: data.industry || '',
        location: data.location || '',
        location_city: data.location_city || '',
        location_state: data.location_state || '',
        financing_type: data.financing_type || '',
        business_description: data.business_description || '',
        asking_price: data.asking_price || 0,
        includes_inventory: data.includes_inventory || false,
        includes_building: data.includes_building || false,
        inventory_included: data.inventory_included || false,
        annual_revenue: data.annual_revenue || 0,
        annual_profit: data.annual_profit || 0,
        original_description: data.original_description || '',
        ai_description: data.ai_description || '',
        sde: data.sde || 0,
        inventory_value: data.inventory_value || 0,
        equipment_value: data.equipment_value || 0,
        rent: data.rent || 0,
        year_established: data.year_established || '',
        employees: data.employees || 0,
        home_based: data.home_based || false,
        relocatable: data.relocatable || false,
        website: data.website || '',
        customer_type: data.customer_type || '',
        marketing_method: data.marketing_method || '',
        owner_involvement: data.owner_involvement || '',
        can_run_without_owner: data.can_run_without_owner || false,
        competitive_edge: data.competitive_edge || '',
        competitors: data.competitors || '',
        growth_potential: data.growth_potential || '',
        reason_for_selling: data.reason_for_selling || '',
        training_offered: data.training_offered || '',
        creative_financing: data.creative_financing || '',
        willing_to_mentor: data.willing_to_mentor || false,
        hide_business_name: data.hide_business_name || false,
        rent_paid: data.rent_paid || false,
        rent_amount: data.rent_amount || 0,
        years_in_business: data.years_in_business || '',
        monthly_lease: data.monthly_lease || 0,
        description_choice: data.description_choice || '',
        sentence_summary: data.sentence_summary || '',
        customers: data.customers || '',
        best_sellers: data.best_sellers || '',
        customer_love: data.customer_love || '',
        repeat_customers: data.repeat_customers || '',
        keeps_them_coming: data.keeps_them_coming || '',
        proud_of: data.proud_of || '',
        advice_to_buyer: data.advice_to_buyer || '',
        image_urls: Array.isArray(data.image_urls) ? data.image_urls : [],
        delete_reason: data.delete_reason || '',
        auth_id: data.auth_id || '',
        status: data.status || 'active',
        financing_preference: data.financing_preference || '',
        seller_financing_considered: data.seller_financing_considered || '',
        down_payment: data.down_payment || '',
        term_length: data.term_length || '',
        seller_financing_interest_rate: data.seller_financing_interest_rate || '',
        interest_rate: data.interest_rate || ''
      },
    ]);

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


