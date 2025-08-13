// pages/scorecard.js
import { useMemo, useRef, useState } from 'react';
import supabase from '../lib/supabaseClient';

/* ---------- Small UI helpers (match valuation style) ---------- */
function Section({ title, subtitle, children }) {
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

function Input({ label, name, value, onChange, type = 'text', placeholder, help, required, min }) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        className="w-full border rounded p-2"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
      />
      {help && <div className="text-xs text-gray-500 mt-1">{help}</div>}
    </div>
  );
}
function Textarea({ label, name, value, onChange, rows = 4, help, required }) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        required={required}
        className="w-full border rounded p-2"
      />
      {help && <div className="text-xs text-gray-500 mt-1">{help}</div>}
    </div>
  );
}
function Radio3({ label, name, value, onChange, help }) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      {help && <div className="text-xs text-gray-500 mt-1">{help}</div>}
      <div className="flex items-center gap-5 mt-2 text-sm">
        <label className="inline-flex items-center gap-1">
          <input type="radio" name={name} value="1" checked={value === '1'} onChange={onChange} /> No
        </label>
        <label className="inline-flex items-center gap-1">
          <input type="radio" name={name} value="3" checked={value === '3'} onChange={onChange} /> Somewhat
        </label>
        <label className="inline-flex items-center gap-1">
          <input type="radio" name={name} value="5" checked={value === '5'} onChange={onChange} /> Yes
        </label>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function ScorecardPage() {
  const [form, setForm] = useState({
    email: '',
    industry: 'service',
    description: '',
    askingPrice: '',
    annualRevenue: '',
    annualProfit: '',
    ageOfBusiness: '',
    profitability: '',   // 1/3/5
    hasSystems: '',      // 1/3/5
    hasTeam: '',         // 1/3/5
    includedAssets: '',
  });

  const [ack, setAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(null);
  const resultRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------- Derived checks ---------- */
  const age = useMemo(() => Number(form.ageOfBusiness || 0), [form.ageOfBusiness]);
  const revenue = useMemo(() => Number(form.annualRevenue || 0), [form.annualRevenue]);
  const profit = useMemo(() => Number(form.annualProfit || 0), [form.annualProfit]);
  const asking = useMemo(() => Number(form.askingPrice || 0), [form.askingPrice]);

  const priceToProfitRatio = useMemo(() => {
    if (asking > 0 && profit > 0) return asking / profit;
    return null;
  }, [asking, profit]);

  /* ---------- Scoring ---------- */
  function calculateScore() {
    const fields = ['profitability', 'hasSystems', 'hasTeam'];
    const values = fields.map((f) => parseInt(form[f] || '0', 10));

    // Age score
    let ageScore = 1;
    if (age >= 3 && age < 5) ageScore = 3;
    else if (age >= 5) ageScore = 5;

    // Revenue score
    let revenueScore = 1;
    if (revenue >= 100000 && revenue < 300000) revenueScore = 3;
    else if (revenue >= 300000) revenueScore = 5;

    // Price-to-profit sanity
    const hasAssetExplanation = form.includedAssets && form.includedAssets.trim().length > 10;
    let p2p = 3; // neutral default
    if (asking > 0 && profit > 0) {
      const r = asking / profit;
      if (r <= 1.5) p2p = 5;
      else if (r <= 2.5) p2p = 3;
      else p2p = hasAssetExplanation ? 3 : 1;
    }

    const total = values.reduce((a, v) => a + v, 0) + ageScore + revenueScore + p2p;
    // Denominator = 3 attributes + 3 derived buckets
    const outOfTen = (total / (values.length + 3) * 2);
    return Number(outOfTen.toFixed(1));
  }

  const strengths = useMemo(() => {
    const s = [];
    if (form.hasSystems === '5') s.push('Documented SOPs and repeatable processes');
    if (form.hasTeam === '5') s.push('Team/manager in place (transferability)');
    if (form.profitability === '5') s.push('Consistent profitability');
    if (age >= 5) s.push('Proven longevity');
    if (priceToProfitRatio && priceToProfitRatio <= 2.5) s.push('Reasonable asking price vs. profit');
    return s;
  }, [form, age, priceToProfitRatio]);

  const improvements = useMemo(() => {
    const i = [];
    if (!form.hasSystems || form.hasSystems === '1') i.push('Write key SOPs (sales, ops, handover) to reduce owner-dependence');
    if (!form.hasTeam || form.hasTeam === '1') i.push('Cross-train or add a part-time manager to cover owner tasks');
    if (!form.profitability || form.profitability === '1') i.push('Stabilize profitability (trim discretionary spend; raise prices where justified)');
    if (age < 3) i.push('Buyers may discount short operating history — show month-by-month trends');
    if (priceToProfitRatio && priceToProfitRatio > 2.5 && !(form.includedAssets && form.includedAssets.trim().length > 10)) {
      i.push('If price > 2.5× profit, justify with assets (inventory, vehicles, property) or growth story');
    }
    return i;
  }, [form, age, priceToProfitRatio]);

  /* ---------- Submit ---------- */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!ack) {
      alert('Please acknowledge the disclaimer before continuing.');
      return;
    }

    const calculated = calculateScore();
    setScore(calculated);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);

    setSubmitting(true);
    try {
      const { error } = await supabase.from('sellability_scores').insert([{
        email: form.email,
        industry: form.industry,
        description: form.description,
        asking_price: asking || null,
        included_assets: form.includedAssets || null,
        annual_revenue: revenue || null,
        annual_profit: profit || null,
        age_of_business: age || null,
        profitability: form.profitability ? Number(form.profitability) : null,
        has_systems: form.hasSystems ? Number(form.hasSystems) : null,
        has_team: form.hasTeam ? Number(form.hasTeam) : null,
        score: calculated,
      }]);
      if (error) {
        console.error('Supabase insert error:', error.message);
        alert('Something went wrong saving your score. You can still use the results below.');
      } else {
        alert(`Submitted! Your Sellability Score is ${calculated}/10. We’ll email tips shortly.`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top disclaimer (mirrors valuation) */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4">
          <div className="text-sm">
            <strong>Heads up:</strong> This is an <em>indicative score</em> to help you gauge sellability and identify improvements.
            It is <strong>not</strong> an appraisal and must <strong>not</strong> be used for bank loans, insurance, taxes, or legal purposes.
            We have not verified the information you provide.
          </div>
        </div>

        {/* Intro & form */}
        <div className="bg-white rounded-xl shadow p-5">
          <h1 className="text-2xl font-bold">Sellability Scorecard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Quick snapshot of transferability, stability, and buyer appeal. You can refine later — the goal is to get listed and improve as you go.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Snapshot */}
            <Section
              title="Business Snapshot"
              subtitle="A few basics so we can calibrate expectations and give you targeted tips."
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Email *"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
                <Input
                  label="Industry"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="service / retail / trades / online"
                />
                <Input
                  label="Years in business"
                  name="ageOfBusiness"
                  type="number"
                  min="0"
                  value={form.ageOfBusiness}
                  onChange={handleChange}
                  placeholder="e.g., 6"
                  help="Buyers prefer 2+ years; 5+ signals durability."
                />
              </div>

              <Textarea
                label="Brief description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                required
                help="What do you sell, who’s the typical customer, what’s special (location, contracts, brand)?"
              />
            </Section>

            {/* Numbers */}
            <Section
              title="Key Numbers"
              subtitle="Use round numbers if you aren’t sure — we’re looking for ballpark to guide the conversation."
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Annual Revenue ($)"
                  name="annualRevenue"
                  type="number"
                  value={form.annualRevenue}
                  onChange={handleChange}
                  placeholder="e.g., 450000"
                  required
                />
                <Input
                  label="Annual Profit / SDE ($)"
                  name="annualProfit"
                  type="number"
                  value={form.annualProfit}
                  onChange={handleChange}
                  placeholder="e.g., 120000"
                  required
                  help="SDE ≈ profit before owner salary + owner perks + one-time costs."
                />
                <Input
                  label="Asking Price ($)"
                  name="askingPrice"
                  type="number"
                  value={form.askingPrice}
                  onChange={handleChange}
                  placeholder="e.g., 300000"
                  required
                  help="Many main-street businesses trade around 2–3× SDE, with exceptions."
                />
              </div>

              <Textarea
                label="What’s included?"
                name="includedAssets"
                value={form.includedAssets}
                onChange={handleChange}
                rows={3}
                help="Optional: real estate, inventory (at cost), vehicles/equipment, trademarks, domains, software, etc."
              />
            </Section>

            {/* Operations & transferability */}
            <Section
              title="Operations & Transferability"
              subtitle="Buyers pay more when the business can run without you on day 1."
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Radio3
                  label="Consistently profitable?"
                  name="profitability"
                  value={form.profitability}
                  onChange={handleChange}
                  help="Net positive after paying yourself; show trends if seasonal."
                />
                <Radio3
                  label="Documented systems/SOPs?"
                  name="hasSystems"
                  value={form.hasSystems}
                  onChange={handleChange}
                  help="Checklists/videos for sales, ops, fulfillment, and handover."
                />
                <Radio3
                  label="Team/manager in place?"
                  name="hasTeam"
                  value={form.hasTeam}
                  onChange={handleChange}
                  help="Reduces owner-dependence; even part-time coverage helps."
                />
              </div>

              <div className="mt-3 text-xs text-gray-600">
                Helpful before closing: key customer/vendor contracts, training plan, escrowed logins/domains, and a 30–60–90 day transition.
              </div>
            </Section>

            {/* Acknowledgment */}
            <div className="rounded-lg border p-3 bg-gray-50">
              <label className="inline-flex items-start gap-2 text-sm">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                <span>
                  I understand this tool provides an <strong>indicative score</strong> only. It is <strong>not</strong> an appraisal and must
                  <strong> not</strong> be used for bank loans, insurance, tax, or legal purposes.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`text-white px-4 py-2 rounded ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {submitting ? 'Scoring…' : 'Get My Sellability Score'}
            </button>
          </form>
        </div>

        {/* Results */}
        {score != null && (
          <div ref={resultRef} className="space-y-6">
            <Section
              title="Your Sellability Snapshot"
              subtitle="These aren’t hard rules — they’re conversation starters to improve price and speed to close."
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoCard label="Sellability Score" value={`${score} / 10`} />
                <InfoCard
                  label="Price ÷ Profit"
                  value={priceToProfitRatio ? `${priceToProfitRatio.toFixed(2)}×` : '—'}
                />
                <InfoCard
                  label="Years in Business"
                  value={age ? `${age}` : '—'}
                />
              </div>

              <div className="mt-4 rounded-xl border p-4 bg-white">
                <div className="text-sm font-semibold mb-1">What this means</div>
                <div className="text-sm text-gray-700">
                  Scores of <strong>8–10</strong> tend to attract more/stronger offers.
                  <br />Scores of <strong>5–7</strong> are common — focus on quick wins (SOPs, light manager coverage, tidy financials).
                  <br />Scores under <strong>5</strong> can still sell — pricing and a solid transition plan matter most.
                </div>
              </div>
            </Section>

            <Section title="Strengths & Priority Improvements">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4 bg-white">
                  <div className="font-semibold">Strengths</div>
                  <ul className="mt-2 list-disc list-inside text-sm text-gray-700 space-y-1">
                    {strengths.length ? strengths.map((s, i) => <li key={i}>{s}</li>) : <li>No major strengths detected yet — that’s okay.</li>}
                  </ul>
                </div>
                <div className="rounded-xl border p-4 bg-white">
                  <div className="font-semibold">Improvements</div>
                  <ul className="mt-2 list-disc list-inside text-sm text-gray-700 space-y-1">
                    {improvements.length ? improvements.map((s, i) => <li key={i}>{s}</li>) : <li>You’re in great shape — focus on packaging and visibility.</li>}
                  </ul>
                </div>
              </div>
            </Section>

            <Section title="Next Step (optional)">
              <div className="text-sm text-gray-700">
                Don’t wait to get everything perfect. List now and keep improving — buyers value momentum and clarity.
              </div>
              <div className="flex gap-2 mt-3">
                <a href="/sellers" className="bg-white border px-4 py-2 rounded hover:bg-gray-50">List your business</a>
                <a href="/business-valuation" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Get a valuation</a>
              </div>
            </Section>

            <Section title="Caution on Seller Financing">
              <div className="text-sm text-gray-700">
                If you offer terms, protect the core of what made the business work. When a buyer changes everything (brand, menu, hours, quality), risk goes up.
                Use clear covenants, transition training, and step-in/acceleration rights if payments stop.
              </div>
            </Section>

            <Section title="Disclaimer">
              <div className="text-sm text-gray-700">
                This is guidance to help you prepare and price. It is not an appraisal, and we have not verified your inputs.
                Do not use for lending, insurance, tax, or legal purposes.
              </div>
            </Section>
          </div>
        )}
      </div>
    </main>
  );
}
