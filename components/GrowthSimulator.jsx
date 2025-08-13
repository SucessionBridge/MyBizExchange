// components/GrowthSimulator.jsx
import { useMemo, useState } from 'react';

function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

export default function GrowthSimulator({
  baseRevenue = 0,
  baseSDE = 0,
  askingPrice,                // optional, displayed if provided
  multiples,                  // optional: { low, mid, high }
  defaultGrowthPct = 5,
  defaultYears = 3,
  defaultMultiple,            // optional: starting multiple
}) {
  const initialMultiple = Math.max(
    2.5,
    Number(
      defaultMultiple ??
      (multiples && (multiples.mid ?? multiples.low ?? 2.5)) ??
      2.5
    ) || 2.5
  );

  const [growthPct, setGrowthPct] = useState(defaultGrowthPct);
  const [years, setYears] = useState(defaultYears);
  const [multiple, setMultiple] = useState(initialMultiple);

  const baseExpenses = useMemo(() => {
    const rev = Number(baseRevenue) || 0;
    const sde = Number(baseSDE) || 0;
    const exp = rev - sde;
    return exp > 0 ? exp : 0;
  }, [baseRevenue, baseSDE]);

  const today = useMemo(() => {
    const sde0 = Math.max(0, Number(baseSDE) || 0);
    const val0 = sde0 * (Number(multiple) || 0);
    return { sde: sde0, value: val0 };
  }, [baseSDE, multiple]);

  const future = useMemo(() => {
    const g = (Number(growthPct) || 0) / 100;
    const t = Math.max(0, Math.floor(Number(years) || 0));
    const revT = (Number(baseRevenue) || 0) * Math.pow(1 + g, t);
    const sdeT = Math.max(0, revT - baseExpenses);
    const valT = sdeT * (Number(multiple) || 0);
    return { year: t, revenue: revT, sde: sdeT, value: valT };
  }, [baseRevenue, baseExpenses, growthPct, years, multiple]);

  const addedValue = Math.max(0, future.value - today.value);
  const extraAnnualProfit = Math.max(0, future.sde - today.sde);

  const disabled = !baseRevenue || !baseSDE;

  return (
    <section className="bg-white rounded-2xl shadow-md p-6 md:p-8">
      <h2 className="text-3xl font-serif font-semibold text-[#1E3A8A] mb-2">
        Growth & Valuation Simulator
      </h2>
      <p className="text-sm text-gray-700">
        Tiny price moves add up. If <strong>revenue grows</strong> each year and
        <strong> expenses stay the same</strong>, more of each sale drops to profit (SDE).
        Since many buyers value small businesses at a multiple of SDE, even a{' '}
        <strong>{growthPct}%</strong> lift can move the valuation.
      </p>

      {/* Controls */}
      <div className="grid sm:grid-cols-3 gap-4 mt-5">
        <div>
          <label className="block text-sm font-medium">Annual revenue growth</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="w-28 border rounded p-2"
              value={growthPct}
              onChange={(e) => setGrowthPct(Number(e.target.value))}
              min={0}
              max={100}
              step={0.5}
            />
            <span className="text-gray-600 text-sm">%</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Example: a $100 sale at +5% becomes $105 — small on one ticket, big across thousands.
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Years</label>
          <input
            type="number"
            className="w-28 border rounded p-2"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            min={0}
            max={10}
          />
          <div className="text-xs text-gray-500 mt-1">Run a quick 1–5 year view.</div>
        </div>

        <div>
          <label className="block text-sm font-medium">SDE multiple</label>
          <input
            type="number"
            className="w-28 border rounded p-2"
            value={multiple}
            onChange={(e) => setMultiple(Math.max(2.5, Number(e.target.value)))}
            min={2.5}
            step={0.1}
          />
          <div className="text-xs text-gray-500 mt-1">Starts at 2.5× by default.</div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <div className="rounded-xl border p-4 bg-gray-50">
          <div className="text-xs uppercase text-gray-500 font-semibold">Today</div>
          <div className="mt-2 text-sm text-gray-700">SDE</div>
          <div className="text-xl font-bold">{fmt(today.sde)}</div>
          <div className="mt-1 text-sm text-gray-700">Implied value (@ {multiple.toFixed(1)}×)</div>
          <div className="text-xl font-bold">{fmt(today.value)}</div>
        </div>

        <div className="rounded-xl border p-4 bg-gray-50">
          <div className="text-xs uppercase text-gray-500 font-semibold">
            Year {future.year}
          </div>
          <div className="mt-2 text-sm text-gray-700">Projected SDE</div>
          <div className="text-xl font-bold">{fmt(future.sde)}</div>
          <div className="mt-1 text-sm text-gray-700">Implied value (@ {multiple.toFixed(1)}×)</div>
          <div className="text-xl font-bold">{fmt(future.value)}</div>
        </div>

        <div className="rounded-xl border p-4 bg-emerald-50 border-emerald-200">
          <div className="text-xs uppercase text-emerald-800 font-semibold">
            Added value after {future.year} {future.year === 1 ? 'year' : 'years'}
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-800">{fmt(addedValue)}</div>
          <div className="mt-1 text-sm text-emerald-900">
            Extra annual profit by Year {future.year}: <strong>{fmt(extraAnnualProfit)}</strong>
          </div>
        </div>
      </div>

      {/* Context row */}
      <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg border p-3 bg-white">
          <div className="text-gray-500">Assumptions</div>
          <div className="text-gray-700">
            Revenue grows by <strong>{growthPct}%</strong> per year; <strong>expenses stay flat</strong>.
          </div>
        </div>
        <div className="rounded-lg border p-3 bg-white">
          <div className="text-gray-500">Why it matters</div>
          <div className="text-gray-700">
            More revenue on the same cost base =&gt; higher SDE =&gt; higher value at a given multiple.
          </div>
        </div>
        <div className="rounded-lg border p-3 bg-white">
          <div className="text-gray-500">Asking price (optional)</div>
          <div className="text-gray-700">
            {askingPrice ? (
              <>Current ask: <strong>{fmt(askingPrice)}</strong></>
            ) : (
              <>No asking price provided.</>
            )}
          </div>
        </div>
      </div>

      {/* Guard if no data */}
      {disabled && (
        <div className="mt-4 text-xs text-red-600">
          Add Revenue and SDE on the listing to use this tool.
        </div>
      )}
    </section>
  );
}

