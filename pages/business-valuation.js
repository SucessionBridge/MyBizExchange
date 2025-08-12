// pages/business-valuation.js
import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf'; // top-level import for reliability
import {
  INDUSTRY_MULTIPLES,
  normalizeIndustry,
  formatMoney,
} from '../lib/valuation';

/* Route for seller onboarding (adjust if needed) */
const LIST_ROUTE = '/seller-onboarding';

/* ---------- Local pure helpers for the approved logic ---------- */
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function yearsBump(years) {
  const y = Number(years || 0);
  if (y <= 1) return -0.30;
  if (y <= 2) return -0.20;
  if (y <= 3) return -0.10;
  if (y <= 5) return 0.00;
  if (y <= 10) return 0.10;
  return 0.20; // >10
}

function runsWithoutOwnerBump(runs) { return runs ? 0.20 : 0.00; }
function franchiseBump(isFranchise) { return isFranchise ? 0.15 : 0.00; }

function adjustedMultiples(baseTriplet = [2.5, 3.0, 3.5], bumpSum = 0) {
  // Total bump clamped to -0.40 … +0.50, and each multiple floored at 0.5×
  const b = clamp(bumpSum, -0.40, 0.50);
  const [lo, mid, hi] = baseTriplet;
  return [Math.max(0.5, lo + b), Math.max(0.5, mid + b), Math.max(0.5, hi + b)];
}

