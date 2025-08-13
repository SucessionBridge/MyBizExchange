// components/GrowthSimulator.jsx
import { useMemo, useState } from "react";

function formatMoney(n) {
  if (n == null || !isFinite(n)) return "$0";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// Safely turn "267,630" or "$267,630" into 267630
function numify(v, fallback = 0) {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.replace(/[^0-9.-]/g, "");
    const n = Number(s);
    return isFinite(n) ? n : fallback;
  }
  return fallback;
}

export default function GrowthSimulator({
  baseRevenue = 0,
  baseSDE = 0,
  defaultGrowthPct = 5,
  defaultYears = 3,
  defaultMultiple = 2.5, // start at 2.5× as requested
}) {
  // sanitize incoming props in case they arrive as strings with commas
  const baseRev = numify(baseRevenue, 0);
  const baseSde = numify(baseSDE, 0);

  const [growthPct, setGrowthPct] = useState(String(defaultGrowthPct));
  const [years, setYears] = useState(String(defaultYears));
  const [multiple, setMultiple] = useState(String(defaultMultiple));

  const g = useMemo(() => Math.max(-100, Math.min(100, Number(growthPct) || 0)) / 100, [growthPct]);
  const y = useMemo(() => Math.max(1, Math.min(15, Math.floor(Number(years) || 1))), [years]);
  const m = useMemo(() => Math.max(1.0, Math.min(10, Number(multiple) || 2.5)), [multiple]);

  // Compound revenue with flat expenses (incremental revenue flows to SDE)
  const yearNRevenue = useMemo(() => baseRev * Math.pow(1 + g, y), [baseRev, g, y]);
  const incRevenue   = useMemo(() => Math.max(0, yearNRevenue - baseRev), [yearNRevenue, baseRev]);
  const yearNSDE     = useMemo(() => baseSde + incRevenue, [baseSde, incRevenue]);

  const todayImplied   = useMemo(() => baseSde * m, [baseSde, m]);
  const yearNImplied   = useMemo(() => yearNSDE * m, [yearNSDE, m]);
  const addedValueDiff = useMemo(() => Math.max(0, yearNImplied - todayImplied), [yearNImplied, todayImplied]);

  return (
    <div className="space-y-6">
      {/* Explainer */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 text-blue-900 p-4 text-sm">
        <strong>Why this is here:</strong> If you buy this business and grow revenue while expenses stay flat,
        that extra revenue usually drops to the bottom line. A modest growth rate can translate into
        a much higher exit value because buyers price businesses on earnings × a multiple.
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Annual revenue growth (%)</label>
          <input
            type="number"
            value={growthPct}
            onChange={(e) => setGrowthPct(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g., 5"
          />
          <div className="text-xs text-gray-500 mt-1">Assumes expenses stay flat.</div>
        </div>
        <div>
          <label className="block text-sm font-medium">Years</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g., 3"
            min={1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Valuation multiple (×)</label>
          <input
            type="number"
            value={multiple}
            onChange={(e) => setMultiple(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g., 2.5"
            step="0.1"
          />
          <div className="text-xs text-gray-500 mt-1">Minimum 2.5× is common on main-street deals.</div>
        </div>
      </div>

      {/* Base vs Year N cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Base Revenue" value={formatMoney(baseRev)} />
        <Stat title="Base SDE (today)" value={formatMoney(baseSde)} />
        <Stat title="Implied Value (today)" value={`${formatMoney(todayImplied)} @ ${m.toFixed(2)}×`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title={`Year ${y} Revenue`} value={formatMoney(yearNRevenue)} />
        <Stat title={`Year ${y} SDE (flat expenses)`} value={formatMoney(yearNSDE)} />
        <Stat title={`Year ${y} Implied Value`} value={`${formatMoney(yearNImplied)} @ ${m.toFixed(2)}×`} />
      </div>

      {/* Added value */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-sm text-emerald-900 font-medium">
          Added value after {y} {y === 1 ? "year" : "years"} (vs. today)
        </div>
        <div className="text-3xl font-bold text-emerald-700 mt-1">{formatMoney(addedValueDiff)}</div>
      </div>

      <div className="text-xs text-gray-600">
        Assumes revenue grows by <strong>{(g * 100).toFixed(1)}%</strong> per year, <strong>expenses stay the same</strong>, and the
        valuation multiple stays constant at <strong>{m.toFixed(2)}×</strong>. This is a quick, directional gut-check — not a forecast.
        Real-world costs and multiples can change.
      </div>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="text-xs uppercase text-gray-500 font-semibold">{title}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

