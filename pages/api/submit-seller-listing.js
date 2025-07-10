// pages/api/submit-seller-listing.js

import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      askingPrice,
      annualRevenue,
      sde,
      inventoryValue,
      inventoryIncluded,
      equipmentValue,
      rent,
      realEstateIncluded,
      yearEstablished,
      employees,
      location,
      homeBased,
      relocatable,
      website,
      businessDescription,
      customerType,
      marketingMethod,
      ownerInvolvement,
      canRunWithoutOwner,
      competitiveEdge,
      competitors,
      growthPotential,
      reasonForSelling,
      trainingOffered,
      creativeFinancing,
      willingToMentor,
      aiDescription,
    } = req.body;

    // Optional: capture logged-in user's email if passed
    const userEmail = req.body.userEmail || null;

    const { error } = await supabase.from('sellers').insert([
      {
        user_email: userEmail,
        asking_price: askingPrice,
        annual_revenue: annualRevenue,
        sde,
        inventory_value: inventoryValue,
        inventory_included: inventoryIncluded,
        equipment_value: equipmentValue,
        rent,
        real_estate_included: realEstateIncluded,
        year_established: yearEstablished,
        employees,
        location,
        home_based: homeBased,
        relocatable,
        website,
        business_description: businessDescription,
        customer_type: customerType,
        marketing_method: marketingMethod,
        owner_involvement: ownerInvolvement,
        can_run_without_owner: canRunWithoutOwner,
        competitive_edge: competitiveEdge,
        competitors,
        growth_potential: growthPotential,
        reason_for_selling: reasonForSelling,
        training_offered: trainingOffered,
        creative_financing: creativeFinancing,
        willing_to_mentor: willingToMentor,
        ai_description: aiDescription,
      },
    ]);

    if (error) {
      console.error('❌ Supabase Insert Error:', error);
      return res.status(500).json({ error: 'Failed to save listing' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Server Error:', err);
    return res.status(500).json({ error: 'Unexpected error occurred' });
  }
}
