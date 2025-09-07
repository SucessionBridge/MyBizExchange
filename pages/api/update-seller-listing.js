// pages/api/update-seller-listing.js
import { getServerSupabaseClient } from '../../lib/supabaseServerClient';

export default async function handler(req, res) {
  if (!['PUT', 'PATCH'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServerSupabaseClient(req, res);

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing listing ID' });

  // Must be JSON
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  // Authenticated user
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return res.status(401).json({ error: 'Not authenticated' });

  // Broker row
  const { data: broker, error: brokerErr } = await supabase
    .from('brokers')
    .select('id, auth_id')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (brokerErr || !broker) return res.status(403).json({ error: 'No broker profile' });

  // Listing ownership
  const { data: listing, error: listErr } = await supabase
    .from('sellers')
    .select('id, broker_id')
    .eq('id', id)
    .maybeSingle();
  if (listErr || !listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.broker_id !== broker.id) {
    return res.status(403).json({ error: 'Not allowed to modify this listing' });
  }

  // Whitelist: only allow these keys to be updated
  const allowedKeys = new Set([
    'business_name',
    'industry',
    'location',
    'location_city',
    'location_state',
    'asking_price',
    'annual_revenue',
    'sde',
    'business_description',
    'image_urls',
    'status', // keep if you want brokers to set e.g. 'inactive'
    'financing_type', // for seller financing flags
  ]);

  const body = req.body || {};
  const updatedData = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowedKeys.has(k))
  );

  // No-op protection
  if (Object.keys(updatedData).length === 0) {
    return res.status(400).json({ error: 'No allowed fields to update' });
  }

  const { error } = await supabase
    .from('sellers')
    .update(updatedData)
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: 'Listing updated successfully' });
}
