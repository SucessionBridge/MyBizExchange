// components/GrowthSimulator.js
import { useMemo, useState } from "react";

function fmtMoney(n) {
  if (n == null || !isFinite(n)) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

export default function GrowthSimulator({
  baseRevenue = 0,
  baseSde = 0,
  defaultMultiple = 3.0, // starts at 3.0, but clamps to 2.5× minimum
}) {
  // Inputs (simple + friendly defaults)
  const [growthPct, setGrowthPct] = useState(5);   // % per year
  const [years, setYears] = useState(3);          // years
  const [multipleRaw, setMultipleRaw] = useState(defaultMultiple);

  // Clamp multiple to 2.5× minimum
  const multiple = Math.max(2.5, Number(multipleRaw || 0));

  // Base expenses derived from "expenses stay the same" assumption
  const baseExpenses = Math.max(0, Number(baseRevenue || 0) - Number(baseSde || 0));

  // Forward projection with flat expenses
  const g = Math.max(-100, Number(growthPct || 0)) / 100; // guard against NaN / silly values
  const yr = Math.max(1, Math.round(Number(years || 1)));

  const revenueYearN = useMemo(() => Number(baseRevenue || 0) * Math.pow(1 + g, yr), [baseRevenue, g, yr]);
  const sdeYearN = useMemo(() => Math.max(0, revenueYearN - baseExpenses), [revenueYearN, baseExpenses]);

  // Implied values (today vs year N)
  const todayValue = useMemo(() => Math.max(0, Number(baseSde || 0) * multiple), [baseSde, multiple]);
  const yearNValue = useMemo(() => Math.max(0, sdeYearN * multiple), [sdeYearN, multiple]);
  const addedValue = Math.max(0, yearNValue - todayValue);

  return (
    <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
      <h2 className="text-3xl font-serif font-semibold text-[#1E3A8A] mb-3">
        Revenue Growth → Value Upside
      </h2>

      {/* WHY this exists */}
      <p className="text-gray-700">
        <strong>Why this is here:</strong> See what this business <em>could</em> be worth if you grow revenue while
        keeping costs steady.
      </p>
      <p className="text-gray-600 text-sm mt-2">
        Many small businesses are valued at a multiple of profit (SDE). If revenue rises and expenses don’t, more drops
        to profit—so value goes up. Tweak the inputs to explore the upside.
      </p>
      <p className="text-gray-600 text-xs mt-1">
        Tiny example: a $100 sale at +5% becomes $105. Small per order, meaningful across thousands.
      </p>

      {/* Inputs */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-800">
            Annual revenue growth (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={growthPct}
            onChange={(e) => setGrowthPct(e.target.value)}
            className="mt-1 w-full border rounded p-2"
            placeholder="e.g., 5"
          />
          <div className="text-xs text-gray-500 mt-1">Assumes expenses stay flat.</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">Years</label>
          <input
            type="number"
            min="1"
            max="10"
            step="1"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="mt-1 w-full border rounded p-2"
            placeholder="3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">Valuation multiple (×)</label>
          <input
            type="number"
            min="2.5"
            step="0.1"
            value={multipleRaw}
            onChange={(e) => setMultipleRaw(e.target.value)}
            className="mt-1 w-full border rounded p-2"
            placeholder="3.0"
          />
          <div className="text-xs text-gray-500 mt-1">Minimum 2.5× (common main-street range is ~2.5–3.5×).</div>
        </div>
      </div>

      {/* Base snapshot */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard label="Base Revenue" value={fmtMoney(baseRevenue)} />
        <InfoCard label="Base SDE (today)" value={fmtMoney(baseSde)} />
        <InfoCard label="Implied Value (today)" value={`${fmtMoney(todayValue)} @ ${multiple.toFixed(2)}×`} />
      </div>

      {/* Projection summary */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard label={`Year ${yr} Revenue`} value={fmtMoney(revenueYearN)} />
        <InfoCard label={`Year ${yr} SDE (flat expenses)`} value={fmtMoney(sdeYearN)} />
        <InfoCard label={`Year ${yr} Implied Value`} value={`${fmtMoney(yearNValue)} @ ${multiple.toFixed(2)}×`} />
      </div>

      {/* Added value highlight */}
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-sm font-semibold text-emerald-900">
          Added value after {yr} year{yr > 1 ? "s" : ""} (vs. today)
        </div>
        <div className="text-2xl font-bold text-emerald-700 mt-1">{fmtMoney(addedValue)}</div>
      </div>

      {/* Assumptions & caution */}
      <div className="mt-4 text-xs text-gray-600">
        Assumes revenue grows by <strong>{Number(growthPct || 0)}%</strong> per year,{" "}
        <strong>expenses stay the same</strong>, and the valuation multiple stays constant at{" "}
        <strong>{multiple.toFixed(2)}×</strong>. This is a quick, directional gut-check—not a forecast. Real-world costs
        and multiples can change.
      </div>
    </section>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 border">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</div>
      <div className="text-lg font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

