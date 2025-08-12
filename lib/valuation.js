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
  if (key.includes('home service')) return 'service';
  if (key.includes('professional service')) return 'service';
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

export function computeAdjustments({
  growthRatePct = 4,
  riskScore = 3,
  ownerDepScore = 3,
  sellerCarryAllowed = false,
}) {
  const risk = clamp(Number(riskScore ?? 3), 1, 5);
  const owner = clamp(Number(ownerDepScore ?? 3), 1, 5);

  // Risk (1 low risk … 5 high risk) → lower risk = higher multiple
  const adjustRisk = (3 - risk) * 0.20; // [-0.40, +0.40]
  // Owner dependency (1 low dep … 5 high dep) → lower dep = higher multiple
  const adjustOwner = (3 - owner) * 0.15; // [-0.30, +0.30]
  // Growth premium pivot at 5%
  const g = Number(growthRatePct || 0);
  const adjustGrowth = clamp(((g - 5) / 10) * 0.50, -0.50, 0.50);
  // Seller carry: small bump
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
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function percentDelta(value, asking) {
  const v = Number(value || 0);
  const a = Number(asking || 0);
  if (!a) return 0;
  return ((v - a) / a) * 100;
}

/* ---------- Buyer economics helpers ---------- */

// Annual payment for a standard amortizing loan (monthly amortization)
export function loanPaymentAnnual(principal = 0, annualRatePct = 0, years = 1) {
  const L = Math.max(0, Number(principal) || 0);
  const rAnnual = Math.max(0, Number(annualRatePct) || 0) / 100;
  const nMonths = Math.max(1, Math.round(Number(years || 0) * 12));
  if (L === 0) return 0;
  if (rAnnual === 0) return (L / nMonths) * 12;
  const r = rAnnual / 12;
  const m = (r * L) / (1 - Math.pow(1 + r, -nMonths)); // monthly payment
  return m * 12; // annual debt service
}

// Core buyer economics at a given price
export function computeBuyerEconomics({
  price = 0,
  sde = 0,
  managerWage = 0,
  capexReserve = 0,
  downPaymentPct = 0.2, // 0.2 = 20%
  interestPct = 10,
  loanYears = 5,
  workingCapital = 0,   // equity requirement on top
  closingCosts = 0,     // equity requirement on top
}) {
  const p = Math.max(0, Number(price) || 0);
  const s = Math.max(0, Number(sde) || 0);
  const mgr = Math.max(0, Number(managerWage) || 0);
  const capex = Math.max(0, Number(capexReserve) || 0);
  const dp = clamp(Number(downPaymentPct || 0), 0, 1);

  const equity = p * dp + Math.max(0, Number(workingCapital) || 0) + Math.max(0, Number(closingCosts) || 0);
  const debt = Math.max(0, p - p * dp);
  const annualDebtService = loanPaymentAnnual(debt, Number(interestPct || 0), Number(loanYears || 0));
  const ocfBeforeDebt = Math.max(0, s - mgr - capex); // operating cash flow before debt service
  const dscr = annualDebtService > 0 ? ocfBeforeDebt / annualDebtService : Infinity;
  const fcfToEquityYr1 = ocfBeforeDebt - annualDebtService;
  const cashOnCashYr1 = equity > 0 ? fcfToEquityYr1 / equity : Infinity;

  const operatorPaybackYears = s > 0 ? p / s : Infinity; // if owner operates (no manager)
  const managedEarnings = Math.max(0, s - mgr - capex);
  const managedPaybackYears = managedEarnings > 0 ? p / managedEarnings : Infinity;

  return {
    equity,
    debt,
    annualDebtService,
    ocfBeforeDebt,
    dscr,
    fcfToEquityYr1,
    cashOnCashYr1,
    operatorPaybackYears,
    managedPaybackYears,
  };
}

// Max price such that DSCR meets a target (e.g., 1.25)
export function maxPriceForTargetDSCR({
  sde = 0,
  managerWage = 0,
  capexReserve = 0,
  downPaymentPct = 0.2,
  interestPct = 10,
  loanYears = 5,
  targetDSCR = 1.25,
}) {
  const dp = clamp(Number(downPaymentPct || 0), 0, 1);
  const ocf = Math.max(0, Number(sde || 0) - Number(managerWage || 0) - Number(capexReserve || 0));
  if (ocf <= 0) return 0;

  // Bisection on price in [0, 10,000,000] to hit DSCR target
  let lo = 0, hi = 10000000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const debt = mid - mid * dp;
    const ads = loanPaymentAnnual(debt, Number(interestPct || 0), Number(loanYears || 0));
    const dscr = ads > 0 ? ocf / ads : Infinity;
    if (dscr >= targetDSCR) {
      lo = mid; // can afford more
    } else {
      hi = mid; // too expensive
    }
  }
  return Math.round(lo);
}

