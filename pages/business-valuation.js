// pages/business-valuation.js
import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  INDUSTRY_MULTIPLES,
  DEFAULT_EBITDA_MULTIPLES,
  DEFAULT_REVENUE_MULTIPLES,
  computeAdjustments,
  effectiveMultiples,
  calculateSDEMultipleValues,
  calculateEBITDAValues,
  calculateRevenueValues,
  calculateDCF,
  formatMoney,
  percentDelta,
  normalizeIndustry,
  computeBuyerEconomics,
  maxPriceForTargetDSCR,
  maxPriceForManagedPayback,
  computeOpsAdjustment,
  computeANAV,
  recommendedPrice,
  isAssetHeavy,
} from '../lib/valuation';

// tiny inline helper UI
function Info({ children, title }) {
  return (
    <span className="ml-1 text-gray-500 cursor-help" title={title}>
      ⓘ
    </span>
  );
}

function BusinessValuation() {
  // Funnel fields
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('service');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [askingPrice, setAskingPrice] = useState('');

  // Financial inputs
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [annualExpenses, setAnnualExpenses] = useState('');
  const [ownerSalaryAddBack, setOwnerSalaryAddBack] = useState('');
  const [personalAddBacks, setPersonalAddBacks] = useState('');
  const [sdeOverride, setSdeOverride] = useState('');

  // Assumptions
  const [industryTriplet, setIndustryTriplet] = useState(
    INDUSTRY_MULTIPLES[normalizeIndustry(industry)] || INDUSTRY_MULTIPLES.fallback
  );
  const [riskScore, setRiskScore] = useState(3);
  const [ownerDepScore, setOwnerDepScore] = useState(3);
  const [growthRate, setGrowthRate] = useState(4);
  const [discountRate, setDiscountRate] = useState(22);
  const [terminalMultiple, setTerminalMultiple] = useState(3.0);
  const [workingCapital, setWorkingCapital] = useState(0);
  const [sellerCarryAllowed, setSellerCarryAllowed] = useState(false);

  // Optional extra methods
  const [showEbitdaRevenue, setShowEbitdaRevenue] = useState(false);
  const [ebitdaOverride, setEbitdaOverride] = useState('');
  const [ebitdaMultiples, setEbitdaMultiples] = useState([...DEFAULT_EBITDA_MULTIPLES]);
  const [revenueMultiples, setRevenueMultiples] = useState([...DEFAULT_REVENUE_MULTIPLES]);

  // Buyer Reality Check inputs
  const [managerWage, setManagerWage] = useState(80000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [loanInterestPct, setLoanInterestPct] = useState(10);
  const [loanYears, setLoanYears] = useState(5);
  const [capexReserve, setCapexReserve] = useState(0);
  const [targetDSCR, setTargetDSCR] = useState(1.25);
  const [targetPaybackYears, setTargetPaybackYears] = useState(3);

  // Operations & Sellability flags
  const [hasManager, setHasManager] = useState(false);
  const [staffCanRun, setStaffCanRun] = useState(false);
  const [documentedSOPs, setDocumentedSOPs] = useState(false);
  const [systemsInPlace, setSystemsInPlace] = useState(false);
  const [recurringContracts, setRecurringContracts] = useState(false);
  const [diversifiedCustomers, setDiversifiedCustomers] = useState(false);
  const [cleanBooks, setCleanBooks] = useState(false);

  // Assets / Real estate inputs
  const [essentialFMV, setEssentialFMV] = useState(0); // essential equipment FMV (context only)
  const [surplusFMV, setSurplusFMV] = useState(0);     // added on top if sold with the business
  const [inventoryCost, setInventoryCost] = useState(0);
  const [liabilitiesToClear, setLiabilitiesToClear] = useState(0);
  const [olvFactor, setOlvFactor] = useState(0.75);
  const [includeRealEstate, setIncludeRealEstate] = useState(false);
  const [realEstateFMV, setRealEstateFMV] = useState(0);

  // Derived SDE
  const computedSDE = useMemo(() => {
    const rev = Number(annualRevenue || 0);
    const exp = Number(annualExpenses || 0);
    const add1 = Number(ownerSalaryAddBack || 0);
    const add2 = Number(personalAddBacks || 0);
    return Math.max(0, rev - exp + add1 + add2);
  }, [annualRevenue, annualExpenses, ownerSalaryAddBack, personalAddBacks]);

  const sdeUsed = Number(sdeOverride || computedSDE || 0);
  const normalizedIndustry = normalizeIndustry(industry);

  const adjustments = useMemo(
    () =>
      computeAdjustments({
        growthRatePct: Number(growthRate || 0),
        riskScore: Number(riskScore || 3),
        ownerDepScore: Number(ownerDepScore || 3),
        sellerCarryAllowed,
      }),
    [growthRate, riskScore, ownerDepScore, sellerCarryAllowed]
  );

  const ops = useMemo(
    () =>
      computeOpsAdjustment({
        hasManager,
        staffCanRun,
        documentedSOPs,
        systemsInPlace,
        recurringContracts,
        diversifiedCustomers,
        cleanBooks,
      }),
    [hasManager, staffCanRun, documentedSOPs, systemsInPlace, recurringContracts, diversifiedCustomers, cleanBooks]
  );

  const effective = useMemo(
    () => effectiveMultiples(industryTriplet, adjustments.total + ops.ops_bump),
    [industryTriplet, adjustments.total, ops.ops_bump]
  );

  const sdeValues = useMemo(
    () =>
      calculateSDEMultipleValues({
        sde: sdeUsed,
        multiples: effective,
        workingCapital: Number(workingCapital || 0),
      }),
    [sdeUsed, effective, workingCapital]
  );

  const ebitdaValues = useMemo(() => {
    if (!showEbitdaRevenue) return null;
    const e = Number(ebitdaOverride || sdeUsed || 0);
    return calculateEBITDAValues({
      ebitda: e,
      multiples: ebitdaMultiples.map(Number),
      workingCapital: Number(workingCapital || 0),
    });
  }, [showEbitdaRevenue, ebitdaOverride, sdeUsed, ebitdaMultiples, workingCapital]);

  const revenueValues = useMemo(() => {
    if (!showEbitdaRevenue) return null;
    const r = Number(annualRevenue || 0);
    return calculateRevenueValues({
      revenue: r,
      multiples: revenueMultiples.map(Number),
      workingCapital: Number(workingCapital || 0),
    });
  }, [showEbitdaRevenue, annualRevenue, revenueMultiples, workingCapital]);

  const dcfValue = useMemo(
    () =>
      calculateDCF({
        sde: sdeUsed,
        growthRatePct: Number(growthRate || 0),
        discountRatePct: Number(discountRate || 0),
        terminalMultiple: Number(terminalMultiple || 3),
        sellerCarryAllowed,
        workingCapital: Number(workingCapital || 0),
      }),
    [sdeUsed, growthRate, discountRate, terminalMultiple, sellerCarryAllowed, workingCapital]
  );

  // Assets track (ANAV)
  const anav = useMemo(
    () =>
      computeANAV({
        essentialFMV,
        surplusFMV,
        inventoryCost,
        liabilities: liabilitiesToClear,
        olvFactor,
      }),
    [essentialFMV, surplusFMV, inventoryCost, liabilitiesToClear, olvFactor]
  );

  const asking = Number(askingPrice || 0);
  const priceToAnalyze = asking > 0 ? asking : sdeValues.base;

  // Buyer economics caps
  const econ = useMemo(
    () =>
      computeBuyerEconomics({
        price: priceToAnalyze,
        sde: sdeUsed,
        managerWage: Number(managerWage || 0),
        capexReserve: Number(capexReserve || 0),
        downPaymentPct: Number(downPaymentPct || 0) / 100,
        interestPct: Number(loanInterestPct || 0),
        loanYears: Number(loanYears || 0),
        workingCapital: Number(workingCapital || 0),
        closingCosts: 0,
      }),
    [priceToAnalyze, sdeUsed, managerWage, capexReserve, downPaymentPct, loanInterestPct, loanYears, workingCapital]
  );

  const dscrCapPrice = useMemo(
    () =>
      maxPriceForTargetDSCR({
        sde: sdeUsed,
        managerWage: Number(managerWage || 0),
        capexReserve: Number(capexReserve || 0),
        downPaymentPct: Number(downPaymentPct || 0) / 100,
        interestPct: Number(loanInterestPct || 0),
        loanYears: Number(loanYears || 0),
        targetDSCR,
      }),
    [sdeUsed, managerWage, capexReserve, downPaymentPct, loanInterestPct, loanYears, targetDSCR]
  );

  const paybackCapPrice = useMemo(
    () =>
      maxPriceForManagedPayback({
        sde: sdeUsed,
        managerWage: Number(managerWage || 0),
        capexReserve: Number(capexReserve || 0),
        targetYears: Number(targetPaybackYears || 0),
      }),
    [sdeUsed, managerWage, capexReserve, targetPaybackYears]
  );

  // Recommended value (earnings, financeability-capped)
  const recommended = useMemo(
    () =>
      recommendedPrice({
        obvBase: sdeValues.base,
        dscrCap: dscrCapPrice,
        paybackCap: paybackCapPrice,
        safetyPad: 0.9,
        step: 5000,
      }),
    [sdeValues.base, dscrCapPrice, paybackCapPrice]
  );

  const assetHeavy = useMemo(
    () => isAssetHeavy({ anavFMV: anav.anavFMV, obvBase: sdeValues.base, threshold: 1.3 }),
    [anav.anavFMV, sdeValues.base]
  );

  // Presentational helpers
  const combinedIfSellingExtras =
    recommended + Math.max(0, Number(surplusFMV || 0)) + Math.max(0, Number(inventoryCost || 0)) + (includeRealEstate ? Math.max(0, Number(realEstateFMV || 0)) : 0);

  const summaryText = useMemo(() => {
    const lines = [];
    lines.push(`Valuation Summary${businessName ? ` for ${businessName}` : ''}`);
    if (city || province) lines.push([city, province].filter(Boolean).join(', '));
    lines.push(`Industry: ${industry}`);
    lines.push('');
    lines.push(`Recommended asking (earnings-based, financeability-capped): ${formatMoney(recommended)}`);
    lines.push(`Fair range (SDE multiples): ${formatMoney(sdeValues.low)} – ${formatMoney(sdeValues.high)} (Base ${formatMoney(sdeValues.base)})`);
    lines.push(`Sellability score: ${ops.ops_score}/${ops.ops_max} (ops bump +${ops.ops_bump.toFixed(2)}×)`);
    lines.push('');
    lines.push(`Assets track (ANAV @ FMV): ${formatMoney(anav.anavFMV)}  •  OLV (~${(Number(olvFactor)*100).toFixed(0)}%): ${formatMoney(anav.anavOLV)}`);
    if (assetHeavy) lines.push('Note: Asset-heavy profile — market may anchor near asset value unless earnings justify a premium.');
    lines.push('');
    lines.push(`DCF cross-check (5y growth ${Number(growthRate)}%, discount ${Number(discountRate)}%, terminal ${Number(terminalMultiple).toFixed(1)}×): ${formatMoney(dcfValue)}`);
    if (asking > 0) {
      lines.push('');
      lines.push(`Your entered asking: ${formatMoney(asking)} • Δ vs Base: ${formatMoney(sdeValues.base - asking)} (${percentDelta(sdeValues.base, asking).toFixed(1)}%)`);
    }
    lines.push('');
    lines.push('Buyer reality check:');
    lines.push(`At ${asking > 0 ? 'your price' : 'recommended base'} (${formatMoney(priceToAnalyze)}): manager ${formatMoney(managerWage)}, capex ${formatMoney(capexReserve)}, OCF before debt ${formatMoney(econ.ocfBeforeDebt)}, DSCR ${Number.isFinite(econ.dscr) ? econ.dscr.toFixed(2) : '∞'}.`);
    lines.push(`Y1 cash-to-buyer ${formatMoney(econ.fcfToEquityYr1)}; payback (managed) ${Number.isFinite(econ.managedPaybackYears) ? econ.managedPaybackYears.toFixed(1) : '∞'} yrs.`);
    if (includeRealEstate) lines.push(`Real estate (separate): ${formatMoney(realEstateFMV)}.`);
    lines.push('');
    lines.push('Notes:');
    lines.push('- Essential equipment is assumed included in the earnings valuation (not added again).');
    if (surplusFMV > 0 || inventoryCost > 0) {
      lines.push(`- If you include surplus equipment/inventory, a combined “ask” could be around ${formatMoney(combinedIfSellingExtras)} (business + extras${includeRealEstate ? ' + real estate' : ''}).`);
    }
    return lines.join('\n');
  }, [
    businessName, city, province, industry,
    recommended, sdeValues.low, sdeValues.high, sdeValues.base,
    ops, anav, olvFactor, assetHeavy,
    dcfValue, growthRate, discountRate, terminalMultiple,
    asking, priceToAnalyze, managerWage, capexReserve, econ,
    includeRealEstate, realEstateFMV, surplusFMV, inventoryCost, combinedIfSellingExtras
  ]);

  async function handleSave() {
    if (!email) return alert('Please enter your email.');

    const outputs = {
      effective_multiples: { low: Number(effective[0]), base: Number(effective[1]), high: Number(effective[2]) },
      sde_multiple_values: { low: sdeValues.low, base: sdeValues.base, high: sdeValues.high },
      dcf_value: dcfValue,
      buyer_economics: {
        analyzed_price: priceToAnalyze,
        manager_wage: Number(managerWage || 0),
        capex_reserve: Number(capexReserve || 0),
        down_payment_pct: Number(downPaymentPct || 0),
        interest_pct: Number(loanInterestPct || 0),
        loan_years: Number(loanYears || 0),
        ocf_before_debt: econ.ocfBeforeDebt,
        annual_debt_service: econ.annualDebtService,
        dscr: econ.dscr,
        cash_on_cash_y1: econ.cashOnCashYr1,
        operator_payback_years: econ.operatorPaybackYears,
        managed_payback_years: econ.managedPaybackYears,
        cap_price_dscr: dscrCapPrice,
        cap_price_payback: paybackCapPrice,
      },
      assets_track: {
        essential_fmv: Number(essentialFMV || 0),
        surplus_fmv: Number(surplusFMV || 0),
        inventory_cost: Number(inventoryCost || 0),
        anav_fmv: anav.anavFMV,
        anav_olv: anav.anavOLV,
        olv_factor: Number(olvFactor || 0.75),
        liabilities_to_clear: Number(liabilitiesToClear || 0),
        asset_heavy: assetHeavy,
      },
      real_estate: {
        included: Boolean(includeRealEstate),
        fmv: Number(realEstateFMV || 0),
      },
      sellability: { score: ops.ops_score, max: ops.ops_max, ops_bump: ops.ops_bump },
      recommended_value: recommended,
      fair_value_band: { low: sdeValues.low, high: sdeValues.high },
      summary_text: summaryText,
    };

    const inputs = {
      listing_id: null,
      source: 'owner_prelist',
      email,
      business_name: businessName || null,
      city: city || null,
      state_or_province: province || null,
      industry: normalizeIndustry(industry),
      industry_label: industry,
      industry_multiples: { low: Number(industryTriplet[0]), base: Number(industryTriplet[1]), high: Number(industryTriplet[2]) },
      annual_revenue: Number(annualRevenue || 0),
      annual_expenses: Number(annualExpenses || 0),
      owner_salary_addback: Number(ownerSalaryAddBack || 0),
      personal_addbacks: Number(personalAddBacks || 0),
      sde_override: sdeOverride ? Number(sdeOverride) : null,
      growth_rate_pct: Number(growthRate || 0),
      discount_rate_pct: Number(discountRate || 0),
      terminal_multiple: Number(terminalMultiple || 3),
      risk_score: Number(riskScore || 3),
      owner_dependency_score: Number(ownerDepScore || 3),
      working_capital_adjustment: Number(workingCapital || 0),
      seller_carry_allowed: Boolean(sellerCarryAllowed),
      show_ebitda_revenue_methods: Boolean(showEbitdaRevenue),
      ebitda_value_override: ebitdaOverride ? Number(ebitdaOverride) : null,
      ebitda_multiples: { low: Number(ebitdaMultiples[0]), base: Number(ebitdaMultiples[1]), high: Number(ebitdaMultiples[2]) },
      revenue_multiples: { low: Number(revenueMultiples[0]), base: Number(revenueMultiples[1]), high: Number(revenueMultiples[2]) },
      asking_price_self: Number(asking || 0),
      sde_computed: computedSDE,
      sde_used: sdeUsed,

      // ops & buyer terms
      ops_flags: { hasManager, staffCanRun, documentedSOPs, systemsInPlace, recurringContracts, diversifiedCustomers, cleanBooks },
      buyer_terms: {
        manager_wage: Number(managerWage || 0),
        down_payment_pct: Number(downPaymentPct || 0),
        interest_pct: Number(loanInterestPct || 0),
        loan_years: Number(loanYears || 0),
        capex_reserve: Number(capexReserve || 0),
        target_dscr: Number(targetDSCR || 0),
        target_payback_years: Number(targetPaybackYears || 0),
      },

      // assets / RE inputs
      assets_inputs: {
        essential_fmv: Number(essentialFMV || 0),
        surplus_fmv: Number(surplusFMV || 0),
        inventory_cost: Number(inventoryCost || 0),
        liabilities_to_clear: Number(liabilitiesToClear || 0),
        olv_factor: Number(olvFactor || 0.75),
      },
      real_estate: { include: Boolean(includeRealEstate), fmv: Number(realEstateFMV || 0) },
      adjustments: { ...adjustments, total_applied: adjustments.total, ops_bump: ops.ops_bump },
    };

    const resp = await fetch('/api/valuations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: null,
        buyer_email: email,
        inputs,
        outputs,
      }),
    });
    const json = await resp.json();
    if (!resp.ok) {
      alert(json.error || 'Failed to save valuation.');
    } else {
      alert('Saved. We’ll use your email to follow up with an explanation if requested.');
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Owner inputs */}
        <section className="bg-white rounded-xl shadow p-5 space-y-4">
          <h1 className="text-2xl font-bold">Value Your Business</h1>
          <p className="text-sm text-gray-600">
            Plain-English guidance. We anchor on earnings (SDE multiples), cross-check with DCF, and sanity-check with buyer finance math (DSCR & payback).
          </p>

          {/* Contact / basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Your Email *</label>
              <input className="w-full border rounded p-2" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="text-xs text-gray-500 mt-1">
                Save Valuation = we store your numbers so we can follow up and answer questions.
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Business Name</label>
              <input className="w-full border rounded p-2" placeholder="(optional)" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <input className="w-full border rounded p-2" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">State/Province</label>
              <input className="w-full border rounded p-2" value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Industry
                <Info title="We use typical small business multiples by industry. You can override the low/base/high below." />
              </label>
              <select
                className="w-full border rounded p-2"
                value={industry}
                onChange={(e) => {
                  const label = e.target.value;
                  setIndustry(label);
                  const key = normalizeIndustry(label);
                  const triplet = INDUSTRY_MULTIPLES[key] || INDUSTRY_MULTIPLES.fallback;
                  setIndustryTriplet(triplet);
                }}
              >
                {Object.keys(INDUSTRY_MULTIPLES)
                  .filter((k) => k !== 'fallback')
                  .map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Your target asking price (optional)</label>
              <input type="number" className="w-full border rounded p-2" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} />
              <div className="text-xs text-gray-500 mt-1">
                We’ll still show a financeability-capped recommendation to avoid overpromising.
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="block text-sm font-medium">Annual Revenue ($)</label>
              <input type="number" className="w-full border rounded p-2" value={annualRevenue} onChange={(e) => setAnnualRevenue(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Annual Expenses ($)</label>
              <input type="number" className="w-full border rounded p-2" value={annualExpenses} onChange={(e) => setAnnualExpenses(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Owner Salary Add-Back ($)
                <Info title="Add back your own pay if it was included in expenses — SDE is owner earnings before your pay." />
              </label>
              <input type="number" className="w-full border rounded p-2" value={ownerSalaryAddBack} onChange={(e) => setOwnerSalaryAddBack(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Personal Add-Backs ($)
                <Info title="Personal or one-time expenses that won’t continue for a buyer (e.g., personal car, one-time legal fees)." />
              </label>
              <input type="number" className="w-full border rounded p-2" value={personalAddBacks} onChange={(e) => setPersonalAddBacks(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">
                SDE Override ($) — optional
                <Info title="If you already calculated SDE with your accountant, enter it here. Otherwise we’ll compute it." />
              </label>
              <input type="number" className="w-full border rounded p-2" value={sdeOverride} onChange={(e) => setSdeOverride(e.target.value)} placeholder="Use if you already know SDE" />
            </div>
          </div>

          {/* Industry multiples */}
          <div className="grid grid-cols-3 gap-3">
            {['Low×', 'Base×', 'High×'].map((label, idx) => (
              <div key={label}>
                <label className="block text-sm font-medium">{`Industry ${label}`}</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded p-2"
                  value={industryTriplet[idx]}
                  onChange={(e) => {
                    const val = Number(e.target.value || 0);
                    setIndustryTriplet((prev) => prev.map((x, i) => (i === idx ? val : x)));
                  }}
                />
              </div>
            ))}
          </div>

          {/* Risk & growth */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">
                Risk (1–5)
                <Info title="Overall deal risk. 1=very low risk (stable, clean), 5=high risk (customer concentration, volatility)." />
              </label>
              <input type="number" min={1} max={5} className="w-full border rounded p-2" value={riskScore} onChange={(e) => setRiskScore(Number(e.target.value || 3))} />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Owner-Dependency (1–5)
                <Info title="How much the business depends on you personally. Lower is better (team can run it)." />
              </label>
              <input type="number" min={1} max={5} className="w-full border rounded p-2" value={ownerDepScore} onChange={(e) => setOwnerDepScore(Number(e.target.value || 3))} />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Growth %
                <Info title="Expected annual growth of owner cash flow (SDE). Small businesses often fall in the 3–5% range." />
              </label>
              <input type="number" step="0.1" className="w-full border rounded p-2" value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value || 0))} />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Discount %
                <Info title="Used in DCF — higher % means more caution. Typical small-business deals use 18–25%." />
              </label>
              <input type="number" step="0.1" className="w-full border rounded p-2" value={discountRate} onChange={(e) => setDiscountRate(Number(e.target.value || 0))} />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Terminal Multiple ×
                <Info title="In DCF, what the business could be worth in year 5 (as a multiple of cash flow)." />
              </label>
              <input type="number" step="0.1" className="w-full border rounded p-2" value={terminalMultiple} onChange={(e) => setTerminalMultiple(Number(e.target.value || 3))} />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sellerCarryAllowed} onChange={(e) => setSellerCarryAllowed(e.target.checked)} />
                Seller carry allowed
                <Info title="You finance part of the price (you act like a bank). Improves financeability a bit; we nudge value slightly for this." />
              </label>
            </div>
          </div>

          {/* Assets & Real Estate */}
          <div className="pt-2 border-t">
            <div className="text-sm font-medium mb-1">
              Assets & Real Estate
              <Info title="Essential gear is assumed included in earnings-based value and is not added again. Surplus gear and inventory can be added on top. Real estate is priced separately." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Essential equipment FMV ($)</label>
                <input type="number" className="w-full border rounded p-2" value={essentialFMV} onChange={(e) => setEssentialFMV(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Surplus (non-essential) equipment FMV ($)</label>
                <input type="number" className="w-full border rounded p-2" value={surplusFMV} onChange={(e) => setSurplusFMV(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Inventory at cost ($)</label>
                <input type="number" className="w-full border rounded p-2" value={inventoryCost} onChange={(e) => setInventoryCost(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Liabilities to clear at closing ($)</label>
                <input type="number" className="w-full border rounded p-2" value={liabilitiesToClear} onChange={(e) => setLiabilitiesToClear(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">
                  OLV factor (0–1)
                  <Info title="Orderly Liquidation Value ~ what assets could fetch if sold in an orderly sale (e.g., 0.75 = 75% of FMV)." />
                </label>
                <input type="number" step="0.01" min={0} max={1} className="w-full border rounded p-2" value={olvFactor} onChange={(e) => setOlvFactor(e.target.value)} />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={includeRealEstate} onChange={(e) => setIncludeRealEstate(e.target.checked)} />
                  Include real estate separately?
                </label>
              </div>
              {includeRealEstate && (
                <div>
                  <label className="block text-sm">Real estate FMV ($)</label>
                  <input type="number" className="w-full border rounded p-2" value={realEstateFMV} onChange={(e) => setRealEstateFMV(e.target.value)} />
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              We’ll show <strong>Business (earnings)</strong> separately from <strong>Assets (ANAV)</strong> and <strong>Real estate</strong>. Surplus gear/inventory can be added on top of the business price.
            </div>
          </div>

          {/* Optional EBITDA/Revenue */}
          <div className="pt-2 border-t">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showEbitdaRevenue} onChange={(e) => setShowEbitdaRevenue(e.target.checked)} />
              Show EBITDA/Revenue methods
            </label>
            {showEbitdaRevenue && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium">EBITDA Override ($)</label>
                  <input type="number" className="w-full border rounded p-2" value={ebitdaOverride} onChange={(e) => setEbitdaOverride(e.target.value)} placeholder="Leave blank to use SDE" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['EBITDA Low×', 'EBITDA Base×', 'EBITDA High×'].map((label, idx) => (
                    <div key={label}>
                      <label className="block text-sm font-medium">{label}</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border rounded p-2"
                        value={ebitdaMultiples[idx]}
                        onChange={(e) => {
                          const val = Number(e.target.value || 0);
                          setEbitdaMultiples((prev) => prev.map((x, i) => (i === idx ? val : x)));
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Revenue Low×', 'Revenue Base×', 'Revenue High×'].map((label, idx) => (
                    <div key={label}>
                      <label className="block text-sm font-medium">{label}</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border rounded p-2"
                        value={revenueMultiples[idx]}
                        onChange={(e) => {
                          const val = Number(e.target.value || 0);
                          setRevenueMultiples((prev) => prev.map((x, i) => (i === idx ? val : x)));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Save Valuation
            </button>
          </div>
        </section>

        {/* RIGHT: Results */}
        <section className="space-y-4">
          {/* Recommended */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold">Recommended Value</h2>
            <div className="text-sm text-gray-600">
              Based on earnings (SDE Base) and capped by typical lender math (DSCR & payback) with a safety pad.
            </div>
            <div className="text-2xl font-bold mt-2">{formatMoney(recommended)}</div>
            <div className="text-sm text-gray-600 mt-1">
              Fair band: {formatMoney(sdeValues.low)} – {formatMoney(sdeValues.high)} • Base {formatMoney(sdeValues.base)}
            </div>
          </div>

          {/* SDE multiples */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">SDE Multiple Method</h2>
              <div className="text-sm text-gray-500">
                Adj total: {(adjustments.total + ops.ops_bump).toFixed(2)}×
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Effective multiples: Low {effective[0].toFixed(2)}× • Base {effective[1].toFixed(2)}× • High {effective[2].toFixed(2)}×
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <ResultCard label="Low" value={sdeValues.low} />
              <ResultCard label="Base" value={sdeValues.base} highlight />
              <ResultCard label="High" value={sdeValues.high} />
            </div>
          </div>

          {/* DCF */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold">
              Quick DCF (5-year + Terminal)
              <Info title="DCF = Discounted Cash Flow. We project 5 years of owner cash flow (SDE), then discount back to today at your chosen % and add a terminal value (Year-5 × terminal multiple)." />
            </h2>
            <div className="text-sm text-gray-600">
              Growth {Number(growthRate)}% • Discount {Number(discountRate)}% • Terminal {Number(terminalMultiple).toFixed(1)}×
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ResultCard label="DCF Value" value={dcfValue} />
              <div className="rounded border p-3 text-sm text-gray-700">
                <div>SDE (computed): {formatMoney(computedSDE)} • SDE used: {formatMoney(sdeUsed)}</div>
                <div>Working capital applied: {formatMoney(workingCapital)}</div>
              </div>
            </div>
          </div>

          {/* Buyer Reality Check */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Buyer Reality Check</h2>
              <div className="text-xs text-gray-500">
                {asking > 0 ? 'Analyzing your price' : 'Analyzing recommended base'}: {formatMoney(priceToAnalyze)}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              DSCR = cash flow ÷ annual loan payments. ≥1.25 is commonly financeable. Payback (managed) uses SDE minus a market manager wage and capex reserve.
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <InputSmall label="Manager wage ($/yr)" value={managerWage} onChange={setManagerWage} />
              <InputSmall label="Capex reserve ($/yr)" value={capexReserve} onChange={setCapexReserve} />
              <InputSmall label="Down payment (%)" value={downPaymentPct} onChange={setDownPaymentPct} />
              <InputSmall label="Interest rate (%)" value={loanInterestPct} onChange={setLoanInterestPct} />
              <InputSmall label="Loan term (years)" value={loanYears} onChange={setLoanYears} />
              <InputSmall label="Target DSCR" value={targetDSCR} onChange={setTargetDSCR} step="0.05" />
              <InputSmall label="Target payback (yrs)" value={targetPaybackYears} onChange={setTargetPaybackYears} step="0.1" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Box>
                <Row k="OCF before debt" v={formatMoney(econ.ocfBeforeDebt)} />
                <Row k="Annual debt service" v={formatMoney(econ.annualDebtService)} />
                <Row k="DSCR" v={Number.isFinite(econ.dscr) ? econ.dscr.toFixed(2) : '∞'} strong />
              </Box>
              <Box>
                <Row k="Y1 cash to buyer" v={formatMoney(econ.fcfToEquityYr1)} strong={econ.fcfToEquityYr1 >= 0} />
                <Row k="Cash-on-cash (Y1)" v={Number.isFinite(econ.cashOnCashYr1) ? (econ.cashOnCashYr1 * 100).toFixed(1) + '%' : '∞'} />
                <Row k="Equity invested" v={formatMoney(econ.equity)} />
              </Box>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <InfoCard label="Payback (operator)" value={Number.isFinite(econ.operatorPaybackYears) ? econ.operatorPaybackYears.toFixed(1) + ' yrs' : '∞'} />
              <InfoCard label="Payback (managed)" value={Number.isFinite(econ.managedPaybackYears) ? econ.managedPaybackYears.toFixed(1) + ' yrs' : '∞'} />
              <InfoCard label={`Max price @ DSCR ${targetDSCR}`} value={formatMoney(dscrCapPrice)} />
            </div>

            <div className="rounded-xl border p-4 mt-3 bg-white">
              <div className="text-sm text-gray-600">Max price at your targets</div>
              <div className="text-sm">Managed payback {targetPaybackYears} yrs: <span className="font-semibold">{formatMoney(paybackCapPrice)}</span></div>
              <div className="text-xs text-gray-500 mt-2">
                Rule of thumb: price ÷ SDE ≈ payback in years (operator). To buy an <em>asset</em> not a <em>job</em>, check it also works after paying a manager.
              </div>
            </div>
          </div>

          {/* Ops/Sellability */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold">Operations / Sellability</h2>
            <div className="text-sm text-gray-600">Helps marketability and nudges the multiple a bit (capped at +0.30×). Lenders still underwrite cash flow.</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Check label="Manager in place" value={hasManager} setValue={setHasManager} />
              <Check label="Staff can run without owner" value={staffCanRun} setValue={setStaffCanRun} />
              <Check label="Documented SOPs" value={documentedSOPs} setValue={setDocumentedSOPs} />
              <Check label="Systems in place" value={systemsInPlace} setValue={setSystemsInPlace} />
              <Check label="Recurring contracts" value={recurringContracts} setValue={setRecurringContracts} />
              <Check label="Diversified customers" value={diversifiedCustomers} setValue={setDiversifiedCustomers} />
              <Check label="Clean books" value={cleanBooks} setValue={setCleanBooks} />
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Sellability score: <span className="font-semibold">{ops.ops_score}/{ops.ops_max}</span> • Ops adj: <span className="font-semibold">+{ops.ops_bump.toFixed(2)}×</span>
            </div>
          </div>

          {/* Assets Track (ANAV) */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold">Assets Track (ANAV)</h2>
            <div className="text-sm text-gray-600">
              Essential gear is assumed included in the earnings valuation. Surplus gear/inventory can be added on top. Real estate is separate.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <InfoCard label="ANAV (FMV)" value={formatMoney(anav.anavFMV)} />
              <InfoCard label={`OLV (~${(Number(olvFactor)*100).toFixed(0)}%)`} value={formatMoney(anav.anavOLV)} />
            </div>
            {assetHeavy && (
              <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                Asset-heavy: buyers may anchor near asset value unless earnings clearly justify more.
              </div>
            )}
            {(surplusFMV > 0 || inventoryCost > 0 || includeRealEstate) && (
              <div className="mt-3 rounded-xl border p-4">
                <div className="text-sm text-gray-600">If selling extras with the business:</div>
                <div className="text-lg font-semibold">
                  Indicative package: {formatMoney(combinedIfSellingExtras)}
                </div>
                <div className="text-xs text-gray-500">= recommended business + surplus equipment + inventory{includeRealEstate ? ' + real estate' : ''}</div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold mb-2">Valuation Summary (plain English)</h2>
            <textarea className="w-full border rounded p-3 text-sm h-60" value={summaryText} readOnly />
            <div className="text-xs text-gray-500 mt-2">
              Tip: paste this into an email to the seller or your advisor.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ResultCard({ label, value, highlight = false }) {
  const amt = Number(value || 0);
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-lg font-semibold">{formatMoney(amt)}</div>
    </div>
  );
}

function InputSmall({ label, value, onChange, step }) {
  return (
    <div>
      <label className="block text-sm text-gray-700">{label}</label>
      <input
        type="number"
        step={step || '1'}
        className="w-full border rounded p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Check({ label, value, setValue }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" checked={value} onChange={(e) => setValue(e.target.checked)} />
      {label}
    </label>
  );
}

function Box({ children }) {
  return <div className="rounded-xl border p-4 bg-white">{children}</div>;
}

function Row({ k, v, strong }) {
  return (
    <div className="flex justify-between text-sm">
      <div className="text-gray-600">{k}</div>
      <div className={`${strong ? 'font-semibold' : ''}`}>{v}</div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border p-4 bg-white">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(BusinessValuation), { ssr: false });

