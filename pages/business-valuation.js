// pages/business-valuation.js
import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  INDUSTRY_MULTIPLES,
  normalizeIndustry,
  formatMoney,
} from '../lib/valuation';

/* Route for seller onboarding (optional; adjust or remove) */
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
    if (inv > 0) lines.push(`If including inventory at cost: Business + Inventory ≈ ${formatMoney(packageBusinessPlusInventory)}`);
    if (bldg > 0) lines.push(`Building (separate): ${formatMoney(bldg)}`);
    if (inv > 0 || bldg > 0) lines.push(`Combined (Business + Inventory${bldg > 0 ? ' + Building' : ''}): ${formatMoney(combinedWithBuilding)}`);
    lines.push('');
    lines.push('Notes:');
    lines.push('- Essential operating assets (e.g., ovens, trucks used daily) are assumed included in the business price.');
    lines.push('- Inventory is typically added at cost on top of the business price.');
    lines.push('- Real estate is usually priced and financed separately.');
    lines.push('');
    lines.push('Important disclaimer: This is an indicative guide to help owners think about a fair asking range.');
    lines.push('It is not an appraisal and should not be used for bank loans, insurance, tax, or legal purposes.');
    lines.push('We have not verified the information you provided.');
    return lines.join('\n');
  }, [
    ownerName, businessName, valueBase, valueLow, valueHigh, mLow, mBase, mHigh,
    sdeUsed, industry, yearsInBusiness, annualRevenue, paybackYears,
    inv, bldg, packageBusinessPlusInventory, combinedWithBuilding
  ]);

  /* ---------- Actions ---------- */
  function requireAck() {
    if (!ack) {
      alert('Please acknowledge the disclaimer before continuing.');
      return false;
    }
    return true;
  }

  function handleSeeMyValuation() {
    if (!email) return alert('Please add your email.');
    if (sdeUsed <= 0) return alert('Please enter SDE (or use the calculator).');
    if (!requireAck()) return;
    setShowReport(true);
  }

  async function handleSaveAndEmail() {
    if (!email) return alert('Please add your email.');
    if (sdeUsed <= 0) return alert('Please enter SDE first.');
    if (!requireAck()) return;

    // Save minimal snapshot to your existing valuations endpoint (if present)
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
      // ok if /api/valuations doesn't exist; we still email
      await resp.json().catch(() => ({}));
    } catch (_) {}

    // Generate PDF and email (opens user's email client with link)
    try {
      const blob = await generatePdfBlob();
      const ab = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(ab)));

      const resp2 = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, filename: 'valuation-report.pdf', pdfBase64: base64 }),
      });
      const data = await resp2.json();
      if (!resp2.ok) return alert(data.error || 'Upload failed');

      const subject = 'Your Fair Valuation Summary';
      const disclaimer =
        '\n\n— Disclaimer —\nThis is an indicative tool to help owners consider pricing.\nIt is not an appraisal and must not be used for loans, insurance, tax, or legal purposes.\nWe have not verified the information you provided.';
      const body =
        `Hi${ownerName ? ' ' + ownerName : ''},\n\nHere is your valuation summary.${businessName ? `\nBusiness: ${businessName}` : ''}\n\n${summaryText}${disclaimer}\n\nDownload your PDF: ${data.url}\n\n— SuccessionBridge`;
      const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      setShowReport(true);
    } catch (e) {
      alert('Failed to email PDF: ' + (e?.message || e));
    }
  }

  // PDF (fair valuation only)
  async function generatePdfBlob() {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });

    let y = 54;
    const lh = 18;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.text('SuccessionBridge — Fair Valuation', 40, y); y += lh;

    // Strong disclaimer at top
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('Indicative guide only — not an appraisal. Not for lending, insurance, tax, or legal use. Info not verified.', 40, y); y += lh + 10;

    // Optional names
    if (ownerName || businessName) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(`${ownerName ? `Owner: ${ownerName}` : ''}${ownerName && businessName ? ' • ' : ''}${businessName ? `Business: ${businessName}` : ''}`, 40, y);
      y += lh;
    }

    // Headline
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text(`Fair Value (Base): ${formatMoney(valueBase)}`, 40, y); y += lh;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(`Fair Range: ${formatMoney(valueLow)} – ${formatMoney(valueHigh)} (Adjusted multiples: ${mLow.toFixed(2)}× / ${mBase.toFixed(2)}× / ${mHigh.toFixed(2)}×)`, 40, y); y += lh + 6;

    // Context
    doc.text(`SDE used: ${formatMoney(sdeUsed)}    Industry: ${industry}    Years in business: ${yearsInBusiness || 'N/A'}`, 40, y); y += lh;
    if (Number(annualRevenue || 0) > 0) { doc.text(`Annual revenue (gross sales): ${formatMoney(Number(annualRevenue || 0))}`, 40, y); y += lh; }
    doc.text(`Simple payback: ${Number.isFinite(paybackYears) ? paybackYears.toFixed(1) + ' years' : '—'}`, 40, y); y += lh;

    // Inventory / real estate
    if (Number(inventoryCost || 0) > 0) { doc.text(`Business + Inventory (at cost): ${formatMoney(packageBusinessPlusInventory)}`, 40, y); y += lh; }
    if (includeRealEstate) { doc.text(`Building (separate): ${formatMoney(Number(realEstateFMV || 0))}`, 40, y); y += lh; }
    if (Number(inventoryCost || 0) > 0 || includeRealEstate) {
      doc.text(`Combined (Business + Inventory${includeRealEstate ? ' + Building' : ''}): ${formatMoney(combinedWithBuilding)}`, 40, y); y += lh + 6;
    }

    // Notes
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Notes', 40, y); y += lh;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const notes = [
      '• Essential operating assets (e.g., ovens, trucks used daily) are assumed included in the business price.',
      '• Inventory is typically added at cost on top.',
      '• Real estate is usually priced and financed separately.',
      '• This is a guide, not an appraisal. Do not use for loans, insurance, tax, or legal purposes.',
      '• Information provided has not been verified.',
    ];
    notes.forEach(line => { doc.text(line, 40, y); y += 14; });

    // Footer
    y += 6;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
    doc.text('Generated by SuccessionBridge — Fair Valuation (indicative only).', 40, y);

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
            <button onClick={handleSaveAndEmail} className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-black/90">
              Save & email me this valuation
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <InfoCard label="SDE used" value={formatMoney(sdeUsed)} />
                <InfoCard label="Industry" value={industry} />
                <InfoCard label="Simple payback" value={Number.isFinite(paybackYears) ? `${paybackYears.toFixed(1)} years` : '—'} />
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
                <button onClick={handleSaveAndEmail} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Email me the PDF
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

