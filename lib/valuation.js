// lib/valuation.js
// Pure helpers only. No framework code.

export const INDUSTRY_MULTIPLES = {
  service: [2.0, 2.8, 3.5],
  ecommerce: [2.5, 3.2, 4.0],
  'manufacturing/light industrial': [3.0, 4.0, 5.0],
  manufacturing: [3.0, 4.0, 5.0],
  restaurant: [1.5, 2.2, 3.0],
  'restaurant/food': [1.5, 2.2, 3.0],
  retail: [1.8, 2.5, 3.0],
  'construction/trades': [2.5, 3.2, 4.0],
  construction: [2.5, 3.2, 4.0],
  landscaping: [2.0, 2.7, 3.5],
  'landscaping/lawn care': [2.0, 2.7, 3.5],
  'trucking/logistics': [2.0, 2.8, 3.5],
  trucking: [2.0, 2.8, 3.5],
  software: [3.5, 4.5, 6.0],
  saas: [3.5, 4.5, 6.0],
  fallback: [2.5, 3.0, 3.5],
};

export const DEFAULT_EBITDA_MULTIPLES = [3.0, 4.0, 5.0];
export const DEFAULT_REVENUE_MULTIPLES = [0.6, 1.0, 1.4];

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function normalizeIndustry(str = '') {
  const key = String(str || '').trim().toLowerCase();
  if (!key) return 'fallback';
  if (INDUSTRY_MULTIPLES[key]) return key;

  // Simple fuzzy matches
  if (key.includes('landscap')) return 'landscaping';
  if (key.includes('restaur') || key.includes('food')) return 'restaurant';
  if (key.includes('construct')) return 'construction';
  if (key.includes('retail')) return 'retail';
  if (key.includes('e-comm') || key.includes('ecomm') || key.includes('commerce')) return 'ecommerce';
  if (key.includes('manufact')) return 'manufacturing';
  if (key.includes('truck') || key.includes('logist')) return 'trucking/logistics';
  if (key.includes('soft') || key.includes('saas')) return 'software';

  return 'fallback';
}

export function computeAdjustments({ growthRatePct = 4, riskScore = 3, ownerDepScore = 3, sellerCarryAllowed = false }) {
  // Risk (1 low risk … 5 high risk) → lower risk = higher multiple
  const adjustRisk = (3 - Number(riskScore || 3)) * 0.20; // [-0.40, +0.40]
  // Owner dependency (1 low dep … 5 high dep) → lower dep = higher multiple
  const adjustOwner = (3 - Number(ownerDepScore || 3)) * 0.15; // [-0.30, +0.30]
  // Growth premium pivot at 5%
  const g = Number(growthRatePct || 0);
  const adjustGrowth = clamp(((g - 5) / 10) * 0.50, -0.50, 0.50);
  // Seller carry: small boost
  const adjustCarry = sellerCarryAllowed ? 0.20 : 0;

  let total = adjustRisk + adjustOwner + adjustGrowth + adjustCarry;
  total = clamp(total, -0.75, 0.75);

  return {
    risk: adjustRisk,
    owner_dependency: adjustOwner,
    growth: adjustGrowth,
    carry: adjustCarry,
    total,
  };
}

export function effectiveMultiples(baseTriplet = [2.5, 3.0, 3.5], totalAdj = 0) {
  const floor = 0.5; // don't go crazy-low
  const [lo, mid, hi] = baseTriplet;
  return [
    Math.max(lo + totalAdj, floor),
    Math.max(mid + totalAdj, floor),
    Math.max(hi + totalAdj, floor),
  ];
}

export function calculateSDEMultipleValues({ sde = 0, multiples = [2.5, 3.0, 3.5], workingCapital = 0 }) {
  const [lo, mid, hi] = multiples;
  return {
    low: Math.max(0, sde * lo - (workingCapital || 0)),
    base: Math.max(0, sde * mid - (workingCapital || 0)),
    high: Math.max(0, sde * hi - (workingCapital || 0)),
  };
}

export function calculateEBITDAValues({ ebitda = 0, multiples = DEFAULT_EBITDA_MULTIPLES, workingCapital = 0 }) {
  const [lo, mid, hi] = multiples;
  return {
    low: Math.max(0, ebitda * lo - (workingCapital || 0)),
    base: Math.max(0, ebitda * mid - (workingCapital || 0)),
    high: Math.max(0, ebitda * hi - (workingCapital || 0)),
  };
}

export function calculateRevenueValues({ revenue = 0, multiples = DEFAULT_REVENUE_MULTIPLES, workingCapital = 0 }) {
  const [lo, mid, hi] = multiples;
  return {
    low: Math.max(0, revenue * lo - (workingCapital || 0)),
    base: Math.max(0, revenue * mid - (workingCapital || 0)),
    high: Math.max(0, revenue * hi - (workingCapital || 0)),
  };
}

// Simple 5-year DCF using SDE as proxy for FCFE/owner cash flow.
// Terminal value = terminalMultiple * Year5 cash flow.
export function calculateDCF({
  sde = 0,
  growthRatePct = 4,
  discountRatePct = 22,
  terminalMultiple = 3.0,
  sellerCarryAllowed = false,
  workingCapital = 0,
}) {
  const g = Number(growthRatePct || 0) / 100;
  let r = Number(discountRatePct || 0) / 100;
  if (sellerCarryAllowed) r = Math.max(0.10, r - 0.02);

  let pv = 0;
  let cf = Number(sde || 0);

  for (let t = 1; t <= 5; t++) {
    cf = cf * (1 + g);
    const df = Math.pow(1 + r, t);
    pv += cf / df;
    if (t === 5) {
      const tv = (cf * terminalMultiple) / df;
      pv += tv;
    }
  }

  pv = Math.max(0, pv - (workingCapital || 0));
  return pv;
}

export function formatMoney(n) {
  const num = Number(n || 0);
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function percentDelta(value, asking) {
  const v = Number(value || 0);
  const a = Number(asking || 0);
  if (!a) return 0;
  return ((v - a) / a) * 100;
}
