
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
} from '../lib/valuation';

function BusinessValuation() {
  // Funnel fields
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('service'); // sensible default
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [askingPrice, setAskingPrice] = useState('');

  // Financial inputs
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [annualExpenses, setAnnualExpenses] = useState('');
  const [ownerSalaryAddBack, setOwnerSalaryAddBack] = useState('');
  const [personalAddBacks, setPersonalAddBacks] = useState('');
  const [sdeOverride, setSdeOverride] = useState(''); // optional manual SDE

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

  const effective = useMemo(
    () => effectiveMultiples(industryTriplet, adjustments.total),
    [industryTriplet, adjustments.total]
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

  const asking = Number(askingPrice || 0);

  const summaryText = useMemo(() => {
    const lines = [];
    lines.push(`Valuation Summary${businessName ? ` for ${businessName}` : ''}`);
    if (city || province) lines.push([city, province].filter(Boolean).join(', '));
    lines.push(`Industry: ${industry}`);
    lines.push('');
    lines.push(`SDE used: ${formatMoney(sdeUsed)} (computed or manual)`);
    lines.push(`Industry multiples (adjusted): Low ${effective[0].toFixed(2)}× | Base ${effective[1].toFixed(2)}× | High ${effective[2].toFixed(2)}×`);
    lines.push(`SDE results: Low ${formatMoney(sdeValues.low)}, Base ${formatMoney(sdeValues.base)}, High ${formatMoney(sdeValues.high)}`);
    if (showEbitdaRevenue && ebitdaValues) {
      lines.push(`EBITDA method: Low ${formatMoney(ebitdaValues.low)}, Base ${formatMoney(ebitdaValues.base)}, High ${formatMoney(ebitdaValues.high)}`);
    }
    if (showEbitdaRevenue && revenueValues) {
      lines.push(`Revenue method: Low ${formatMoney(revenueValues.low)}, Base ${formatMoney(revenueValues.base)}, High ${formatMoney(revenueValues.high)}`);
    }
    lines.push(`DCF (5y, terminal ${Number(terminalMultiple).toFixed(1)}×, growth ${Number(growthRate)}%, discount ${Number(discountRate)}%${sellerCarryAllowed ? ' with carry adj.' : ''}): ${formatMoney(dcfValue)}`);
    if (asking > 0) {
      lines.push('');
      lines.push(`Your target asking price: ${formatMoney(asking)}`);
      lines.push(`Δ vs Asking — SDE Base: ${formatMoney(sdeValues.base - asking)} (${percentDelta(sdeValues.base, asking).toFixed(1)}%)`);
    }
    lines.push('');
    lines.push(`Notes: Working capital ${formatMoney(workingCapital)}. Risk ${riskScore}/5, Owner-dependency ${ownerDepScore}/5. Seller carry ${sellerCarryAllowed ? 'YES' : 'NO'}.`);
    return lines.join('\n');
  }, [
    businessName,
    city,
    province,
    industry,
    sdeUsed,
    effective,
    sdeValues,
    showEbitdaRevenue,
    ebitdaValues,
    revenueValues,
    dcfValue,
    terminalMultiple,
    growthRate,
    discountRate,
    sellerCarryAllowed,
    workingCapital,
    riskScore,
    ownerDepScore,
    asking,
  ]);

  async function handleSave() {
    if (!email) return alert('Please enter your email.');

    const inputs = {
      listing_id: null,
      source: 'owner_prelist',
      email,
      business_name: businessName || null,
      city: city || null,
      state_or_province: province || null,
      industry: normalizedIndustry,
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
      asking_price_self: asking || null,
      sde_computed: computedSDE,
      sde_used: sdeUsed,
      adjustments: { ...adjustments, total_applied: adjustments.total },
    };

    const outputs = {
      effective_multiples: { low: Number(effective[0]), base: Number(effective[1]), high: Number(effective[2]) },
      sde_multiple_values: { low: sdeValues.low, base: sdeValues.base, high: sdeValues.high },
      ebitda_values: ebitdaValues || { low: null, base: null, high: null },
      revenue_values: revenueValues || { low: null, base: null, high: null },
      dcf_value: dcfValue,
      working_capital_applied: Number(workingCapital || 0),
      asking_price: asking || null,
      deltas_vs_asking: asking
        ? {
            sde_low: { amount: sdeValues.low - asking, percent: percentDelta(sdeValues.low, asking) },
            sde_base: { amount: sdeValues.base - asking, percent: percentDelta(sdeValues.base, asking) },
            sde_high: { amount: sdeValues.high - asking, percent: percentDelta(sdeValues.high, asking) },
            dcf: { amount: dcfValue - asking, percent: percentDelta(dcfValue, asking) },
          }
        : null,
      recommended_method: 'SDE base',
      recommended_value: sdeValues.base,
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
      alert('Valuation saved — thanks! We’ll follow up by email.');
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Owner inputs */}
        <section className="bg-white rounded-xl shadow p-5 space-y-4">
          <h1 className="text-2xl font-bold">Value Your Business</h1>
          <p className="text-sm text-gray-600">
            Quick, owner-friendly estimate. This is guidance only — not investment, tax, or legal advice.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Your Email *</label>
              <input className="w-full border rounded p-2" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
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
              <label className="block text-sm font-medium">Industry</label>
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
            </div>
          </div>

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
              <label className="block text-sm font-medium">Owner Salary Add-Back ($)</label>
              <input type="number" className="w-full border rounded p-2" value={ownerSalaryAddBack} onChange={(e) => setOwnerSalaryAddBack(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Personal Add-Backs ($)</label>
              <input type="number" className="w-full border rounded p-2" value={personalAddBacks} onChange={(e) => setPersonalAddBacks(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">SDE Override ($) — optional</label>
              <input type="number" className="w-full border rounded p-2" value={sdeOverride} onChange={(e) => setSdeOverride(e.target.value)} placeholder={`Or use ${formatMoney(computedSDE)}`} />
            </div>
          </div>

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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Risk (1–5)</label>
              <input type="number" min={1} max={5} className="w-full border rounded p-2" value={riskScore} onChange={(e) => setRiskScore(Number(e.target.value || 3))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Owner-Dependency (1–5)</label>
              <input type="number" min={1} max={5} className="w-full border rounded p-2" value={ownerDepScore} onChange={(e) => setOwnerDepScore(Number(e.target.value || 3))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Growth %</label>
              <input type="number" step="0.1" className="w-full border rounded p-2" value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value || 0))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Discount %</label>
              <input type="number" step="0.1" className="w-full border rounded p-2" value={discountRate} onChange={(e) => setDiscountRate(Number(e.target.value || 0))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Terminal Multiple ×</label>
              <input type="number" step="0.1" className="w-full border rounded p-2" value={terminalMultiple} onChange={(e) => setTerminalMultiple(Number(e.target.value || 3))} />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sellerCarryAllowed} onChange={(e) => setSellerCarryAllowed(e.target.checked)} />
                Seller carry allowed
              </label>
            </div>
          </div>

          <div className="pt-2 border-t">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showEbitdaRevenue} onChange={(e) => setShowEbitdaRevenue(e.target.checked)} />
              Show EBITDA/Revenue methods
            </label>

            {showEbitdaRevenue && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">EBITDA Override ($)</label>
                    <input type="number" className="w-full border rounded p-2" value={ebitdaOverride} onChange={(e) => setEbitdaOverride(e.target.value)} placeholder="Leave blank to use SDE" />
                  </div>
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
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">SDE Multiple Method</h2>
              <div className="text-sm text-gray-500">Adj total: {adjustments.total.toFixed(2)}×</div>
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

          {showEbitdaRevenue && (
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-semibold">EBITDA & Revenue Methods</h2>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <ResultCard label="EBITDA Low" value={ebitdaValues?.low} />
                <ResultCard label="EBITDA Base" value={ebitdaValues?.base} />
                <ResultCard label="EBITDA High" value={ebitdaValues?.high} />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <ResultCard label="Revenue Low" value={revenueValues?.low} />
                <ResultCard label="Revenue Base" value={revenueValues?.base} />
                <ResultCard label="Revenue High" value={revenueValues?.high} />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold">Quick DCF (5-year + Terminal)</h2>
            <div className="text-sm text-gray-600">
              Growth {Number(growthRate)}% • Discount {Number(discountRate)}%{sellerCarryAllowed ? ' (carry adj.)' : ''} • Terminal {Number(terminalMultiple).toFixed(1)}×
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ResultCard label="DCF Value" value={dcfValue} highlight />
              <div className="rounded border p-3 text-sm text-gray-700">
                <div>SDE (computed): {formatMoney(computedSDE)} • SDE used: {formatMoney(sdeUsed)}</div>
                <div>Working capital applied: {formatMoney(workingCapital)}</div>
                {asking > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Δ vs Asking (Base): {formatMoney(sdeValues.base - asking)} ({percentDelta(sdeValues.base, asking).toFixed(1)}%)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold mb-2">Valuation Summary</h2>
            <textarea className="w-full border rounded p-3 text-sm h-48" value={summaryText} readOnly />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigator.clipboard.writeText(summaryText).then(() => alert('Summary copied.'))}
                className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200"
              >
                Copy Summary
              </button>
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

// Client-only export (safe with browser APIs if you add PDF later)
export default dynamic(() => Promise.resolve(BusinessValuation), { ssr: false });


