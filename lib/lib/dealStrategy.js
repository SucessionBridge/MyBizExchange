// /lib/dealStrategy.js

function n(v){ if (v===0||v){ const x=Number(v); return Number.isFinite(x)?x:null; } return null; }
const fmt = (x) => `$${Number(x||0).toLocaleString()}`;

/**
 * Compute deal strategy from seller+buyer context.
 * Includes: price gap, down-payment feasibility, structure selection,
 * and (when useful) an equity-credit plan that applies part of payments toward the down.
 */
export function computeDealStrategy(ctx, opts = {}) {
  const s = ctx.seller || {};
  const b = ctx.buyer || {};

  // Tunables (sane defaults; override via opts if you want)
  const NEAR_GAP_PCT = n(opts.NEAR_GAP_PCT) ?? 10;      // ±10% = "near"
  const MOD_GAP_PCT  = n(opts.MOD_GAP_PCT) ?? 25;       // up to 25% = "moderate"
  const MIN_CASH_AT_CLOSE_PCT = n(opts.MIN_CASH_AT_CLOSE_PCT) ?? 5; // always some real cash
  const DEFAULT_BRIDGE_MONTHS = n(opts.DEFAULT_BRIDGE_MONTHS) ?? 18; // 12–24 makes sense
  const MAX_EQUITY_CREDIT_PCT_OF_PRICE = n(opts.MAX_EQUITY_CREDIT_PCT_OF_PRICE) ?? 12; // cap credit to ≤12% of price
  const DEFAULT_NOTE_INTEREST = n(opts.DEFAULT_NOTE_INTEREST) ?? 10; // fallback if seller didn't specify
  const DEFAULT_AMORT_YEARS   = n(opts.DEFAULT_AMORT_YEARS) ?? 48/12; // 4 years default amort for standard note

  const ask = n(s.askingPrice);
  const offer = n(b.targetPurchasePrice);
  const cap = n(b.availableCapital);

  const downPct = n(s.sellerFinancing?.downPaymentPct);    // seller's required down %
  const ratePct = n(s.sellerFinancing?.interestRatePct) ?? DEFAULT_NOTE_INTEREST;
  const termYrs = n(s.sellerFinancing?.termYears) ?? (DEFAULT_AMORT_YEARS);

  // ----- GAP -----
  let gapPct = null, gapBucket = 'unknown';
  if (ask && offer) {
    gapPct = Math.round(((ask - offer) / ask) * 100); // + = buyer under ask
    const abs = Math.abs(gapPct);
    if (abs <= NEAR_GAP_PCT) gapBucket = 'near';
    else if (abs <= MOD_GAP_PCT) gapBucket = 'moderate';
    else gapBucket = 'far';
  }

  // ----- DOWN PAYMENT FEASIBILITY -----
  let requiredDown = null, downOk = null, downShort = null;
  if (ask && downPct != null) {
    requiredDown = Math.round((downPct / 100) * ask);
    if (cap != null) {
      downOk = cap >= requiredDown;
      downShort = downOk ? 0 : (requiredDown - cap);
    }
  }

  // Decide structure
  // If buyer can't meet down or gap isn't "near", propose a bridge-to-bank (interest-only + balloon/refi).
  const useBridge =
    (downOk === false) ||
    (gapBucket === 'moderate') ||
    (gapBucket === 'far');

  // Bridge months heuristic
  let bridgeMonths = DEFAULT_BRIDGE_MONTHS;
  if (useBridge && ask && downShort != null) {
    const shortPct = (downShort / ask) * 100;
    if (shortPct >= 10 || gapBucket === 'far') bridgeMonths = 24;
    else if (shortPct <= 5 && gapBucket === 'near') bridgeMonths = 12;
  }

  // Minimum real cash at close (protects seller & future bankability)
  let minCashAtClose = null;
  if (ask) {
    minCashAtClose = Math.round((Math.max(MIN_CASH_AT_CLOSE_PCT, 0) / 100) * ask);
  }

  // Recommended cash down at close (bounded by capital and required down if defined)
  let recommendedCashDown = null;
  if (ask && cap != null) {
    const capBound = cap;
    const reqBound = requiredDown ?? capBound; // if no seller % given, use whatever buyer can do
    recommendedCashDown = Math.min(capBound, reqBound);
    if (minCashAtClose != null) recommendedCashDown = Math.max(recommendedCashDown, minCashAtClose);
    recommendedCashDown = Math.min(recommendedCashDown, ask); // never exceed price
  }

  // Equity-credit plan (payments count toward down) — only if shortfall is modest
  let equityCreditMonthly = 0;
  let equityCreditCap = 0;
  if (useBridge && ask && downShort && recommendedCashDown != null) {
    const shortNow = Math.max(0, requiredDown - recommendedCashDown); // remaining gap after cash at close
    const shortPctOfPrice = (shortNow / ask) * 100;
    if (shortNow > 0 && shortPctOfPrice <= MAX_EQUITY_CREDIT_PCT_OF_PRICE) {
      equityCreditCap = shortNow; // cap credit to make up the remaining down shortfall
      // Spread evenly across the bridge period
      equityCreditMonthly = Math.ceil(equityCreditCap / bridgeMonths);
    }
  }

  // Recommended down % (after we computed actual cash at close)
  const recommendedDownPct =
    ask && recommendedCashDown != null ? Math.round((recommendedCashDown / ask) * 100) : (downPct ?? null);

  // Note principal (simplified: price minus cash down)
  const notePrincipal = (ask && recommendedCashDown != null) ? (ask - recommendedCashDown) : (ask ?? null);

  // Suggestions (for UI and prompt flavor)
  const suggestions = [];
  if (gapBucket === 'near') {
    suggestions.push('Position as a fair offer and lean on speed/certainty of close.');
  } else if (gapBucket === 'moderate') {
    suggestions.push('Propose a midpoint or sweetener (slightly higher down or small earnout).');
  } else if (gapBucket === 'far') {
    suggestions.push('Frame as value-seeking: structure (earnout or rent-to-own) to bridge price expectations.');
  }
  if (downOk === false) {
    suggestions.push(`Buyer capital is short of the required down by ~${fmt(downShort)}. Suggest a bridge-to-bank with a capped equity credit, or mix bank term debt.`);
  }
  suggestions.push('Include simple covenants: monthly P&L, DSCR target, refinance window, and fallback if refi fails.');

  return {
    // Core comparisons
    ask, offer, gapPct, gapBucket,
    // Down payment realities
    downPctRequested: downPct,
    requiredDown,
    buyerCapital: cap,
    downOk,
    downShort,
    // Proposed structure & numbers
    structure: useBridge ? 'bridgeBalloon' : 'standardAmortizing',
    recommended: {
      cashDownAtClose: recommendedCashDown,      // absolute $
      cashDownPct: recommendedDownPct,           // %
      notePrincipal,                             // price - cash down (simplified)
      interestPct: ratePct,
      termYears: useBridge ? null : termYrs,     // amortizing term for standard note
      bridgeMonths: useBridge ? bridgeMonths : 0,
      balloonAtMonth: useBridge ? bridgeMonths : null,
      equityCreditMonthly,                       // $ per month that accrues as credit
      equityCreditCap,                           // max $ credit (usually the shortfall)
    },
    suggestions,
    policy: {
      MIN_CASH_AT_CLOSE_PCT,
      MAX_EQUITY_CREDIT_PCT_OF_PRICE,
    }
  };
}
