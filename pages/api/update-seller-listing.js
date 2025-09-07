// pages/api/update-seller-listing.js
import { createServerClient } from '@supabase/ssr';
import cookie from 'cookie';

// Helper: make a Supabase server client that reads/writes auth cookies
function serverSupabase(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies[name],
        set: (name, value, options) => {
          res.setHeader('Set-Cookie', cookie.serialize(name, value, options));
        },
        remove: (name, options) => {
          res.setHeader(
            'Set-Cookie',
            cookie.serialize(name, '', { ...options, maxAge: 0 })
          );
        },
      },
    }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = serverSupabase(req, res);

  // 1) Auth: who is calling?
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing listing ID' });
  }

  // 2) Ownership check:
  //    - find the listing -> get broker_id
  //    - find that broker -> check auth_id matches user.id
  const { data: seller, error: sellerErr } = await supabase
    .from('sellers')
    .select('id, broker_id')
    .eq('id', id)
    .maybeSingle();

  if (sellerErr) {
    return res.status(500).json({ error: sellerErr.message });
  }
  if (!seller) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const { data: broker, error: brokerErr } = await supabase
    .from('brokers')
    .select('id, auth_id')
    .eq('id', seller.broker_id)
    .maybeSingle();

  if (brokerErr) {
    return res.status(500).json({ error: brokerErr.message });
  }
  if (!broker || broker.auth_id !== user.id) {
    return res.status(403).json({ error: 'Forbidden: not your listing' });
  }

  // 3) Sanitize + update (whitelist, coerce)
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
    'image_urls',
  ]);

  const enumFinancing = new Set([
    'buyer-financed',
    'seller-financing-available',
    'seller-financing-considered',
    '',
    null,
  ]);

  const enumStatus = new Set([
    'active',
    'draft',
    'pending',
    'sold',
    'paused',
    '',
    null,
  ]);

  const body = req.body || {};
  const update = {};

  for (const [k, v] of Object.entries(body)) {
    if (!ALLOWED_FIELDS.has(k)) continue;

    if (k === 'asking_price' || k === 'annual_revenue' || k === 'sde') {
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

    if (k === 'image_urls') {
      if (Array.isArray(v)) update[k] = v.map(String);
      continue;
    }

    update[k] = typeof v === 'string' ? v.trim() : v;
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('sellers')
    .update(update)
    .eq('id', id)
    .select(
      'id,business_name,location_city,location_state,location,asking_price,annual_revenue,sde,business_description,financing_type,status,image_urls,updated_at'
    )
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, listing: data });
}

