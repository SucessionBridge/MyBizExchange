import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: SB-1234
function generateAdId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SB-${randomNum}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const data = req.body;
    console.log('📨 Incoming seller payload:', data);

    // Validate required string fields
    const requiredStrings = ['name', 'email', 'business_name', 'industry', 'location', 'financing_type'];
    for (const field of requiredStrings) {
      if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
        return res.status(400).json({ error: `Missing or invalid "${field}" field` });
      }
    }

    const parseBoolean = (val) => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
      }
      return false;
    };
    const parseNullableNumber = (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'string' && val.trim() === '') return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    const adId = generateAdId();

    // ---------- Build row (unchanged fields) ----------
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
      asking_price: parseNullableNumber(data.asking_price),
      includes_inventory: parseBoolean(data.includes_inventory),
      includes_building: parseBoolean(data.includes_building),
      inventory_included: parseBoolean(data.inventory_included),
      annual_revenue: parseNullableNumber(data.annual_revenue),
      annual_profit: parseNullableNumber(data.annual_profit),
      original_description: data.original_description || '',
      ai_description: data.ai_description || '',
      sde: parseNullableNumber(data.sde),
      inventory_value: parseNullableNumber(data.inventory_value),
      equipment_value: parseNullableNumber(data.equipment_value),
      rent: parseNullableNumber(data.rent),
      rent_paid: parseBoolean(data.rent_paid),
      rent_amount: parseNullableNumber(data.rent_amount),
      monthly_lease: parseNullableNumber(data.monthly_lease),
      year_established: parseNullableNumber(data.year_established),
      employees: parseNullableNumber(data.employees),
      home_based: parseBoolean(data.home_based),
      relocatable: parseBoolean(data.relocatable),
      website: data.website || '',

      // Customers
      customer_profile: data.customer_profile || '',
      best_sellers: data.best_sellers || '',

      marketing_method: data.marketing_method || '',
      owner_involvement: data.owner_involvement || '',
      can_run_without_owner: parseBoolean(data.can_run_without_owner),
      competitive_edge: data.competitive_edge || '',
      competitors: data.competitors || '',
      growth_potential: data.growth_potential || '',
      reason_for_selling: data.reason_for_selling || '',
      training_offered: data.training_offered || '',
      creative_financing: parseBoolean(data.creative_financing),
      willing_to_mentor: parseBoolean(data.willing_to_mentor),
      years_in_business: parseNullableNumber(data.years_in_business),
      description_choice: data.description_choice || '',
      sentence_summary: data.sentence_summary || '',
      proud_of: data.proud_of || '',
      advice_to_buyer: data.advice_to_buyer || '',
      delete_reason: data.delete_reason || '',

      // Auth / status
      auth_id: data.auth_id && data.auth_id.trim() !== '' ? data.auth_id : null,
      status: data.status || 'active',

      // Financing details
      financing_preference: data.financing_preference || '',
      seller_financing_considered: parseBoolean(data.seller_financing_considered),
      down_payment: parseNullableNumber(data.down_payment),
      term_length: parseNullableNumber(data.term_length),
      seller_financing_interest_rate: parseNullableNumber(data.seller_financing_interest_rate || data.interest_rate),
      interest_rate: parseNullableNumber(data.interest_rate),

      // Images
      image_urls: Array.isArray(data.image_urls) ? data.image_urls : [],

      ad_id: adId,
    };

    // ---------- NEW: attach broker_id based on auth_id ----------
    try {
      if (row.auth_id) {
        // Try to find existing broker row for this user
        const { data: broker, error: brokerErr } = await supabase
          .from('brokers')
          .select('id')
          .eq('auth_id', row.auth_id)
          .maybeSingle();

        if (broker?.id) {
          row.broker_id = broker.id;
        } else {
          // If not found, create a minimal broker profile (keeps flow smooth)
          const { data: created, error: createErr } = await supabase
            .from('brokers')
            .upsert({ auth_id: row.auth_id, email: row.email }, { onConflict: 'auth_id' })
            .select('id')
            .single();

          if (!createErr && created?.id) {
            row.broker_id = created.id;
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Broker lookup/upsert warning:', e?.message || e);
      // Proceed without broker_id if anything fails
    }

    console.log('🔍 Prepared row for insertion:', row);

    const { error } = await supabase.from('sellers').insert([row]);
    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({ error: 'Insert failed', detail: error.message });
    }

    return res.status(200).json({ success: true, ad_id: adId });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}


