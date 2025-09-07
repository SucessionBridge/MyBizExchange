// pages/api/update-seller-listing.js
import { getServerSupabaseClient } from '../../lib/supabaseServerClient';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServerSupabaseClient(req, res);

  const { id } = req.query;
  const updatedData = req.body;
  if (!id) return res.status(400).json({ error: 'Missing listing ID' });

  // 1) Current user
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return res.status(401).json({ error: 'Not authenticated' });

  // 2) Broker row
  const { data: broker, error: brokerErr } = await supabase
    .from('brokers')
    .select('id, auth_id')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (brokerErr || !broker) return res.status(403).json({ error: 'No broker profile' });

  // 3) Listing ownership
  const { data: listing, error: listErr } = await supabase
    .from('sellers')
    .select('id, broker_id')
    .eq('id', id)
    .maybeSingle();

  if (listErr || !listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.broker_id !== broker.id) {
    return res.status(403).json({ error: 'Not allowed to modify this listing' });
  }

  // 4) Update
  const { error } = await supabase.from('sellers').update(updatedData).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: 'Listing updated successfully' });
}