// Max price for a target managed payback (no financing effect), e.g., 3.0 years
export function maxPriceForManagedPayback({ sde = 0, managerWage = 0, capexReserve = 0, targetYears = 3 }) {
  const managedEarnings = Math.max(0, Number(sde || 0) - Number(managerWage || 0) - Number(capexReserve || 0));
  if (managedEarnings <= 0) return 0;
  return Math.round(managedEarnings * Number(targetYears || 0));
}

/* ---------- NEW: Ops/Sellability bump ---------- */
export function computeOpsAdjustment({
  hasManager = false,
  staffCanRun = false,
  documentedSOPs = false,
  systemsInPlace = false,
  recurringContracts = false,
  diversifiedCustomers = false,
  cleanBooks = false,
} = {}) {
  let bump = 0;
  if (hasManager) bump += 0.08;
  if (staffCanRun) bump += 0.07;
  if (documentedSOPs) bump += 0.06;
  if (systemsInPlace) bump += 0.05;
  if (recurringContracts) bump += 0.05;
  if (diversifiedCustomers) bump += 0.05;
  if (cleanBooks) bump += 0.05;

  bump = clamp(bump, 0, 0.30); // max +0.30× on multiples

  const score = [
    hasManager,
    staffCanRun,
    documentedSOPs,
    systemsInPlace,
    recurringContracts,
    diversifiedCustomers,
    cleanBooks,
  ].filter(Boolean).length;

  return { ops_bump: bump, ops_score: score, ops_max: 7 };
}

/* ---------- NEW: Assets / ANAV helpers ---------- */
export function computeANAV({
  essentialFMV = 0,   // essential operating equipment FMV (included in earnings — shown only for context)
  surplusFMV = 0,     // non-essential equipment FMV (additive to a deal if included)
  inventoryCost = 0,  // inventory at cost (often priced at cost)
  liabilities = 0,    // debt/liens to clear at closing (for seller net)
  olvFactor = 0.75,   // orderly liquidation value % of FMV
}) {
  const ess = Math.max(0, Number(essentialFMV) || 0);
  const sur = Math.max(0, Number(surplusFMV) || 0);
  const inv = Math.max(0, Number(inventoryCost) || 0);
  const liab = Math.max(0, Number(liabilities) || 0);
  const olvPct = clamp(Number(olvFactor || 0.75), 0, 1);

  const anavFMV = ess + sur + inv;       // total tangible FMV context
  const anavOLV = anavFMV * olvPct;      // liquidation ballpark

  return {
    anavFMV,
    anavOLV,
    netProceedsIfSoldAssetsOnly: Math.max(0, anavFMV - liab),
  };
}

/* ---------- NEW: Recommendation helpers ---------- */
export function roundDownTo(n, step = 5000) {
  const x = Number(n || 0);
  const s = Number(step || 1);
  if (s <= 0) return Math.floor(x);
  return Math.floor(x / s) * s;
}

export function recommendedPrice({ obvBase = 0, dscrCap = Infinity, paybackCap = Infinity, safetyPad = 0.9, step = 5000 }) {
  const pad = Number(safetyPad || 1);
  const dscrLimit = isFinite(dscrCap) ? dscrCap * pad : Infinity;
  const paybackLimit = isFinite(paybackCap) ? paybackCap * pad : Infinity;
  const raw = Math.min(Number(obvBase || 0), dscrLimit, paybackLimit);
  return roundDownTo(Math.max(0, raw), step);
}

export function isAssetHeavy({ anavFMV = 0, obvBase = 0, threshold = 1.3 }) {
  const a = Number(anavFMV || 0);
  const o = Number(obvBase || 0);
  if (o <= 0) return true;
  return a > o * Number(threshold || 1.3);
}