/* ---------- Small UI helpers ---------- */
function Section({ title, children, subtitle }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
      <div className="mt-3">{children}</div>
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
function MoneyInput(props) { return <Input type="number" {...props} />; }

/* ---------- Page ---------- */
function BusinessValuation() {
  // Contact / names
  const [email, setEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');

  // Core fields
  const [industry, setIndustry] = useState('service');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [annualExpenses, setAnnualExpenses] = useState('');
  const [sdeDirect, setSdeDirect] = useState('');   // what they take home each year (SDE)
  const [showSdeCalc, setShowSdeCalc] = useState(false);

  const [inventoryCost, setInventoryCost] = useState(''); // added on top if included
  const [runsWithoutOwner, setRunsWithoutOwner] = useState(false);
  const [isFranchise, setIsFranchise] = useState(false);

  const [includeRealEstate, setIncludeRealEstate] = useState(false);
  const [realEstateFMV, setRealEstateFMV] = useState('');

  // Acknowledgment checkbox (must be ticked to proceed)
  const [ack, setAck] = useState(false);

  // Reveal report
  const [showReport, setShowReport] = useState(false);

  // Email flow loading state
  const [sending, setSending] = useState(false);

  /* ---------- Derived values (approved logic) ---------- */
  const sdeComputed = useMemo(() => {
    const rev = Number(annualRevenue || 0);
    const exp = Number(annualExpenses || 0);
    const sde = rev - exp;
    return Math.max(0, isFinite(sde) ? sde : 0);
  }, [annualRevenue, annualExpenses]);

  const sdeUsed = useMemo(() => {
    const direct = Number(sdeDirect || 0);
    if (direct > 0) return direct;
    return sdeComputed;
  }, [sdeDirect, sdeComputed]);

  const industryKey = normalizeIndustry(industry);
  const baseTriplet = INDUSTRY_MULTIPLES[industryKey] || INDUSTRY_MULTIPLES.fallback;

  const bumpSum = useMemo(() => {
    const y = yearsBump(Number(yearsInBusiness || 0));
    const r = runsWithoutOwnerBump(Boolean(runsWithoutOwner));
    const f = franchiseBump(Boolean(isFranchise));
    return y + r + f;
  }, [yearsInBusiness, runsWithoutOwner, isFranchise]);

  const adjMultiples = useMemo(() => adjustedMultiples(baseTriplet, bumpSum), [baseTriplet, bumpSum]);
  const [mLow, mBase, mHigh] = adjMultiples;

  const valueLow  = useMemo(() => Math.max(0, sdeUsed * mLow),  [sdeUsed, mLow]);
  const valueBase = useMemo(() => Math.max(0, sdeUsed * mBase), [sdeUsed, mBase]);
  const valueHigh = useMemo(() => Math.max(0, sdeUsed * mHigh), [sdeUsed, mHigh]);

  const paybackYears = useMemo(() => (sdeUsed > 0 ? valueBase / sdeUsed : Infinity), [valueBase, sdeUsed]);

  // Margin (context only)
  const margin = useMemo(() => {
    const rev = Number(annualRevenue || 0);
    const sde = Number(sdeUsed || 0);
    if (rev <= 0) return null;
    return sde / rev; // 0..1
  }, [annualRevenue, sdeUsed]);

  function marginComment(m) {
    if (m == null) return '—';
    if (m >= 0.30) return 'Unusually high margin — double-check SDE and expenses are recast correctly.';
    if (m >= 0.15) return 'Healthy margin common in many service businesses.';
    if (m >= 0.10) return 'Thin margin — buyers will scrutinize costs and seasonality.';
    return 'Very thin margin — expect buyers to negotiate hard.';
  }

  // Optional add-ons (inventory on top; real estate separate; combined shown for convenience)
  const inv = Number(inventoryCost || 0);
  const bldg = includeRealEstate ? Number(realEstateFMV || 0) : 0;

  const packageBusinessPlusInventory = useMemo(() => valueBase + Math.max(0, inv), [valueBase, inv]);
  const combinedWithBuilding = useMemo(
    () => packageBusinessPlusInventory + Math.max(0, bldg),
    [packageBusinessPlusInventory, bldg]
  );

  /* ---------- Summary text for PDF/email ---------- */
  const summaryText = useMemo(() => {
    const pct = margin == null ? null : (margin * 100);
    const lines = [];
    lines.push('Valuation Summary');
    if (ownerName || businessName) {
      lines.push([ownerName && `Owner: ${ownerName}`, businessName && `Business: ${businessName}`].filter(Boolean).join(' • '));
    }
    lines.push('');
    lines.push(`Fair Value (Base): ${formatMoney(valueBase)}`);
    lines.push(`Fair Range: ${formatMoney(valueLow)} – ${formatMoney(valueHigh)} (Adjusted multiples: ${mLow.toFixed(2)}× / ${mBase.toFixed(2)}× / ${mHigh.toFixed(2)}×)`);
    lines.push(`SDE used: ${formatMoney(sdeUsed)} • Industry: ${industry} • Years in business: ${yearsInBusiness || 'N/A'}`);
    if (Number(annualRevenue || 0) > 0) lines.push(`Annual revenue (context): ${formatMoney(Number(annualRevenue || 0))}`);
    lines.push(`Simple payback (Base ÷ SDE): ${Number.isFinite(paybackYears) ? paybackYears.toFixed(1) + ' years' : '—'}`);
    if (pct != null) lines.push(`SDE margin: ${pct.toFixed(1)}% — ${marginComment(margin)}`);
    if (inv > 0) lines.push(`If including inventory at cost: Business + Inventory ≈ ${formatMoney(packageBusinessPlusInventory)}`);
    if (bldg > 0) lines.push(`Building (separate): ${formatMoney(bldg)}`);
    if (inv > 0 || bldg > 0) lines.push(`Combined (Business + Inventory${bldg > 0 ? ' + Building' : ''}): ${formatMoney(combinedWithBuilding)}`);
    lines.push('');
    lines.push('How we calculated this:');
    lines.push(`• SDE × industry multiple (range ${baseTriplet[0]}–${baseTriplet[1]}–${baseTriplet[2]}×) with small bumps for track record, owner independence, and franchise.`);
    lines.push(`• Adjustments applied: Years + Runs without you + Franchise = ${(bumpSum >= 0 ? '+' : '')}${bumpSum.toFixed(2)}× total.`);
    lines.push('• Essential operating assets are assumed included; inventory is added at cost on top; real estate is separate.');
    lines.push('');
    lines.push('Important disclaimer: This is an indicative guide to help owners think about a fair asking range.');
    lines.push('It is not an appraisal and should not be used for bank loans, insurance, tax, or legal purposes.');
    lines.push('We have not verified the information you provided.');
    return lines.join('\n');
  }, [
    ownerName, businessName, valueBase, valueLow, valueHigh, mLow, mBase, mHigh,
    sdeUsed, industry, yearsInBusiness, annualRevenue, paybackYears,
    inv, bldg, packageBusinessPlusInventory, combinedWithBuilding,
    baseTriplet, bumpSum, margin
  ]);

  /* ---------- Actions ---------- */
  function requireAck() {
    if (!ack) {
      alert('Please acknowledge the disclaimer before continuing.');
      return false;
    }
    return true;
  }

  // NON-async, no await
  function handleSeeMyValuation() {
    if (!email) {
      alert('Please add your email.');
      return;
    }
    if (sdeUsed <= 0) {
      alert('Please enter SDE (or use the calculator).');
      return;
    }
    if (!requireAck()) return;

    // Lead capture (non-blocking; errors ignored)
    fetch('/api/valuation-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        owner_name: ownerName || null,
        business_name: businessName || null,
        industry,
        sde: sdeUsed,
        fair_low: valueLow,
        fair_base: valueBase,
        fair_high: valueHigh,
        years_in_business: Number(yearsInBusiness || 0),
      }),
    }).catch(() => {});

    setShowReport(true);
  }

  async function handleSaveAndEmail() {
    if (!email) return alert('Please add your email.');
    if (sdeUsed <= 0) return alert('Please enter SDE first.');
    if (!requireAck()) return;

    setSending(true);
    try {
      // 1) Save minimal snapshot (best-effort)
      try {
        const resp = await fetch('/api/valuations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listing_id: null,
            buyer_email: email,
            inputs: {
              source: 'owner_fair_value_v1',
              email,
              owner_name: ownerName || null,
              business_name: businessName || null,
              industry_label: industry,
              years_in_business: Number(yearsInBusiness || 0),
              annual_revenue: Number(annualRevenue || 0),
              annual_expenses: Number(annualExpenses || 0),
              sde_used: sdeUsed,
              inventory_cost: Number(inventoryCost || 0),
              runs_without_owner: Boolean(runsWithoutOwner),
              is_franchise: Boolean(isFranchise),
              real_estate: { included: includeRealEstate, fmv: Number(realEstateFMV || 0) },
            },
            outputs: {
              adjusted_multiples: { low: mLow, base: mBase, high: mHigh },
              fair_range: { low: valueLow, base: valueBase, high: valueHigh },
              payback_years: Number.isFinite(paybackYears) ? paybackYears : null,
              business_plus_inventory: packageBusinessPlusInventory,
              combined_with_building: combinedWithBuilding,
              summary_text: summaryText,
            },
          }),
        });
        await resp.json().catch(() => ({}));
      } catch (e) {
        console.warn('Save snapshot failed (continuing):', e);
      }

      // 2) Generate PDF
      const blob = await generatePdfBlob();
      const ab = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(ab)));

      // 3) Upload to storage → get URL
      const resp2 = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, filename: 'valuation-report.pdf', pdfBase64: base64 }),
      });
      const data2 = await resp2.json().catch(() => ({}));
      if (!resp2.ok || !data2?.url) {
        throw new Error(data2?.error || 'Upload failed');
      }

      // 4) Short mailto body (long bodies fail silently in many clients)
      const subject = 'Your Fair Valuation Summary';
      const body =
