import { useMemo, useState } from "react";

/** Small local helpers (kept self-contained) */
function fmtMoney(n) {
  if (n == null || !isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function toNum(v, d = 0) {
  const n = Number(v);
  return isFinite(n) ? n : d;
}

export default function GrowthSimulator({
  baseRevenue = 0,
  baseSDE = 0,
  baseExpenses,             // optional; if not provided we infer as revenue - SDE
  askingPrice,              // optional; enables “years to justify price”
  multiples = { low: 2.5, mid: 3.0, high: 3.5 },
  defaultMultiple = "mid",  // "low" | "mid" | "high"
  defaultGrowthPct = 5,
  defaultYears = 3,
  className = "",
  title = "Growth & Valuation Simulator",
}) {
  // Inputs
  const [rev0, setRev0] = useState(baseRevenue);
  const [sde0, setSde0] = useState(baseSDE);
  const [growthPct, setGrowthPct] = useState(defaultGrowthPct);
  const [years, setYears] = useState(defaultYears);
  const [multikey, setMultikey] = useState(defaultMultiple);
  const [customMultiple, setCustomMultiple] = useState("");

  const M = multikey === "custom"
    ? Math.max(0, toNum(customMultiple, multiples?.[defaultMultiple] ?? 3))
    : (multiples?.[multikey] ?? 3);

  const exp0 = useMemo(() => {
    const e = baseExpenses != null ? Number(baseExpenses) : Number(rev0) - Number(sde0);
    return isFinite(e) ? e : 0;
  }, [baseExpenses, rev0, sde0]);

  const g = Math.max(-0.99, toNum(growthPct, 0) / 100); // clamp to avoid negative infinity

  // Table rows Year 0..N (fixed-expenses mode)
  const rows = useMemo(() => {
    const N = Math.min(10, Math.max(1, Number(years || 1)));
    const r0 = toNum(rev0, 0);
    const e0 = toNum(exp0, 0);
    const out = [];
    for (let t = 0; t <= N; t++) {
      const Rt = r0 * Math.pow(1 + g, t);
      const Et = e0; // fixed
      const SDEt = Math.max(0, Rt - Et);
      const Vt = SDEt * M;
      out.push({ t, revenue: Rt, expenses: Et, sde: SDEt, value: Vt });
    }
    return out;
  }, [rev0, exp0, g, years, M]);

  const today = rows[0];
  const future = rows[rows.length - 1];

  // Years to justify price (if asking + multiple available)
  const yearsToPrice = useMemo(() => {
    if (!askingPrice || !M || M <= 0) return null;
    const targetSDE = askingPrice / M;
    // Solve iteratively: SDE_t = R0*(1+g)^t - E0  >= targetSDE
    const R0 = toNum(rev0, 0);
    const E0 = toNum(exp0, 0);
    if (R0 <= 0 && toNum(sde0, 0) <= 0) return null;
    if (g <= 0) return null;
    for (let t = 0; t <= 30; t++) {
      const SDEt = Math.max(0, R0 * Math.pow(1 + g, t) - E0);
      if (SDEt >= targetSDE) return t;
    }
    return null;
  }, [askingPrice, M, g, rev0, exp0, sde0]);

  return (
    <section className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}>
      <h3 className="text-xl font-semibold text-[#2E3A59]">{title}</h3>

      {/* Helper text */}
      <div className="mt-2 text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <strong>Why small growth matters:</strong> a 5% increase on a $100 sale is $105 — that’s only $5 per order,
        but across thousands of orders it adds up. If your expenses stay flat, that extra revenue flows straight into{" "}
        <em>SDE</em>, which multiplied by a market multiple can materially increase business value.
      </div>

      {/* Inputs */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Base Revenue</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={rev0}
            onChange={(e) => setRev0(e.target.value)}
            placeholder="e.g., 450000"
          />
          <div className="text-xs text-gray-500 mt-1">From the listing, if available.</div>
        </div>
        <div>
          <label className="block text-sm font-medium">Base SDE</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={sde0}
            onChange={(e) => setSde0(e.target.value)}
            placeholder="e.g., 120000"
          />
          <div className="text-xs text-gray-500 mt-1">We infer expenses as Revenue − SDE.</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Growth Rate (%)</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={growthPct}
            onChange={(e) => setGrowthPct(e.target.value)}
            step="0.5"
          />
          <div className="text-xs text-gray-500 mt-1">Try 3%, 5%, 10%.</div>
        </div>
        <div>
          <label className="block text-sm font-medium">Horizon (years)</label>
          <input
            type="range"
            min="1"
            max="5"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">Year {years}</div>
        </div>
        <div>
          <label className="block text-sm font-medium">Multiple</label>
          <div className="flex items-center gap-2 mt-1">
            {["low","mid","high","custom"].map((k) => (
              <label key={k} className="inline-flex items-center gap-1 text-sm">
                <input type="radio" name="multikey" value={k} checked={multikey===k} onChange={() => setMultikey(k)} />
                <span className="capitalize">{k === "custom" ? "Custom" : `${k} (${(multiples?.[k] ?? "-")}×)`}</span>
              </label>
            ))}
          </div>
          {multikey === "custom" && (
            <input
              type="number"
              className="mt-2 w-full border rounded p-2"
              value={customMultiple}
              onChange={(e) => setCustomMultiple(e.target.value)}
              placeholder="e.g., 3.25"
            />
          )}
        </div>
      </div>

      {/* Headline cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-xs text-gray-500">Year {years} SDE</div>
          <div className="text-lg font-semibold">{fmtMoney(future?.sde)}</div>
        </div>
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-xs text-gray-500">Year {years} Implied Value ({M}×)</div>
          <div className="text-lg font-semibold">{fmtMoney(future?.value)}</div>
        </div>
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-xs text-gray-500">Today vs Year {years} Value</div>
          <div className="text-lg font-semibold">
            {fmtMoney((future?.value ?? 0) - (today?.value ?? 0))}
          </div>
        </div>
      </div>

      {/* Asking price hint */}
      {askingPrice ? (
        <div className="mt-3 text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded p-3">
          Asking price: <strong>{fmtMoney(askingPrice)}</strong>. At {M}×, buyer needs SDE ≈ <strong>{fmtMoney(askingPrice / M)}</strong>.
          {yearsToPrice != null ? (
            <> At {growthPct}% growth with fixed expenses, this may be reached in about <strong>{yearsToPrice}</strong> year{yearsToPrice===1?"":"s"}.</>
          ) : (
            <> Increase the growth rate (or years) to estimate when that might be reached.</>
          )}
        </div>
      ) : null}

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2 pr-3">Year</th>
              <th className="py-2 pr-3">Revenue</th>
              <th className="py-2 pr-3">Expenses (fixed)</th>
              <th className="py-2 pr-3">SDE</th>
              <th className="py-2 pr-3">Implied Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.t} className="border-b last:border-0">
                <td className="py-2 pr-3">{r.t}</td>
                <td className="py-2 pr-3">{fmtMoney(r.revenue)}</td>
                <td className="py-2 pr-3">{fmtMoney(r.expenses)}</td>
                <td className="py-2 pr-3">{fmtMoney(r.sde)}</td>
                <td className="py-2 pr-3">{fmtMoney(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <div className="mt-3 text-xs text-gray-500">
        Assumptions: expenses remain flat; multiples can change with market conditions. This is an illustrative “what-if,” not a forecast.
      </div>
    </section>
  );
}
