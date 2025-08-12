// pages/valuation-tool.js
import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

import {
  INDUSTRY_MULTIPLES,
  DEFAULT_EBITDA_MULTIPLES,
  DEFAULT_REVENUE_MULTIPLES,
  normalizeIndustry,
  computeAdjustments,
  effectiveMultiples,
  calculateSDEMultipleValues,
  calculateEBITDAValues,
  calculateRevenueValues,
  calculateDCF,
  formatMoney,
  percentDelta,
} from '../lib/valuation';

// NOTE: export is at the bottom via dynamic(..., { ssr: false }) to avoid SSR hydration issues.

function ValuationTool() {
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyerEmail, setBuyerEmail] = useState('');

  // Inputs / assumptions
  const [sdeInput, setSdeInput] = useState(0);
  const [industryKey, setIndustryKey] = useState('fallback');
  const [industryTriplet, setIndustryTriplet] = useState([2.5, 3.0, 3.5]);

  const [growthRate, setGrowthRate] = useState(4);
  const [discountRate, setDiscountRate] = useState(22);
  const [terminalMultiple, setTerminalMultiple] = useState(3.0);

  const [riskScore, setRiskScore] = useState(3);              // 1=low risk … 5=high risk
  const [ownerDepScore, setOwnerDepScore] = useState(3);      // 1=low dep … 5=high dep
  const [workingCapital, setWorkingCapital] = useState(0);    // positive need subtracts
  const [sellerCarryAllowed, setSellerCarryAllowed] = useState(false);

  const [showEbitdaRevenue, setShowEbitdaRevenue] = useState(false);
  const [ebitdaOverride, setEbitdaOverride] = useState('');
  const [revenueInput, setRevenueInput] = useState('');
  const [ebitdaMultiples, setEbitdaMultiples] = useState([...DEFAULT_EBITDA_MULTIPLES]);
  const [revenueMultiples, setRevenueMultiples] = useState([...DEFAULT_REVENUE_MULTIPLES]);

  // Pull listingId from URL (e.g., /valuation-tool?listingId=123)
  const listingId = useMemo(() => {
    const raw = router.query?.listingId;
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [router.query]);

  // Try to prefill the email from the current session (non-blocking)
  useEffect(() => {
    (async () => {
      try {
        if (supabase?.auth?.getUser) {
          const { data } = await supabase.auth.getUser();
          const email = data?.user?.email || '';
          if (email) setBuyerEmail(email);
        }
      } catch (e) {
        console.warn('Could not prefill user email:', e);
      }
    })();
  }, []);

  // Load the listing once router is ready and listingId is present
  useEffect(() => {
    if (!router.isReady) return;
    if (!listingId) {
      // If no listingId query param, stop "Loading…" spinner and show instructions
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('sellers')
          .select('*')
          .eq('id', listingId)
          .maybeSingle();

        if (error) {
          console.error('Error loading listing:', error);
        }

        if (data) {
          setListing(data);
          const normalized = normalizeIndustry(data.industry);
          setIndustryKey(normalized);
          const baseTriplet = INDUSTRY_MULTIPLES[normalized] || INDUSTRY_MULTIPLES.fallback;
          setIndustryTriplet(baseTriplet);

          const initialSde = Number(data.annual_profit || 0);
          setSdeInput(initialSde);
          setRevenueInput(String(data.annual_revenue || ''));
        }
      } catch (e) {
        console.error('Unexpected error loading listing:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, listingId]);

  const adjustments = useMemo(
    () => computeAdjustments({ growthRatePct: growthRate, riskScore, ownerDepScore, sellerCarryAllowed }),
    [growthRate, riskScore, ownerDepScore, sellerCarryAllowed]
  );

  const effective = useMemo(
    () => effectiveMultiples(industryTriplet, adjustments.total),
    [industryTriplet, adjustments.total]
  );

  const sdeValues = useMemo(
    () =>
      calculateSDEMultipleValues({
        sde: Number(sdeInput || 0),
        multiples: effective,
        workingCapital: Number(workingCapital || 0),
      }),
    [sdeInput, effective, workingCapital]
  );

  const ebitdaValues = useMemo(() => {
    if (!showEbitdaRevenue) return null;
    const eVal = Number(ebitdaOverride || sdeInput || 0);
    return calculateEBITDAValues({
      ebitda: eVal,
      multiples: ebitdaMultiples.map(Number),
      workingCapital: Number(workingCapital || 0),
    });
  }, [showEbitdaRevenue, ebitdaOverride, sdeInput, ebitdaMultiples, workingCapital]);

  const revenueValues = useMemo(() => {
    if (!showEbitdaRevenue) return null;
    const rVal = Number(revenueInput || listing?.annual_revenue || 0);
    return calculateRevenueValues({
      revenue: rVal,
      multiples: revenueMultiples.map(Number),
      workingCapital: Number(workingCapital || 0),
    });
  }, [showEbitdaRevenue, revenueInput, listing?.annual_revenue, revenueMultiples, workingCapital]);

  const dcfValue = useMemo(
    () =>
      calculateDCF({
        sde: Number(sdeInput || 0),
        growthRatePct: Number(growthRate || 0),
        discountRatePct: Number(discountRate || 0),
        terminalMultiple: Number(terminalMultiple || 3),
        sellerCarryAllowed,
        workingCapital: Number(workingCapital || 0),
      }),
    [sdeInput, growthRate, discountRate, terminalMultiple, sellerCarryAllowed, workingCapital]
  );

  const asking = Number(listing?.asking_price || 0);

  const summaryText = useMemo(() => {
    const lines = [];
    lines.push(`Valuation Summary for ${listing?.business_name || (listingId ? 'Listing #' + listingId : 'Unknown Listing')}`);
    if (listing?.city || listing?.state_or_province) {
      lines.push(`${listing?.city || ''}${listing?.city && listing?.state_or_province ? ', ' : ''}${listing?.state_or_province || ''}`);
    }
    lines.push(`Industry: ${listing?.industry || 'N/A'}`);
    lines.push('');
    lines.push(`SDE used: ${formatMoney(sdeInput)} (adjustable)`);
    lines.push(`Industry multiples (adjusted): Low ${effective[0].toFixed(2)}× | Base ${effective[1].toFixed(2)}× | High ${effective[2].toFixed(2)}×`);
    lines.push(`SDE method results: Low ${formatMoney(sdeValues.low)}, Base ${formatMoney(sdeValues.base)}, High ${formatMoney(sdeValues.high)}`);
    if (showEbitdaRevenue && ebitdaValues) {
      lines.push(`EBITDA method: Low ${formatMoney(ebitdaValues.low)}, Base ${formatMoney(ebitdaValues.base)}, High ${formatMoney(ebitdaValues.high)}`);
    }
    if (showEbitdaRevenue && revenueValues) {
      lines.push(`Revenue method: Low ${formatMoney(revenueValues.low)}, Base ${formatMoney(revenueValues.base)}, High ${formatMoney(revenueValues.high)}`);
    }
    lines.push(`DCF (5y, terminal ${Number(terminalMultiple).toFixed(1)}×, growth ${Number(growthRate)}%, discount ${Number(discountRate)}%${sellerCarryAllowed ? ' (carry adj.)' : ''}): ${formatMoney(dcfValue)}`);
    if (asking) {
      lines.push('');
      lines.push(`Asking price: ${formatMoney(asking)}`);
      lines.push(`Δ vs Asking — SDE Base: ${formatMoney(sdeValues.base - asking)} (${percentDelta(sdeValues.base, asking).toFixed(1)}%)`);
    }
    lines.push('');
    lines.push(`Notes: Working capital applied ${formatMoney(workingCapital)}. Risk ${riskScore}/5, Owner-dependency ${ownerDepScore}/5. Seller carry ${sellerCarryAllowed ? 'YES' : 'NO'}.`);
    return lines.join('\n');
  }, [
    listing?.business_name,
    listing?.city,
    listing?.state_or_province,
    listing?.industry,
    listingId,
    sdeInput,
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
    if (!listingId) return alert('Add ?listingId= to the URL first.');
    if (!buyerEmail) return alert('Please enter your email to save valuations.');
    const inputs = {
      listing_id: listingId,
      buyer_email: buyerEmail,
      industry: industryKey,
      industry_multiples: { low: Number(industryTriplet[0]), base: Number(industryTriplet[1]), high: Number(industryTriplet[2]) },
      sde_input: Number(sdeInput || 0),
      used_annual_profit_as_sde: Boolean(listing?.annual_profit && Number(sdeInput) === Number(listing?.annual_profit)),
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
      revenue_input: revenueInput ? Number(revenueInput) : Number(listing?.annual_revenue || 0),
      revenue_multiples: { low: Number(revenueMultiples[0]), base: Number(revenueMultiples[1]), high: Number(revenueMultiples[2]) },
      adjustments: {
        risk: adjustments.risk,
        owner_dependency: adjustments.owner_dependency,
        growth: adjustments.growth,
        carry: adjustments.carry,
        total_applied: adjustments.total,
      },
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
    };

    try {
      const resp = await fetch('/api/valuations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          buyer_email: buyerEmail,
          inputs,
          outputs,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        alert(json.error || 'Failed to save valuation.');
      } else {
        alert('Valuation saved.');
      }
    } catch (e) {
      console.error('Save valuation failed:', e);
      alert('Save valuation failed. See console.');
    }
  }

  async function handleLoad() {
    if (!listingId) return alert('Add ?listingId= to the URL first.');
    if (!buyerEmail) return alert('Enter your email to load your last valuation.');
    try {
      const url = `/api/valuations?listing_id=${encodeURIComponent(listingId)}&buyer_email=${encodeURIComponent(buyerEmail)}`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (!resp.ok) {
        alert(json.error || 'Failed to load valuation.');
        return;
      }
      const val = json?.valuation;
      if (!val) {
        alert('No saved valuation found for this listing and email.');
        return;
      }
      const i = val.inputs || {};
      const effTrip = i.industry_multiples ? [i.industry_multiples.low, i.industry_multiples.base, i.industry_multiples.high] : industryTriplet;

      setIndustryKey(i.industry || industryKey);
      setIndustryTriplet(effTrip.map(Number));
      setSdeInput(Number(i.sde_input || 0));
      setGrowthRate(Number(i.growth_rate_pct || 0));
      setDiscountRate(Number(i.discount_rate_pct || 0));
      setTerminalMultiple(Number(i.terminal_multiple || 3));
      setRiskScore(Number(i.risk_score || 3));
      setOwnerDepScore(Number(i.owner_dependency_score || 3));
      setWorkingCapital(Number(i.working_capital_adjustment || 0));
      setSellerCarryAllowed(Boolean(i.seller_carry_allowed));
      setShowEbitdaRevenue(Boolean(i.show_ebitda_revenue_methods));
      setEbitdaOverride(i.ebitda_value_override ?? '');
      const em = i.ebitda_multiples || {};
      setEbitdaMultiples([Number(em.low || 3), Number(em.base || 4), Number(em.high || 5)]);
      const rm = i.revenue_multiples || {};
      setRevenueMultiples([Number(rm.low || 0.6), Number(rm.base || 1.0), Number(rm.high || 1.4)]);
      setRevenueInput(String(i.revenue_input ?? listing?.annual_revenue ?? ''));
      alert('Loaded last valuation.');
    } catch (e) {
      console.error('Load valuation failed:', e);
      alert('Load valuation failed. See console.');
    }
  }

  async function handleSendToSeller() {
    if (!listingId) return alert('Add ?listingId= to the URL first.');
    try {
      const body = {
        topic: 'valuation',
        listing_id: listingId,
        listingId, // include both snake/camel just in case
        message: summaryText,
      };
      const resp = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        alert(json.error || 'Failed to send message.');
      } else {
        alert('Sent to seller.');
      }
    } catch (e) {
      console.error('Send to seller failed:', e);
      alert('Send to seller failed. See console.');
    }
  }

  // -------- RENDER --------

  // If Next.js router isn’t ready yet, show a simple loader
  if (!router.isReady) {
    return (
      <main className="min-h-screen p-6"><div className="max-w-6xl mx-auto">Loading…</div></main>
    );
  }

  // If user forgot listingId, show a clear instruction instead of infinite Loading…
  if (!listingId) {
    return (
      <main className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Valuation Tool</h1>
          <p className="text-gray-700">
            Please open this page with a listing id, e.g.: <code className="bg-gray-100 px-1 py-0.5 rounded">/valuation-tool?listingId=123</code>
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6"><div className="max-w-6xl mx-auto">Loading…</div></main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Listing recap + Assumptions */}
        <section className="bg-white rounded-xl shadow p-5 space-y-4">
          <h1 className="text-2xl font-bold">Valuation Tool</h1>

          <div className="text-sm text-gray-600">
            <div className="font-semibold">Listing</div>
            <div>{listing?.business_name || '—'}</div>
            <div className="text-gray-500">{[listing?.city, listing?.state_or_province].filter(Boolean).join(', ')}</div>
            <div>Industry: <span className="font-medium">{listing?.industry || 'N/A'}</span></div>
            <div>Asking Price: <span className="font-medium">{asking ? formatMoney(asking) : 'N/A'}</span></div>
            <div>Annual Revenue: <span className="font-medium">{formatMoney(listing?.annual_revenue || 0)}</span></div>
            <div>Annual Profit (SDE baseline): <span className="font-medium">{formatMoney(listing?.annual_profit || 0)}</span></div>
          </div>

          <div className="pt-2 border-t">
            <label className="block text-sm font-medium mb-1">Your Email (for saving/loading)</label>
            <input
              className="w-full border rounded p-2"
              placeholder="you@example.com"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">SDE (Profit)</label>
              <input
                type="number"
                className="w-full border rounded p-2"
                value={sdeInput}
                onChange={(e) => setSdeInput(Number(e.target.value || 0))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Industry</label>
              <select
                className="w-full border rounded p-2"
                value={industryKey}
                onChange={(e) => {
                  const k = e.target.value;
                  setIndustryKey(k);
                  setIndustryTriplet(INDUSTRY_MULTIPLES[k] || INDUSTRY_MULTIPLES.fallback);
                }}
              >
                {Object.keys(INDUSTRY_MULTIPLES).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Working Capital Need (+)</label>
              <input
                type="number"
                className="w-full border rounded p-2"
                value={workingCapital}
                onChange={(e) => setWorkingCapital(Number(e.target.value || 0))}
              />
            </div>
          </div>

          {/* Multiples editor */}
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

          {/* Risk / owner dep / growth / discount / terminal */}
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

          {/* Optional EBITDA/Revenue methods */}
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
                  <div>
                    <label className="block text-sm font-medium">Revenue ($)</label>
                    <input type="number" className="w-full border rounded p-2" value={revenueInput} onChange={(e) => setRevenueInput(e.target.value)} placeholder="Defaults to listing revenue" />
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
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Valuation</button>
            <button onClick={handleLoad} className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200">Load last valuation</button>
          </div>
        </section>

        {/* RIGHT: Results */}
        <section className="space-y-4">
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">SDE Multiple Method</h2>
              <div className="text-sm text-gray-500">Adj total: {adjustments.total.toFixed(2)}×</div>
            </div>
            <div className="text-sm text-gray-600">Effective multiples: Low {effective[0].toFixed(2)}× • Base {effective[1].toFixed(2)}× • High {effective[2].toFixed(2)}×</div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <ResultCard label="Low" value={sdeValues.low} asking={asking} />
              <ResultCard label="Base" value={sdeValues.base} asking={asking} highlight />
              <ResultCard label="High" value={sdeValues.high} asking={asking} />
            </div>
          </div>

          {showEbitdaRevenue && (
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-semibold">EBITDA & Revenue Methods</h2>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <ResultCard label="EBITDA Low" value={ebitdaValues?.low} asking={asking} />
                <ResultCard label="EBITDA Base" value={ebitdaValues?.base} asking={asking} />
                <ResultCard label="EBITDA High" value={ebitdaValues?.high} asking={asking} />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <ResultCard label="Revenue Low" value={revenueValues?.low} asking={asking} />
                <ResultCard label="Revenue Base" value={revenueValues?.base} asking={asking} />
                <ResultCard label="Revenue High" value={revenueValues?.high} asking={asking} />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold">Quick DCF (5-year + Terminal)</h2>
            <div className="text-sm text-gray-600">
              Growth {Number(growthRate)}% • Discount {Number(discountRate)}%{sellerCarryAllowed ? ' (carry adj.)' : ''} • Terminal {Number(terminalMultiple).toFixed(1)}×
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ResultCard label="DCF Value" value={dcfValue} asking={asking} highlight />
              <div className="rounded border p-3 text-sm text-gray-700">
                <div>Working capital applied: {formatMoney(workingCapital)}</div>
                <div>Risk {riskScore}/5 • Owner-dependency {ownerDepScore}/5</div>
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
              <button onClick={handleSendToSeller} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
                Send to Seller
              </button>
              {/* Optional PDF can be added later */}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ResultCard({ label, value, asking, highlight = false }) {
  const amt = Number(value || 0);
  const delta = asking ? amt - Number(asking) : null;
  const pct = asking ? percentDelta(amt, asking) : null;
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-lg font-semibold">{formatMoney(amt)}</div>
      {asking ? (
        <div className={`text-xs mt-1 ${delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          Δ vs Asking: {formatMoney(delta)} ({pct.toFixed(1)}%)
        </div>
      ) : (
        <div className="text-xs mt-1 text-gray-500">Asking price not set</div>
      )}
    </div>
  );
}

// Export the page as a client-only component to avoid SSR + browser-only libs issues.
export default dynamic(() => Promise.resolve(ValuationTool), { ssr: false });

