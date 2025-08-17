// pages/api/get-matches.js
import supabase from '../../lib/supabaseClient';

// helpers
const norm = (v) => (v ? String(v).trim().toLowerCase() : '');
const toNum = (v) => {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};
const tokenize = (s) =>
  (s || '')
    .split(/[,;/|]/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.toLowerCase());

export default async function handler(req, res) {
  try {
    const { userId, limit = '16' } = req.query;
    const topN = Math.min(Math.max(parseInt(limit, 10) || 16, 1), 50);

    // 1) Load buyer profile by auth_id OR email (fallback)
    const { data: buyer, error: buyerErr } = await supabase
      .from('buyers')
      .select('*')
      .or(`auth_id.eq.${userId},email.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (buyerErr || !buyer) {
      return res.status(400).json({ error: 'Buyer profile not found' });
    }

    // priorities & prefs
    const priorities = [
      norm(buyer.priority_one),
      norm(buyer.priority_two),
      norm(buyer.priority_three),
    ].filter(Boolean);
    const boost = (k) => {
      const i = priorities.indexOf(k);
      return i === 0 ? 3 : i === 1 ? 2 : i === 2 ? 1 : 0;
    };

    const buyerIndustries = tokenize(buyer.industry_preference);
    const buyerStates = tokenize(buyer.state_or_province);
    const budget = toNum(buyer.budget_for_purchase);
    const financingPref = norm(buyer.financing_type);
    const willingToMove = norm(buyer.willing_to_relocate) === 'yes';

    // 2) Pull candidate listings (filter in SQL first)
    let q = supabase
      .from('sellers')
      .select('id,business_name,location,state_or_province,industry,asking_price,financing_type,seller_financing_considered,image_urls,status,created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(400);

    if (budget > 0) q = q.lte('asking_price', budget * 1.15);

    if (buyerIndustries.length) {
      const orStr = buyerIndustries.map((i) => `industry.ilike.%${i}%`).join(',');
      q = q.or(orStr);
    }

    const { data: listings, error: listErr } = await q;
    if (listErr) return res.status(500).json({ error: listErr.message });

    // 3) Score & sort
    const scored = (listings || [])
      .map((row) => {
        let score = 0;

        // Industry
        if (buyerIndustries.length) {
          const rowIndustry = norm(row.industry);
          if (rowIndustry && buyerIndustries.some((i) => rowIndustry.includes(i))) {
            score += 2 + boost('industry');
          }
        }

        // Price vs budget
        const price = toNum(row.asking_price);
        if (budget && price > 0 && price <= budget) {
          score += 2 + boost('price');
          // small closeness bump
          const closeness = Math.max(0, 1 - Math.abs(price - budget) / Math.max(price, budget));
          score += closeness;
        }

        // Location
        const rowState = norm(row.state_or_province || row.location);
        if (buyerStates.length) {
          if (!willingToMove) {
            if (buyerStates.some((s) => rowState.includes(s))) score += 2 + boost('location');
          } else {
            if (buyerStates.some((s) => rowState.includes(s))) score += 1 + boost('location');
          }
        }

        // Financing
        const sellerFinancing =
          ['yes', 'maybe'].includes(norm(row.seller_financing_considered)) ||
          norm(row.financing_type) === 'seller-financing';
        if (financingPref) {
          if (financingPref === 'seller-financing' && sellerFinancing) score += 2 + boost('financing');
          if (financingPref === norm(row.financing_type)) score += 2 + boost('financing');
        }

        return { ...row, _score: score };
      })
      .filter((r) => r._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, topN);

    return res.status(200).json({ matches: scored });
  } catch (e) {
    console.error('/api/get-matches error', e);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}
