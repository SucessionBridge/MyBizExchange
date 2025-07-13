// pages/api/submit-seller-listing.js

import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '50mb',
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new formidable.IncomingForm({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parsing error:', err);
      return res.status(500).json({ error: 'Form parsing failed' });
    }

    try {
      const imageUrls = [];
      const fileArray = Array.isArray(files['images[]']) ? files['images[]'] : [files['images[]']];
      for (const file of fileArray) {
        if (!file) continue;
        const buffer = fs.readFileSync(file.filepath);
        const filename = `${Date.now()}-${file.originalFilename}`;
        const { data, error: uploadErr } = await supabase.storage
          .from('seller-images')
          .upload(filename, buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (!uploadErr) {
          const { publicURL } = supabase.storage.from('seller-images').getPublicUrl(filename).data;
          imageUrls.push(publicURL);
        } else {
          console.error('❌ Image upload error:', uploadErr);
        }
      }

      const { error } = await supabase.from('sellers').insert([
        {
          name: fields.name,
          email: fields.email,
          business_name: fields.businessName,
          hide_business_name: fields.hideBusinessName === 'true',
          industry: fields.industry,
          location: fields.location,
          website: fields.website,
          annual_revenue: fields.annualRevenue,
          annual_profit: fields.annualProfit,
          sde: fields.sde,
          asking_price: fields.askingPrice,
          employees: fields.employees,
          monthly_lease: fields.monthly_lease,
          inventory_value: fields.inventory_value,
          equipment_value: fields.equipment_value,
          includes_inventory: fields.includesInventory === 'true',
          includes_building: fields.includesBuilding === 'true',
          real_estate_included: fields.real_estate_included === 'true',
          relocatable: fields.relocatable === 'true',
          home_based: fields.home_based === 'true',
          financing_type: fields.financingType,
          business_description: fields.businessDescription,
          ai_description: fields.aiDescription,
          description_choice: fields.descriptionChoice,
          customer_type: fields.customerType,
          owner_involvement: fields.ownerInvolvement,
          growth_potential: fields.growthPotential,
          reason_for_selling: fields.reasonForSelling,
          training_offered: fields.trainingOffered,
          sentence_summary: fields.sentenceSummary,
          customers: fields.customers,
          best_sellers: fields.bestSellers,
          customer_love: fields.customerLove,
          repeat_customers: fields.repeatCustomers,
          keeps_them_coming: fields.keepsThemComing,
          proud_of: fields.proudOf,
          advice_to_buyer: fields.adviceToBuyer,
          image_urls: imageUrls,
        },
      ]);

      if (error) {
        console.error('❌ Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to save listing' });
      }

      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('❌ Server error:', e);
      return res.status(500).json({ error: 'Unexpected error occurred' });
    }
  });
}

