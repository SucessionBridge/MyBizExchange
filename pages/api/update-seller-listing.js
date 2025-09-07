// pages/api/update-seller-listing.js
import supabase from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing listing ID' });
  }

  // Only allow these fields to be updated from the dashboard
  const ALLOWED_FIELDS = new Set([
    'business_name',
    'industry',
    'location',
    'location_city',
    'location_state',
    'asking_price',
    'annual_revenue',
    'sde',
    'business_description',
    'financing_type',
    'status',
    'image_urls', // if you allow updating images from edit
  ]);

  const enumFinancing = new Set([
    'buyer-financed',
    'seller-financing-available',
    'seller-financing-considered',
    '', // allow clearing
    null
  ]);

  const enumStatus = new Set([
    'active',
    'draft',
    'pending',
    'sold',
    'paused',
    '', // allow clearing
    null
  ]);

  const body = req.body || {};

  // Build a sanitized update object
  const update = {};
  for (const [k, v] of Object.entries(body)) {
    if (!ALLOWED_FIELDS.has(k)) continue;

    if (k === 'asking_price' || k === 'annual_revenue' || k === 'sde') {
      // coerce to number or null
      const num = v === '' || v == null ? null : Number(v);
      update[k] = Number.isFinite(num) ? num : null;
      continue;
    }

    if (k === 'financing_type') {
      const val = (v ?? '').toString().trim();
      update[k] = enumFinancing.has(val) ? (val || null) : null;
      continue;
    }

    if (k === 'status') {
      const val = (v ?? '').toString().trim();
      update[k] = enumStatus.has(val) ? (val || null) : null;
      continue;
    }

    // image_urls can be an array of strings
    if (k === 'image_urls') {
      if (Array.isArray(v)) {
        update[k] = v.map(String);
      }
      continue;
    }

    // Text-ish fields: trim
    if (typeof v === 'string') {
      update[k] = v.trim();
    } else {
      update[k] = v;
    }
  }

  // Add updated_at if your table has it
  update.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('sellers')
      .update(update)
      .eq('id', id)
      .select('id,business_name,location_city,location_state,location,asking_price,annual_revenue,sde,business_description,financing_type,status,image_urls,updated_at')
      .single();

    if (error) {
      console.error('❌ Error updating listing:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, listing: data });
  } catch (e) {
    console.error('❌ Update route exception:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
