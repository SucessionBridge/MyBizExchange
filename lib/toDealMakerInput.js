// /lib/toDealMakerInput.js

// ---------- utilities ----------
function num(v) {
  if (v === 0 || v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
const capWord = (s) => (typeof s === 'string' && s ? s[0].toUpperCase() + s.slice(1) : s);

// ---------- SELLER ----------
/**
 * Normalize a row from `sellers` to the shape the Deal Maker uses.
 */
export function toDealMakerInput(row = {}) {
  const locationFallback =
    row.location ||
    [row.location_city, row.location_state].filter(Boolean).join(', ') ||
    null;

  const description =
    row.description_choice === 'ai'
      ? (row.ai_description || '')
      : (row.business_description || '');

  const title =
    row.business_name && !row.hide_business_name
      ? row.business_name
      : (row.industry ? `${capWord(row.industry)} Business` : 'Business for Sale');

  return {
    listingId: row.id,
    title,
    industry: row.industry ?? null,
    location: locationFallback,
    askingPrice: num(row.asking_price),
    sde: num(row.sde),
    annualRevenue: num(row.annual_revenue),
    annualProfit: num(row.annual_profit),
    monthlyLease: num(row.monthly_lease),
    employees: num(row.employees),
    includesInventory: !!row.includes_inventory,
    includesBuilding: !!row.includes_building,
    financingPreference: row.financing_type || row.financing_preference || null,

    sellerFinancing: {
      considered: row.seller_financing_considered ?? null, // 'yes' | 'maybe' | 'no' | null
      downPaymentPct: num(row.down_payment),
      interestRatePct: num(row.interest_rate) ?? num(row.seller_financing_interest_rate),
      termYears: num(row.term_length),
    },

    ownerInvolvement: row.owner_involvement ?? null,
    trainingOffered: row.training_offered ?? null,
    reasonForSelling: row.reason_for_selling ?? null,
    growthPotential: row.growth_potential ?? null,
    competitiveEdge: row.competitive_edge ?? null,

    description,
    images: Array.isArray(row.image_urls) ? row.image_urls : [],

    meta: {
      city: row.location_city ?? null,
      state: row.location_state ?? null,
      hideBusinessName: !!row.hide_business_name,
    },
  };
}

/** Check for required/strongly-recommended fields for better output. */
export function validateDealMakerInput(input) {
  const missing = [];
  if (!input.askingPrice) missing.push('askingPrice');
  if (!input.sde && !input.annualProfit && !input.annualRevenue) {
    missing.push('sde|annualProfit|annualRevenue (need one)');
  }
  if (!input.industry) missing.push('industry');
  if (!input.location) missing.push('location');
  if (!input.financingPreference && !input.sellerFinancing.considered) {
    missing.push('financingPreference|sellerFinancing.considered (need one)');
  }
  return missing;
}

// ---------- BUYER ----------
/**
 * Normalize a row from `buyers` to the shape the Deal Maker uses.
 */
export function toBuyerInput(row = {}) {
  const availableCapital =
    num(row.available_capital) ?? num(row.availableCapital) ?? num(row.capital);
  const targetPurchasePrice =
    num(row.target_purchase_price) ??
    num(row.purchase_price) ??
    num(row.offer_price) ??
    num(row.targetPrice);

  return {
    buyerId: row.id ?? null,
    availableCapital: availableCapital ?? null,   // cash the buyer can put down
    targetPurchasePrice: targetPurchasePrice ?? null, // buyer's intended offer
    preferredFinancing: row.preferred_financing ?? row.financing_preference ?? null,
  };
}

// ---------- CONTEXT ----------
export function toDealContext(sellerInput, buyerInput) {
  return { seller: sellerInput, buyer: buyerInput };
}
