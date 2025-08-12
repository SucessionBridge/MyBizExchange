// pages/business-valuation.js
import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  INDUSTRY_MULTIPLES,
  computeAdjustments,
  effectiveMultiples,
  calculateSDEMultipleValues,
  calculateDCF,
  formatMoney,
  percentDelta,
  normalizeIndustry,
  computeBuyerEconomics,
  maxPriceForTargetDSCR,
  maxPriceForManagedPayback,
  computeANAV,
  recommendedPrice,
  isAssetHeavy,
} from '../lib/valuation';

/* ---------- Tiny UI helpers ---------- */
function Section({ title, children, subtitle }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Collapsible({ label = "What's this?", children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-blue-700 hover:underline"
      >
        {open ? 'Hide explanation' : label}
      </button>
      {open && <div className="mt-2 text-sm text-gray-700">{children}</div>}
    </div>
  );
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

function Input({ label, value, onChange, type = 'text', placeholder, help }) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={type}
        className="w-full border rounded p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {help && <div className="text-xs text-gray-500 mt-1">{help}</div>}
    </div>
  );
}

function MoneyInput(props) {
  return <Input type="number" {...props} />;
}

/* ---------- Page ---------- */
function BusinessValuation() {
  /* A) SUPER-SIMPLE OWNER INPUTS (top of page) */
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('service');

  // SDE direct entry, with optional calculator
  const [sdeDirect, setSdeDirect] = useState('');
  const [showSdeCalc, setShowSdeCalc] = useState(false);
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [annualExpenses, setAnnualExpenses] = useState('');
  const [ownerAddBacks, setOwnerAddBacks] = useState('');

  // Minimal asset extras the seller may include
  const [surplusFMV, setSurplusFMV] = useState('');         // extra truck, spare gear
  const [inventoryCost, setInventoryCost] = useState('');   // inventory at cost
  const [includeRealEstate, setIncludeRealEstate] = useState(false);
  const [realEstateFMV, setRealEstateFMV] = useState('');

  // One plain-English ops control
  const [opsStrength, setOpsStrength] = useState('none'); // none=0, some=0.10, yes=0.20, excellent=0.30

  // Reveal the report
  const [showReport, setShowReport] = useState(false);

  /* B) REPORT-ONLY CONTROLS (collapsed by default) */
  // Buyer terms (used to cap the “recommended” price)
  const [managerWage, setManagerWage] = useState('80000');
  const [capexReserve, setCapexReserve] = useState('0');
  const [downPaymentPct, setDownPaymentPct] = useState('20');
  const [loanInterestPct, setLoanInterestPct] = useState('10');
  const [loanYears, setLoanYears] = useState('5');
  const [targetDSCR, setTargetDSCR] = useState('1.25');
  const [targetPaybackYears, setTargetPaybackYears] = useState('3');
  const [analyzePrice, setAnalyzePrice] = useState(''); // optional override for Buyer Check

  // Advanced valuation knobs (collapsed)
  const [riskScore, setRiskScore] = useState('3');
  const [ownerDepScore, setOwnerDepScore] = useState('3');
  const [growthRate, setGrowthRate] = useState('4');
  const [discountRate, setDiscountRate] = useState('22');
  const [terminalMultiple, setTerminalMultiple] = useState('3.0');
  const [workingCapital, setWorkingCapital] = useState('0');
  const [sellerCarryAllowed, setSellerCarryAllowed] = useState(false);

  // Asset detail knobs (report-only)
  const [essentialFMV, setEssentialFMV] = useState(''); // context only; not added
  const [liabilitiesToClear, setLiabilitiesToClear] = useState('');
  const [olvFactor, setOlvFactor] = useState('0.75');

  /* ---------- Derived values ---------- */
  const sdeComputed = useMemo(() => {
    const rev = Number(annualRevenue || 0);
    const exp = Number(annualExpenses || 0);
    const add = Number(ownerAddBacks || 0);
    return Math.max(0, rev - exp + add);
  }, [annualRevenue, annualExpenses, ownerAddBacks]);

  const sdeUsed = Number(sdeDirect || sdeComputed || 0);

  const industryKey = normalizeIndustry(industry);
  const baseTriplet = INDUSTRY_MULTIPLES[industryKey] || INDUSTRY_MULTIPLES.fallback;

  // Convert opsStrength select to a multiple bump
  const opsBump = useMemo(() => {
    switch (opsStrength) {
      case 'some': return 0.10;
      case 'yes': return 0.20;
      case 'excellent': return 0.30;
      default: return 0.0;
    }
  }, [opsStrength]);

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

  const effective = useMemo(
    () => effectiveMultiples(baseTriplet, adjustments.total + opsBump),
    [baseTriplet, adjustments.total, opsBump]
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

  // Assets track
  const anav = useMemo(
    () =>
      computeANAV({
        essentialFMV: Number(essentialFMV || 0),
        surplusFMV: Number(surplusFMV || 0),
        inventoryCost: Number(inventoryCost || 0),
        liabilities: Number(liabilitiesToClear || 0),
        olvFactor: Number(olvFactor || 0.75),
      }),
    [essentialFMV, surplusFMV, inventoryCost, liabilitiesToClear, olvFactor]
  );

  const assetHeavy = useMemo(
    () => isAssetHeavy({ anavFMV: anav.anavFMV, obvBase: sdeValues.base, threshold: 1.3 }),
    [anav.anavFMV, sdeValues.base]
  );

  // Buyer finance caps (use either analyzePrice override or recommended/base)
  const priceForBuyerCheck = useMemo(() => {
    const override = Number(analyzePrice || 0);
    return override > 0 ? override : sdeValues.base;
  }, [analyzePrice, sdeValues.base]);

  const econ = useMemo(
    () =>
      computeBuyerEconomics({
        price: priceForBuyerCheck,
        sde: sdeUsed,
        managerWage: Number(managerWage || 0),
        capexReserve: Number(capexReserve || 0),
        downPaymentPct: Number(downPaymentPct || 0) / 100,
        interestPct: Number(loanInterestPct || 0),
        loanYears: Number(loanYears || 0),
        workingCapital: Number(workingCapital || 0),
        closingCosts: 0,
      }),
    [priceForBuyerCheck, sdeUsed, managerWage, capexReserve, downPaymentPct, loanInterestPct, loanYears, workingCapital]
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
        targetDSCR: Number(targetDSCR || 0),
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

  const combinedIfSellingExtras = useMemo(() => {
    return (
      recommended +
      Math.max(0, Number(surplusFMV || 0)) +
      Math.max(0, Number(inventoryCost || 0)) +
      (includeRealEstate ? Math.max(0, Number(realEstateFMV || 0)) : 0)
    );
  }, [recommended, surplusFMV, inventoryCost, includeRealEstate, realEstateFMV]);

  /* ---------- Summary text (plain English) ---------- */
  const summaryText = useMemo(() => {
    const lines = [];
    lines.push('Valuation Summary');
    lines.push('');
    lines.push(`Recommended asking (earnings-based, lender-capped): ${formatMoney(recommended)}`);
    lines.push(`Fair range (SDE multiples): ${formatMoney(sdeValues.low)} – ${formatMoney(sdeValues.high)} (Base ${formatMoney(sdeValues.base)})`);
    lines.push(`SDE used: ${formatMoney(sdeUsed)} • Industry: ${industry}`);
    if (opsBump > 0) lines.push(`Small bump for “runs without owner”: +${opsBump.toFixed(2)}×`);
    lines.push('');
    lines.push(`Assets track (for context): ${formatMoney(anav.anavFMV)} FMV • OLV (~${(Number(olvFactor) * 100).toFixed(0)}%): ${formatMoney(anav.anavOLV)}`);
    if (assetHeavy) lines.push('Note: Asset-heavy profile — buyers may anchor near asset value unless earnings justify more.');
    if (Number(surplusFMV || 0) > 0 || Number(inventoryCost || 0) > 0 || includeRealEstate) {
      lines.push('');
      lines.push(`If you include extras, an indicative package could be ~ ${formatMoney(combinedIfSellingExtras)} (business + surplus + inventory${includeRealEstate ? ' + building' : ''}).`);
    }
    lines.push('');
    lines.push(`DCF cross-check: ${formatMoney(dcfValue)} (projection method; not the headline)`);
    return lines.join('\n');
  }, [
    recommended, sdeValues.low, sdeValues.high, sdeValues.base,
    sdeUsed, industry, opsBump, anav.anavFMV, anav.anavOLV, olvFactor,
    assetHeavy, surplusFMV, inventoryCost, includeRealEstate, combinedIfSellingExtras, dcfValue
  ]);

  /* ---------- Actions ---------- */
  function handleSeeMyValuation() {
    if (!email) return alert('Please add your email so we can save/send your valuation.');
    if (sdeUsed <= 0) return alert('Please enter SDE (or expand “Don’t know SDE?” to compute it).');
    setShowReport(true);
    if (!analyzePrice) setAnalyzePrice(String(recommended || sdeValues.base || 0));
  }

  async function handleSaveAndEmail() {
    if (!email) return alert('Please add your email.');
    if (sdeUsed <= 0) return alert('Please enter SDE first.');
    const inputs = {
      source: 'owner_prelist_simple',
      email,
      industry_label: industry,
      sde_direct: sdeDirect ? Number(sdeDirect) : null,
      sde_computed: sdeComputed,
      sde_used: sdeUsed,
      extras: {
        surplus_fmv: Number(surplusFMV || 0),
        inventory_cost: Number(inventoryCost || 0),
      },
      real_estate: { included: includeRealEstate, fmv: Number(realEstateFMV || 0) },
      ops_strength: opsStrength,
      buyer_terms: {
        manager_wage: Number(managerWage || 0),
        down_payment_pct: Number(downPaymentPct || 0),
        interest_pct: Number(loanInterestPct || 0),
        loan_years: Number(loanYears || 0),
        capex_reserve: Number(capexReserve || 0),
        target_dscr: Number(targetDSCR || 0),
        target_payback_years: Number(targetPaybackYears || 0),
      },
      advanced: {
        risk: Number(riskScore || 3),
        owner_dependency: Number(ownerDepScore || 3),
        growth_pct: Number(growthRate || 0),
        discount_pct: Number(discountRate || 0),
        terminal_multiple: Number(terminalMultiple || 3),
        working_capital: Number(workingCapital || 0),
        seller_carry_allowed: Boolean(sellerCarryAllowed),
        base_multiples: { low: baseTriplet[0], base: baseTriplet[1], high: baseTriplet[2] },
        ops_bump: opsBump,
      },
      assets_detail: {
        essential_fmv: Number(essentialFMV || 0),
        liabilities_to_clear: Number(liabilitiesToClear || 0),
        olv_factor: Number(olvFactor || 0.75),
      },
    };

    const outputs = {
      effective_multiples: { low: Number(effective[0]), base: Number(effective[1]), high: Number(effective[2]) },
      sde_values: { low: sdeValues.low, base: sdeValues.base, high: sdeValues.high },
      dcf_value: dcfValue,
      buyer_caps: { dscr_cap_price: dscrCapPrice, payback_cap_price: paybackCapPrice },
      anav: { fmv: anav.anavFMV, olv: anav.anavOLV },
      recommended_value: recommended,
      summary_text: summaryText,
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
      alert('Saved. We’ll email you your valuation and explanations.');
      setShowReport(true);
    }
  }

  /* ---------- Render ---------- */
  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* A) Minimal inputs */}
        <div className="bg-white rounded-xl shadow p-5">
          <h1 className="text-2xl font-bold">Value Your Business</h1>
          <p className="text-sm text-gray-600 mt-1">
            Just a few fields. We’ll do the math and show a clear valuation below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <Input label="Your Email *" value={email} onChange={setEmail} placeholder="you@example.com" />
            <div>
              <label className="block text-sm font-medium">Industry</label>
              <select
                className="w-full border rounded p-2"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                {Object.keys(INDUSTRY_MULTIPLES)
                  .filter((k) => k !== 'fallback')
                  .map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
              </select>
            </div>

            <MoneyInput
              label="What you take home each year (SDE) *"
              value={sdeDirect}
              onChange={setSdeDirect}
              placeholder="e.g., 190000"
              help="If you don’t know SDE, click the link below to calculate it from revenue, expenses, and add-backs."
            />
            <div className="flex items-end">
              <button
                type="button"
                className="text-sm text-blue-700 hover:underline"
                onClick={() => setShowSdeCalc((v) => !v)}
              >
                {showSdeCalc ? 'Hide SDE calculator' : "Don't know SDE? Click to calculate"}
              </button>
            </div>
          </div>

          {showSdeCalc && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MoneyInput label="Annual Revenue ($)" value={annualRevenue} onChange={setAnnualRevenue} />
              <MoneyInput label="Annual Expenses ($)" value={annualExpenses} onChange={setAnnualExpenses} />
              <MoneyInput label="Owner Add-backs ($)" value={ownerAddBacks} onChange={setOwnerAddBacks} />
              <div className="sm:col-span-3 text-xs text-gray-600">
                SDE = Revenue − Expenses + Owner Add-backs → <span className="font-semibold">{formatMoney(sdeComputed)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <MoneyInput
              label="Surplus / non-essential equipment ($)"
              value={surplusFMV}
              onChange={setSurplusFMV}
              placeholder="optional"
              help="Extra gear you could include (not needed day-to-day). Added 1:1 on top of the business price."
            />
            <MoneyInput
              label="Inventory at cost ($)"
              value={inventoryCost}
              onChange={setInventoryCost}
              placeholder="optional"
              help="Often priced at cost and added on top."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-sm font-medium">Does it run without you?</label>
              <select
                className="w-full border rounded p-2"
                value={opsStrength}
                onChange={(e) => setOpsStrength(e.target.value)}
              >
                <option value="none">Not really (no bump)</option>
                <option value="some">Somewhat (+0.10×)</option>
                <option value="yes">Yes, mostly (+0.20×)</option>
                <option value="excellent">It runs itself (+0.30×)</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                A small bump rewards manager/SOPs, but lenders still underwrite cash flow.
              </div>
            </div>

            <div className="flex items-end gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeRealEstate}
                  onChange={(e) => setIncludeRealEstate(e.target.checked)}
                />
                I own the building (priced separately)
              </label>
            </div>
          </div>

          {includeRealEstate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <MoneyInput label="Building value ($)" value={realEstateFMV} onChange={setRealEstateFMV} />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={handleSeeMyValuation}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              See my valuation
            </button>
            <button
              onClick={handleSaveAndEmail}
              className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-black/90"
            >
              Save & email me this valuation
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            We’ll save your numbers and send the valuation with plain-English explanations.
          </div>
        </div>

        {/* B) VALUATION REPORT */}
        {showReport && (
          <>
            {/* Headline */}
            <Section
              title="Recommended Asking Price"
              subtitle="Based on earnings (SDE Base), capped by typical lender math (DSCR & payback) with a safety pad."
            >
              <div className="text-3xl font-bold">{formatMoney(recommended)}</div>
              <div className="text-sm text-gray-600 mt-1">
                Fair range: {formatMoney(sdeValues.low)} – {formatMoney(sdeValues.high)} • Base {formatMoney(sdeValues.base)}
              </div>
              <Collapsible>
                We start with your owner earnings (SDE) and apply a typical multiple for your industry. We then cap
                it using buyer finance math so the number is realistic to fund.
              </Collapsible>
            </Section>

            {/* Earnings section */}
            <Section title="Business (earnings-based)">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoCard label="SDE used" value={formatMoney(sdeUsed)} />
                <InfoCard label="Base multiple (after small bumps)" value={`${effective[1].toFixed(2)}×`} />
                <InfoCard label="Base value" value={formatMoney(sdeValues.base)} />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <InfoCard label="Low" value={formatMoney(sdeValues.low)} />
                <InfoCard label="Base" value={formatMoney(sdeValues.base)} />
                <InfoCard label="High" value={formatMoney(sdeValues.high)} />
              </div>
              <Collapsible>
                We value small businesses on <strong>SDE</strong> (what an owner makes each year). The multiple depends on industry and
                how easily the business runs without you. This produces a reasonable <em>range</em> rather than an exact number.
              </Collapsible>
            </Section>

            {/* Assets track */}
            <Section title="Assets (ANAV)">
              <div className="text-sm text-gray-600">
                Essential gear is assumed included in the earnings valuation (not added again). Surplus gear/inventory can be added on top. Real estate is separate.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <InfoCard label="ANAV (FMV)" value={formatMoney(anav.anavFMV)} />
                <InfoCard label={`OLV (~${(Number(olvFactor) * 100).toFixed(0)}%)`} value={formatMoney(anav.anavOLV)} />
              </div>
              {assetHeavy && (
                <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                  Asset-heavy: buyers may anchor near asset value unless earnings clearly justify more.
                </div>
              )}
              {(Number(surplusFMV || 0) > 0 || Number(inventoryCost || 0) > 0 || includeRealEstate) && (
                <div className="mt-3 rounded-xl border p-4">
                  <div className="text-sm text-gray-600">If selling extras with the business:</div>
                  <div className="text-lg font-semibold">
                    Indicative package: {formatMoney(combinedIfSellingExtras)}
                  </div>
                  <div className="text-xs text-gray-500">
                    = recommended business + surplus equipment + inventory{includeRealEstate ? ' + real estate' : ''}
                  </div>
                </div>
              )}

              {/* Asset details (collapsed inputs) */}
              <Collapsible label="Adjust asset details">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <MoneyInput label="Essential equipment FMV ($)" value={essentialFMV} onChange={setEssentialFMV} />
                  <MoneyInput label="Liabilities to clear ($)" value={liabilitiesToClear} onChange={setLiabilitiesToClear} />
                  <Input label="OLV factor (0–1)" type="number" value={olvFactor} onChange={setOlvFactor} />
                </div>
              </Collapsible>
            </Section>

            {/* Real estate */}
            {includeRealEstate && (
              <Section title="Real estate (separate)">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoCard label="Building value" value={formatMoney(Number(realEstateFMV || 0))} />
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Real estate is typically priced and financed separately from the operating business.
                </div>
              </Section>
            )}

            {/* Buyer reality check (collapsed by default) */}
            <Section title="Buyer Reality Check" subtitle="Can a typical buyer finance this?">
              <div className="text-xs text-gray-500">
                DSCR = cash flow ÷ annual loan payments. ≥1.25 is commonly financeable. Payback (managed) uses SDE minus a market manager wage and capex reserve.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="rounded-xl border p-4 bg-white">
                  <Row k="Analyzed price" v={formatMoney(priceForBuyerCheck)} />
                  <Row k="OCF before debt" v={formatMoney(econ.ocfBeforeDebt)} />
                  <Row k="Annual debt service" v={formatMoney(econ.annualDebtService)} />
                  <Row k="DSCR" v={Number.isFinite(econ.dscr) ? econ.dscr.toFixed(2) : '∞'} strong />
                </div>
                <div className="rounded-xl border p-4 bg-white">
                  <Row k="Y1 cash to buyer" v={formatMoney(econ.fcfToEquityYr1)} strong={econ.fcfToEquityYr1 >= 0} />
                  <Row k="Cash-on-cash (Y1)" v={Number.isFinite(econ.cashOnCashYr1) ? (econ.cashOnCashYr1 * 100).toFixed(1) + '%' : '∞'} />
                  <Row k="Equity invested" v={formatMoney(econ.equity)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <InfoCard label="Payback (operator)" value={Number.isFinite(econ.operatorPaybackYears) ? econ.operatorPaybackYears.toFixed(1) + ' yrs' : '∞'} />
                <InfoCard label="Payback (managed)" value={Number.isFinite(econ.managedPaybackYears) ? econ.managedPaybackYears.toFixed(1) + ' yrs' : '∞'} />
                <InfoCard label={`Max price @ DSCR ${targetDSCR}`} value={formatMoney(dscrCapPrice)} />
              </div>

              <Collapsible label="Adjust buyer assumptions">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <MoneyInput label="Manager wage ($/yr)" value={managerWage} onChange={setManagerWage} />
                  <MoneyInput label="Capex reserve ($/yr)" value={capexReserve} onChange={setCapexReserve} />
                  <Input label="Down payment (%)" type="number" value={downPaymentPct} onChange={setDownPaymentPct} />
                  <Input label="Interest rate (%)" type="number" value={loanInterestPct} onChange={setLoanInterestPct} />
                  <Input label="Loan term (years)" type="number" value={loanYears} onChange={setLoanYears} />
                  <Input label="Target DSCR" type="number" value={targetDSCR} onChange={setTargetDSCR} />
                  <Input label="Target payback (yrs)" type="number" value={targetPaybackYears} onChange={setTargetPaybackYears} />
                  <MoneyInput label="Analyze price (optional)" value={analyzePrice} onChange={setAnalyzePrice} help="Leave blank to analyze the base value." />
                </div>
              </Collapsible>
            </Section>

            {/* Advanced details (collapsed) */}
            <Section title="Advanced details (optional)">
              <Collapsible label="Show advanced controls">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <Input label="Risk (1–5)" type="number" value={riskScore} onChange={setRiskScore} />
                  <Input label="Owner-dependency (1–5)" type="number" value={ownerDepScore} onChange={setOwnerDepScore} />
                  <Input label="Growth %" type="number" value={growthRate} onChange={setGrowthRate} />
                  <Input label="Discount %" type="number" value={discountRate} onChange={setDiscountRate} />
                  <Input label="Terminal multiple ×" type="number" value={terminalMultiple} onChange={setTerminalMultiple} />
                  <MoneyInput label="Working capital need ($)" value={workingCapital} onChange={setWorkingCapital} />
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={sellerCarryAllowed} onChange={(e) => { /* eslint-disable-next-line */ setSellerCarryAllowed(e.target.checked); }} />
                    Seller carry allowed
                  </label>
                </div>
                <div className="mt-3 rounded border p-3 text-sm text-gray-700">
                  <div><strong>DCF cross-check:</strong> {formatMoney(dcfValue)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    DCF = Discounted Cash Flow. We project 5 years of owner cash flow (SDE), then “bring it back to today” using your discount %. It’s a cross-check, not the headline.
                  </div>
                </div>
              </Collapsible>
            </Section>

            {/* Plain-English summary */}
            <Section title="Valuation Summary (plain English)">
              <textarea className="w-full border rounded p-3 text-sm h-64" readOnly value={summaryText} />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigator.clipboard.writeText(summaryText).then(() => alert('Summary copied.'))}
                  className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200"
                >
                  Copy Summary
                </button>
              </div>
            </Section>
          </>
        )}
      </div>
    </main>
  );
}

export default dynamic(() => Promise.resolve(BusinessValuation), { ssr: false });


