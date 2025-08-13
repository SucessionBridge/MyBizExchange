// pages/guides/how-buyers-value.js
import Head from 'next/head'
import Link from 'next/link'

export default function HowBuyersValue() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Head>
        <title>How Buyers Value Businesses — SuccessionBridge</title>
        <meta
          name="description"
          content="Plain-English guide to how small business buyers think about valuation: SDE, industry multiples, add-backs, adjustments, and sanity checks."
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-[#2E3A59]">
            How Buyers Value Small Businesses
          </h1>
          <p className="mt-3 text-lg text-gray-700">
            A plain-English walkthrough of what most main-street buyers (and many brokers) actually do.
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="/listings">
              <a className="inline-block bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Browse Listings
              </a>
            </Link>
            <Link href="/business-valuation">
              <a className="inline-block bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold">
                Try the Valuation Tool
              </a>
            </Link>
          </div>
        </header>

        {/* Core idea */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#2E3A59]">The core formula</h2>
          <p className="mt-2 text-gray-700">
            For owner-operator “main-street” deals, buyers usually start with:
          </p>
          <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-4">
            <div className="font-mono text-sm">
              <span className="font-semibold">Business Value ≈</span> SDE × Industry Multiple
            </div>
            <p className="mt-2 text-sm text-gray-700">
              <strong>SDE</strong> (Seller’s Discretionary Earnings) = pre-tax profit + owner salary/benefits + add-backs for
              one-time or non-operational expenses. It’s the cash flow a single full-time owner could take home.
            </p>
          </div>
        </section>

        {/* Step 1: Recast SDE */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">1) Recast SDE (get the earnings right)</h3>
          <ul className="mt-3 list-disc list-inside text-gray-700 space-y-1">
            <li><strong>Normalize owner pay</strong> (treat one full-time owner as covered by SDE).</li>
            <li><strong>Add-backs</strong>: owner health, personal auto, one-time legal/repairs, non-recurring projects.</li>
            <li><strong>Remove non-business items</strong> (family phone plans, personal travel, etc.).</li>
            <li><strong>Right-size rent</strong> if the seller owns the building (use market rent for apples-to-apples).</li>
          </ul>
        </section>

        {/* Step 2: Multiples */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">2) Apply the industry multiple (as a range)</h3>
          <p className="mt-2 text-gray-700">
            Most industries trade in a <strong>band</strong> (e.g., 2.5×–3.5× SDE for many service businesses). Buyers pick
            a point in the band and then make small, transparent tweaks.
          </p>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <Card title="Common tweaks">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li><strong>Years operating</strong> (track record)</li>
                <li><strong>Runs without the owner</strong> (manager/systems in place)</li>
                <li><strong>Brand/Franchise</strong> (playbook & training)</li>
                <li><strong>Customer concentration</strong> (big single client = discount)</li>
                <li><strong>Trend & documentation</strong> (clean books = confidence)</li>
              </ul>
            </Card>
            <Card title="Asset context">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li><strong>Essential equipment</strong> is assumed included in price.</li>
                <li><strong>Inventory</strong> is usually added on top at cost.</li>
                <li><strong>Real estate</strong> is priced <em>separately</em> (own/lease options change the deal math).</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Step 3: Sanity checks */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">3) Sanity checks buyers run</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <MiniStat
              label="Simple payback"
              value="Price ÷ SDE"
              note="3–4 years feels strong; 5–6 can work depending on risk & growth."
            />
            <MiniStat
              label="SDE margin"
              value="SDE ÷ Revenue"
              note="&gt;15% healthy for many services; very high/low triggers questions."
            />
            <MiniStat
              label="Financeability glance"
              value="Debt coverage"
              note="If a typical lender wouldn’t underwrite it, many buyers won’t either."
            />
          </div>
        </section>

        {/* Worked example */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Quick example (for intuition)</h3>
          <p className="mt-2 text-gray-700">
            Say SDE is <strong>$120,000</strong>. Industry band is <strong>2.5×–3.5×</strong>. The business has 6 years of
            history (+), runs without the owner (+), not a franchise.
          </p>
          <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-800">
            <ul className="list-disc list-inside space-y-1">
              <li>Base band: <span className="font-mono">[2.5×, 3.0×, 3.5×]</span></li>
              <li>Tiny bumps: +0.10 (years) +0.20 (owner-independent) = <span className="font-mono">+0.30</span></li>
              <li>Adjusted band: <span className="font-mono">[2.8×, 3.3×, 3.8×]</span></li>
              <li>
                Fair range: <strong>$336k</strong> – <strong>$456k</strong>; base ≈ <strong>$396k</strong> (<span className="font-mono">3.3×</span> × 120k)
              </li>
              <li>Simple payback at base: <strong>3.3 years</strong> (<span className="font-mono">396k ÷ 120k</span>)</li>
              <li>Inventory at cost adds on top; real estate separate.</li>
            </ul>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            This is illustration only. Real deals move with seasonality, concentration, lease terms, and lender appetite.
          </p>
        </section>

        {/* What can move price up/down */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">What moves the multiple?</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Card title="Pushes value up">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Documented SOPs, trained manager, low owner hours</li>
                <li>Diversified customers & suppliers</li>
                <li>Stable or growing year-over-year results</li>
                <li>Clean, accrual-based financials</li>
                <li>Transferable contracts, licenses, prime location</li>
              </ul>
            </Card>
            <Card title="Pushes value down">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Owner-dependent (relationships or key skills)</li>
                <li>1–2 customers &gt; 30% of revenue</li>
                <li>Declining revenue or undocumented add-backs</li>
                <li>Short/expensive lease or landlord uncertainty</li>
                <li>Poor books, cash skims, missing inventory controls</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-10">
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            <Link href="/business-valuation">
              <a className="bg-[#14B8A6] hover:bg-[#0D9488] text-white px-5 py-2.5 rounded-xl font-semibold">
                Estimate a value with our tool
              </a>
            </Link>
            <Link href="/listings">
              <a className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-5 py-2.5 rounded-xl font-semibold">
                See what’s on the market
              </a>
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4">
          <p className="text-sm">
            <strong>Important:</strong> This guide is an indicative overview to help you think about price.
            It is <strong>not</strong> an appraisal and must not be used for bank loans, insurance, tax, or legal purposes.
            SuccessionBridge has not verified any seller-provided figures.
          </p>
        </section>
      </div>
    </main>
  )
}

/* ---------- small helpers ---------- */
function Card({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="font-semibold text-[#2E3A59]">{title}</div>
      <div className="mt-2 text-gray-700">{children}</div>
    </div>
  )
}

function MiniStat({ label, value, note }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-lg font-semibold text-[#2E3A59]">{value}</div>
      {note && <div className="text-xs text-gray-600 mt-1">{note}</div>}
    </div>
  )
}
