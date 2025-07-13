// pages/api/submit-seller-listing.js

import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '50mb', // Increase limit to handle larger form data + images
  },
};

// Initialize Supabase client
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
      console.error('❌ Formidable parse error:', err);
      return res.status(500).json({ error: 'Form parsing failed' });
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
        userEmail,
      } = fields;

      // Upload images to Supabase Storage if provided
      let imageUrls = [];
      const images = Array.isArray(files['images[]']) ? files['images[]'] : [files['images[]']];
      for (const file of images) {
        if (!file) continue;
        const fileBuffer = fs.readFileSync(file.filepath);
        const filename = `${Date.now()}-${file.originalFilename}`;
        const { data, error: uploadError } = await supabase.storage
          .from('seller-images')
          .upload(filename, fileBuffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error('❌ Supabase image upload error:', uploadError);
        } else {
          const { publicURL } = supabase.storage.from('seller-images').getPublicUrl(filename).data;
          imageUrls.push(publicURL);
        }
      }

      const { error } = await supabase.from('sellers').insert([
        {
          user_email: userEmail || null,
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
          image_urls: imageUrls, // optional: if you store them in your DB
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
  });
}