`Hi${ownerName ? ' ' + ownerName : ''},

Your valuation summary PDF is ready:
${data2.url}

— SuccessionBridge
(Indicative guide only — not an appraisal.)`;
      const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;

      setShowReport(true);
    } catch (err) {
      console.error('Email flow failed:', err);
      alert('Email flow failed: ' + (err?.message || err));
    } finally {
      setSending(false);
    }
  }

  // PDF (fair valuation only) — styled
  async function generatePdfBlob() {
    // uses top-level `import jsPDF from 'jspdf'`
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });

    // Layout + palette
    const PAGE_W = doc.internal.pageSize.getWidth();
    const MARGIN = 40;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    const INK = [17, 24, 39];        // gray-900
    const MUTED = [107, 114, 128];   // gray-500
    const BORDER = [229, 231, 235];  // gray-200
    const ACCENT = [37, 99, 235];    // blue-600
    const SOFT = [249, 250, 251];    // gray-50
    const WARN_BG = [255, 251, 235]; // amber-50
    const WARN_TX = [120, 53, 15];   // amber-900

    let y = 48;

    // Header
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('SuccessionBridge — Fair Valuation', MARGIN, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.setFontSize(10);
    doc.text(
      `Generated ${new Date().toLocaleDateString()} • Indicative guide only — not an appraisal.`,
      MARGIN,
      y
    );
    y += 16;

    // Disclaimer banner
    doc.setFillColor(...WARN_BG);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(MARGIN, y, CONTENT_W, 48, 6, 6, 'F');
    doc.setTextColor(...WARN_TX);
    doc.setFontSize(10);
    doc.text(
      'Not for lending, insurance, tax, or legal use. Info not verified.',
      MARGIN + 10,
      y + 18
    );
    doc.setTextColor(...MUTED);
    doc.text(
      'This is an indicative tool to help owners consider a fair asking range.',
      MARGIN + 10,
      y + 34
    );
    y += 64;

    // Fair Value card
    doc.setDrawColor(...BORDER);
    doc.setFillColor(...SOFT);
    doc.roundedRect(MARGIN, y, CONTENT_W, 90, 10, 10, 'F');

    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Fair Value (Base): ${formatMoney(valueBase)}`, MARGIN + 16, y + 28);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.setFontSize(11);
    doc.text(
      `Fair Range: ${formatMoney(valueLow)} – ${formatMoney(valueHigh)}`,
      MARGIN + 16,
      y + 48
    );
    doc.setTextColor(...ACCENT);
    doc.text(
      `Adjusted multiples: ${mLow.toFixed(2)}× / ${mBase.toFixed(2)}× / ${mHigh.toFixed(2)}×`,
      MARGIN + 16,
      y + 68
    );
    y += 110;

    // Key/Value helper
    function kv(label, value, x, yy) {
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(label, x, yy);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...INK);
      doc.setFontSize(11);
      doc.text(String(value ?? '—'), x, yy + 16);
      doc.setFont('helvetica', 'normal');
    }

    // Snapshot (two columns)
    const COL_W = (CONTENT_W - 20) / 2;
    const COL1 = MARGIN;
    const COL2 = MARGIN + COL_W + 20;
    let rowY = y;

    kv('SDE used', formatMoney(sdeUsed), COL1, rowY);
    kv('Industry', industry, COL1, rowY + 36);
    kv('Years in business', yearsInBusiness || 'N/A', COL1, rowY + 72);

    if (Number(annualRevenue || 0) > 0)
      kv('Annual revenue (gross sales)', formatMoney(Number(annualRevenue || 0)), COL2, rowY);
    kv('Simple payback (Base ÷ SDE)', Number.isFinite(paybackYears) ? `${paybackYears.toFixed(1)} years` : '—', COL2, rowY + 36);
    if (margin != null)
      kv('SDE margin (SDE ÷ Revenue)', `${(margin * 100).toFixed(1)}%`, COL2, rowY + 72);

    y = rowY + 108;

    // Margin note
    if (margin != null) {
      doc.setTextColor(...MUTED);
      doc.setFontSize(10);
      const note =
        margin >= 0.30
          ? 'Unusually high margin — double-check SDE and expenses are recast correctly.'
          : margin >= 0.15
          ? 'Healthy margin common in many service businesses.'
          : margin >= 0.10
          ? 'Thin margin — buyers will scrutinize costs and seasonality.'
          : 'Very thin margin — expect buyers to negotiate hard.';
      doc.text(note, MARGIN, y, { maxWidth: CONTENT_W });
      y += 18;
    }

    // Divider
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    y += 16;

    // Included vs added
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("What’s included vs added", MARGIN, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.setFontSize(10);
    doc.text(
      'Essential operating assets are assumed included. Inventory at cost is typically added on top. Real estate is separate.',
      MARGIN,
      y,
      { maxWidth: CONTENT_W }
    );
    y += 20;

    function chip(label, value, x, yy, w) {
      doc.setDrawColor(...BORDER);
      doc.setFillColor(...SOFT);
      doc.roundedRect(x, yy, w, 48, 8, 8, 'F');
      doc.setTextColor(...MUTED);
      doc.setFontSize(10);
      doc.text(label, x + 12, yy + 18);
      doc.setTextColor(...INK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(value, x + 12, yy + 36);
      doc.setFont('helvetica', 'normal');
    }

    const CHIP_W = (CONTENT_W - 20) / 2;
    chip('Business (Base)', formatMoney(valueBase), MARGIN, y, CHIP_W);
    chip('Business + Inventory', formatMoney(packageBusinessPlusInventory), MARGIN + CHIP_W + 20, y, CHIP_W);
    y += 64;
    if (includeRealEstate) {
      chip('Combined (Bus. + Inv. + Building)', formatMoney(combinedWithBuilding), MARGIN, y, CONTENT_W);
      y += 64;
    }

    // Divider
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    y += 16;

    // How we calculated
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('How we calculated this', MARGIN, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);
    doc.setFontSize(10);

    const bullets = [
      `SDE × industry multiple (range ${baseTriplet[0]}–${baseTriplet[1]}–${baseTriplet[2]}×) with small bumps (track record, owner independence, franchise).`,
      `Adjustments applied: Years + Runs without you + Franchise = ${(bumpSum >= 0 ? '+' : '')}${bumpSum.toFixed(2)}× total.`,
      'Essential operating assets assumed included; inventory at cost on top; real estate separate.',
    ];
    bullets.forEach((t) => {
      doc.circle(MARGIN + 2, y - 3, 2, 'F');               // bullet dot
      const wrapped = doc.splitTextToSize(t, CONTENT_W - 12);
      doc.text(wrapped, MARGIN + 12, y);                   // wrapped text
      y += wrapped.length * 14;
    });

    y += 6;
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Generated by SuccessionBridge — Fair Valuation (indicative only).', MARGIN, y);

    return doc.output('blob');
  }

  /* ---------- Render ---------- */
  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top disclaimer */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4">
          <div className="text-sm">
            <strong>Heads up:</strong> This is an <em>indicative guide</em> to help business owners think about a fair asking range.
            It is <strong>not</strong> an appraisal and must <strong>not</strong> be used for bank loans, insurance, taxes, or legal purposes.
            We have not verified the information you provide.
          </div>
        </div>

        {/* Minimal inputs */}
        <div className="bg-white rounded-xl shadow p-5">
          <h1 className="text-2xl font-bold">Value Your Business</h1>
          <p className="text-sm text-gray-600 mt-1">Just a few fields. We’ll do the math and show a clear valuation below.</p>

          {/* Names & contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <Input label="Your Name (optional)" value={ownerName} onChange={setOwnerName} placeholder="Jane Doe" />
            <Input label="Business Name (optional)" value={businessName} onChange={setBusinessName} placeholder="Acme Services" />
            <Input label="Your Email *" value={email} onChange={setEmail} placeholder="you@example.com" />
          </div>

          {/* Industry + years + revenue + SDE */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
            <div>
              <label className="block text-sm font-medium">Industry</label>
              <select className="w-full border rounded p-2" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {Object.keys(INDUSTRY_MULTIPLES).filter((k) => k !== 'fallback').map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <Input label="Years in business" type="number" value={yearsInBusiness} onChange={setYearsInBusiness} placeholder="e.g., 6" />
            <MoneyInput label="Annual Revenue (gross sales)" value={annualRevenue} onChange={setAnnualRevenue} placeholder="e.g., 450000" />
            <MoneyInput
              label="What you take home each year (SDE) *"
              value={sdeDirect}
              onChange={setSdeDirect}
              placeholder="e.g., 120000"
              help="If you don’t know SDE, use the calculator below."
            />
          </div>

          {/* SDE calculator (uses revenue & expenses only) */}
          <div className="mt-2">
            <button type="button" className="text-sm text-blue-700 hover:underline" onClick={() => setShowSdeCalc((v) => !v)}>
              {showSdeCalc ? 'Hide SDE calculator' : "Don't know SDE? Click to calculate"}
            </button>
          </div>
          {showSdeCalc && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MoneyInput label="Annual Expenses ($)" value={annualExpenses} onChange={setAnnualExpenses} />
              <div className="sm:col-span-3 text-xs text-gray-600">
                SDE ≈ Revenue − Expenses → <span className="font-semibold">{formatMoney(sdeComputed)}</span>
              </div>
            </div>
          )}

          {/* Inventory, ops, franchise, real estate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <MoneyInput label="Inventory at cost ($)" value={inventoryCost} onChange={setInventoryCost} placeholder="optional" help="Often added on top of the business price." />
            <div>
              <label className="block text-sm font-medium">Does your business run without you?</label>
              <select className="w-full border rounded p-2" value={runsWithoutOwner ? 'yes' : 'no'} onChange={(e) => setRunsWithoutOwner(e.target.value === 'yes')}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Is this a franchise?</label>
              <select className="w-full border rounded p-2" value={isFranchise ? 'yes' : 'no'} onChange={(e) => setIsFranchise(e.target.value === 'yes')}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeRealEstate} onChange={(e) => setIncludeRealEstate(e.target.checked)} />
              I own the building (priced separately)
            </label>
            {includeRealEstate && (
              <MoneyInput label="Building value ($)" value={realEstateFMV} onChange={setRealEstateFMV} />
            )}
          </div>

          {/* Acknowledgment */}
          <div className="mt-4 rounded-lg border p-3 bg-gray-50">
            <label className="inline-flex items-start gap-2 text-sm">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              <span>
                I understand this tool provides an <strong>indicative guide</strong> only. It is <strong>not</strong> an appraisal and must <strong>not</strong> be used for bank loans, insurance, tax, or legal purposes. I confirm the info I entered is my own and has not been verified by SuccessionBridge.
              </span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={handleSeeMyValuation} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              See my valuation
            </button>
            <button
              onClick={handleSaveAndEmail}
              disabled={sending}
              className={`text-white px-4 py-2 rounded ${sending ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black/90'}`}
            >
              {sending ? 'Sending…' : 'Save & email me this valuation'}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            We’ll save your numbers and send a PDF. The disclaimer applies to all outputs.
          </div>
        </div>

        {/* Report */}
        {showReport && (
          <>
            <Section
              title="Fair Value (Base)"
              subtitle="Earnings-based valuation using your SDE and an industry multiple, with small adjustments for years in business, owner independence, and franchise."
            >
              <div className="text-3xl font-bold">{formatMoney(valueBase)}</div>
              <div className="text-sm text-gray-600 mt-1">
                Fair range: {formatMoney(valueLow)} – {formatMoney(valueHigh)} • Adjusted multiples: {mLow.toFixed(2)}× / {mBase.toFixed(2)}× / {mHigh.toFixed(2)}×
              </div>

              {/* Narrative about visibility/market */}
              <div className="mt-3 text-sm text-gray-700">
                Valuations are a starting point. Actual sale prices depend on exposure and fit with the right buyer. SuccessionBridge exists to put your business in front of more qualified buyers — the more visibility you get, the better your odds of a great outcome. Exceptional strategic premiums can happen when a buyer needs your location, team, or contracts (not typical, but possible).
              </div>

              {/* How we calculated (accordion) */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-blue-700">How we calculated this</summary>
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <div>• SDE used: {formatMoney(sdeUsed)} {Number(sdeDirect || 0) > 0 ? '(entered)' : Number(annualRevenue || 0) > 0 ? '(revenue − expenses)' : ''}</div>
                  <div>• Industry range: {baseTriplet[0]}–{baseTriplet[1]}–{baseTriplet[2]}×</div>
                  <div>• Adjustments: Years + Runs without you + Franchise = {(bumpSum >= 0 ? '+' : '')}{bumpSum.toFixed(2)}× total</div>
                  <div>• Headline = SDE × Adjusted Base multiple</div>
                  <div>• Essential assets assumed included; inventory added at cost; real estate separate.</div>
                </div>
              </details>
            </Section>

            {/* Cross-checks & Marketability */}
            <Section title="Cross-checks & Marketability">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoCard label="Simple payback (Base ÷ SDE)" value={Number.isFinite(paybackYears) ? `${paybackYears.toFixed(1)} years` : '—'} />
                <InfoCard label="SDE margin (SDE ÷ Revenue)" value={margin == null ? '—' : `${(margin * 100).toFixed(1)}%`} />
                <InfoCard label="Margin note" value={marginComment(margin)} />
              </div>

              <div className="mt-3 rounded-xl border p-4 bg-white">
                <div className="text-sm font-semibold mb-1">Marketability checklist</div>
                <div className="text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    {Number(yearsInBusiness || 0) >= 3 ? '✅' : '⚠️'} Years in business: {yearsInBusiness || 'N/A'}
                    <div className="text-xs text-gray-500">{Number(yearsInBusiness || 0) >= 5 ? 'Proven track record.' : Number(yearsInBusiness || 0) >= 3 ? 'Solid history.' : 'Short track record — expect questions.'}</div>
                  </div>
                  <div>
                    {runsWithoutOwner ? '✅' : '⚠️'} Runs without owner
                    <div className="text-xs text-gray-500">{runsWithoutOwner ? 'Transferable systems/manager in place.' : 'Owner-dependent — buyers may discount.'}</div>
                  </div>
                  <div>
                    {isFranchise ? '✅' : '—'} Franchise
                    <div className="text-xs text-gray-500">{isFranchise ? 'Brand & training support can help transfer.' : 'Independent brand.'}</div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="What’s included vs added">
              <div className="text-sm text-gray-700">
                Essential operating assets (e.g., ovens, trucks used daily) are assumed included in the business price. Inventory at cost is typically added on top. Real estate is separate.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <InfoCard label="Business (Base)" value={formatMoney(valueBase)} />
                <InfoCard label="Business + Inventory" value={formatMoney(packageBusinessPlusInventory)} />
                {includeRealEstate && <InfoCard label="Combined (Bus. + Inv. + Building)" value={formatMoney(combinedWithBuilding)} />}
              </div>
            </Section>

            {/* Optional CTA */}
            <Section title="Next step (optional)">
              <div className="flex gap-2">
                <a
                  href={`${LIST_ROUTE}${email ? `?email=${encodeURIComponent(email)}${businessName ? `&business=${encodeURIComponent(businessName)}` : ''}` : ''}`}
                  className="bg-white border px-4 py-2 rounded hover:bg-gray-50"
                >
                  List your business
                </a>
              </div>
            </Section>

            {/* Report disclaimer */}
            <Section title="Disclaimer">
              <div className="text-sm text-gray-700">
                This is an indicative guide to help you consider a fair asking range. It is not an appraisal and should not be used
                for bank loans, tax filings, insurance claims, or legal purposes. SuccessionBridge has not verified the information
                you entered.
              </div>
            </Section>

            {/* Summary & actions */}
            <Section title="Valuation Summary (plain English)">
              <textarea className="w-full border rounded p-3 text-sm h-64" readOnly value={summaryText} />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigator.clipboard.writeText(summaryText).then(() => alert('Summary copied.'))}
                  className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200"
                >
                  Copy Summary
                </button>
                <button onClick={async () => {
                  const blob = await generatePdfBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'valuation-report.pdf';
                  a.click();
                  URL.revokeObjectURL(url);
                }} className="bg-white border px-4 py-2 rounded hover:bg-gray-50">
                  Download PDF
                </button>
                <button
                  onClick={handleSaveAndEmail}
                  disabled={sending}
                  className={`text-white px-4 py-2 rounded ${sending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {sending ? 'Sending…' : 'Email me the PDF'}
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

