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

  const form = formidable({ multiples: true });

  try {
   const parseForm = (req) =>
  new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });

const [fields, files] = await parseForm(req); // ✅ This now works


    console.log('✅ Parsed fields:', fields);
    console.log('✅ Parsed files:', files);

    const imageUrls = [];
    const fileField = files['images[]'];
    const fileArray = Array.isArray(fileField) ? fileField : fileField ? [fileField] : [];

    for (const file of fileArray) {
      if (!file || !file.filepath) continue;

      const buffer = fs.readFileSync(file.filepath);
      const filename = `${Date.now()}-${file.originalFilename}`;
      const { error: uploadErr } = await supabase.storage
        .from('seller-images')
        .upload(filename, buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadErr) {
        console.error('❌ Image upload error:', uploadErr);
      } else {
        const { data: urlData } = supabase.storage.from('seller-images').getPublicUrl(filename);
        imageUrls.push(urlData.publicURL);
      }
    }

    const { error } = await supabase.from('sellers').insert([
      {
        name: fields.name?.[0] || '',
        email: fields.email?.[0] || '',
        business_name: fields.businessName?.[0] || '',
        hide_business_name: fields.hideBusinessName?.[0] === 'true',
        industry: fields.industry?.[0] || '',
        location: fields.location?.[0] || '',
        website: fields.website?.[0] || '',
        annual_revenue: parseFloat(fields.annualRevenue?.[0]) || 0,
        annual_profit: parseFloat(fields.annualProfit?.[0]) || 0,
        sde: parseFloat(fields.sde?.[0]) || 0,
        asking_price: parseFloat(fields.askingPrice?.[0]) || 0,
        employees: parseInt(fields.employees?.[0]) || 0,
        monthly_lease: parseFloat(fields.monthly_lease?.[0]) || 0,
        inventory_value: parseFloat(fields.inventory_value?.[0]) || 0,
        equipment_value: parseFloat(fields.equipment_value?.[0]) || 0,
        includes_inventory: fields.includesInventory?.[0] === 'true',
        includes_building: fields.includesBuilding?.[0] === 'true',
        real_estate_included: fields.real_estate_included?.[0] === 'true',
        relocatable: fields.relocatable?.[0] === 'true',
        home_based: fields.home_based?.[0] === 'true',
        financing_type: fields.financingType?.[0] || '',
        business_description: fields.businessDescription?.[0] || '',
        ai_description: fields.aiDescription?.[0] || '',
        description_choice: fields.descriptionChoice?.[0] || '',
        customer_type: fields.customerType?.[0] || '',
        owner_involvement: fields.ownerInvolvement?.[0] || '',
        growth_potential: fields.growthPotential?.[0] || '',
        reason_for_selling: fields.reasonForSelling?.[0] || '',
        training_offered: fields.trainingOffered?.[0] || '',
        sentence_summary: fields.sentenceSummary?.[0] || '',
        customers: fields.customers?.[0] || '',
        best_sellers: fields.bestSellers?.[0] || '',
        customer_love: fields.customerLove?.[0] || '',
        repeat_customers: fields.repeatCustomers?.[0] || '',
        keeps_them_coming: fields.keepsThemComing?.[0] || '',
        proud_of: fields.proudOf?.[0] || '',
        advice_to_buyer: fields.adviceToBuyer?.[0] || '',
        image_urls: imageUrls,
      },
    ]);

    if (error) {
      console.error('❌ Supabase insert error:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: 'Failed to save listing', detail: error.message });
    }

    console.log('✅ Listing inserted successfully!');
    return res.status(200).json({ success: true });

  } catch (e) {
    console.error('❌ Unexpected error:', e.message, e.stack);
    return res.status(500).json({ error: 'Server error' });
  }
}

