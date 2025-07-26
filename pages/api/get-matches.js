// pages/api/get-matches.js
import supabase from '../../lib/supabaseClient';

export default async function handler(req, res) {
  const { userId } = req.query;

  // ✅ Get buyer profile
  const { data: buyer, error: buyerError } = await supabase
    .from('buyers')
    .select('*')
    .eq('auth_id', userId)
    .maybeSingle();

  if (buyerError || !buyer) {
    return res.status(400).json({ error: 'Buyer profile not found' });
  }

  // ✅ Base query for matches
  let query = supabase.from('sellers').select('*');

  // ✅ Match industry
  if (buyer.industry_preference) {
    query = query.ilike('industry', `%${buyer.industry_preference}%`);
  }

  // ✅ Match budget
  if (buyer.budget_for_purchase) {
    query = query.lte('asking_price', buyer.budget_for_purchase);
  }

  // ✅ Match financing type
  if (buyer.financing_type) {
    query = query.or(`financing_type.eq.${buyer.financing_type},financing_type.eq.buyer-financed`);
  }

  // ✅ Location matching if priority is location
  if (buyer.priority_one === 'location' || buyer.priority_two === 'location') {
    if (buyer.city) query = query.ilike('city', `%${buyer.city}%`);
    if (buyer.state_or_province) query = query.ilike('state_or_province', `%${buyer.state_or_province}%`);
  }

  const { data: matches, error: matchError } = await query;

  if (matchError) {
    return res.status(500).json({ error: matchError.message });
  }

  res.status(200).json({ matches });
}
