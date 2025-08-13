// pages/guides/how-to-sell.js
import Head from 'next/head'
import Link from 'next/link'

export default function HowToSell() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Head>
        <title>How to Sell Your Business &mdash; SuccessionBridge</title>
        <meta
          name="description"
          content="Plain-English playbook for selling a small business: pricing, prep, packaging the listing, screening buyers, LOI, diligence, and closing."
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-[#2E3A59]">
            How to Sell Your Business (Plain-English Playbook)
          </h1>
          <p className="mt-3 text-lg text-gray-700">
            No jargon. Just the steps that move a main-street deal from &quot;thinking about it&quot; to closed.
            Every business is different, but the fundamentals are the same: prepare cleanly, price clearly, package
            well, screen smart, and protect yourself on terms.
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Link href="/sellers">
              <a className="inline-block bg-[#F59E0B] hover:bg-[#D97706] text-white px-4 py-2 rounded-lg text-sm font-semibold">
                List Your Business
              </a>
            </Link>
            <Link href="/business-valuation">
              <a className="inline-block bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold">
                Price It With Our Valuation Tool
              </a>
            </Link>
            <Link href="/scorecard">
              <a className="inline-block bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold">
                Sellability Scorecard
              </a>
            </Link>
          </div>
        </header>

        {/* Timeline */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#2E3A59]">Typical timeline</h2>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <Step n="1" title="Prepare (2&ndash;6 weeks)">
              Clean financials, recast SDE, organize documents, light &quot;curb appeal&quot; fixes.
            </Step>
            <Step n="2" title="Price &amp; strategy (1 week)">
              Use an SDE &times; multiple range; decide what is included (inventory at cost? equipment? real estate separate?).
            </Step>
            <Step n="3" title="Launch listing (days)">
              Clear headline, strong photos, a short memo. Start fielding inquiries.
            </Step>
            <Step n="4" title="Screen buyers (ongoing)">
              Quick fit checks before sharing deeper info. Optional NDA.
            </Step>
            <Step n="5" title="Negotiate &amp; LOI (1&ndash;3 weeks)">
              Agree on price &amp; terms in a non-binding LOI with an exclusivity period.
            </Step>
            <Step n="6" title="Diligence (2&ndash;6 weeks)">
              Buyer verifies numbers, lease, licenses, and operations.
            </Step>
            <Step n="7" title="Contracts &amp; closing (1&ndash;3 weeks)">
              Attorney-prepared Asset Purchase Agreement (most common), bill of sale, assignments, and funding.
            </Step>
            <Step n="8" title="Transition (4&ndash;12 weeks)">
              Training, handoff, vendor and customer intros; stay available as agreed.
            </Step>
          </div>
        </section>

        {/* Prep checklist */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Preparation checklist</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Financial">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>P&amp;L and balance sheet for last 2&ndash;3 years + YTD</li>
                <li>Tax returns for last 2 years (if available)</li>
                <li>Recast SDE schedule (owner pay, add-backs, one-offs)</li>
                <li>Revenue proof (POS exports, bank deposits)</li>
                <li>Payroll summary; AR/AP aging (if relevant)</li>
                <li>Inventory list at cost; major equipment list</li>
              </ul>
            </Card>
            <Card title="Operational &amp; legal">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Org chart; key employee status and agreements</li>
                <li>Vendor &amp; customer concentration notes</li>
                <li>Entity docs; licenses &amp; permits current</li>
                <li>Lease: assignability, remaining term, options</li>
                <li>Website/domain, phone numbers, social accounts</li>
                <li>Simple SOPs: how the business actually runs</li>
              </ul>
            </Card>
          </div>
          <p className="mt-3 text-sm text-gray-700">
            Pro tip: minor cleanup goes a long way&mdash;tidy premises, fix obvious maintenance, replace missing
            small tools, and standardize simple processes.
          </p>
        </section>

        {/* Pricing basics */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Pricing basics (what most buyers expect)</h3>
          <p className="mt-2 text-gray-700">
            For main-street SMBs, the core method is <strong>SDE &times; industry multiple</strong>, after recasting SDE.
            Show a <em>range</em> (low/base/high) and explain any small adjustments (years in business, runs without owner,
            franchise). Inventory at cost is usually <em>added on top</em>. Real estate is priced separately.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/business-valuation">
              <a className="inline-block bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-md text-sm font-semibold">
                Use the Valuation Tool
              </a>
            </Link>
            <Link href="/guides/how-buyers-value">
              <a className="inline-block bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-md text-sm font-semibold">
                How Buyers Value Businesses
              </a>
            </Link>
          </div>
        </section>

        {/* Packaging the listing */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Package your listing</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Essentials">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Headline: what it is, where, rough scale (&quot;Profitable HVAC, Central FL&quot;)</li>
                <li>Photo set: exterior, interior, equipment, product, team</li>
                <li>Snapshot: revenue, SDE, years, staff, lease highlights</li>
                <li>What is included vs. excluded (inventory, vehicles, IP)</li>
                <li>Transition offered (e.g., 4 weeks training)</li>
              </ul>
            </Card>
            <Card title="Short memo outline">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Overview &amp; history</li>
                <li>Financial summary (3 yrs + YTD) &amp; SDE</li>
                <li>Operations: staffing, systems, seasonality</li>
                <li>Customers, vendors, and any concentration</li>
                <li>Growth opportunities and easy wins</li>
                <li>Deal terms guidance: what you will consider</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Screening + buyer flow */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Handle inquiries like a pro</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Quick screen questions">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Have you owned/managed this type of business before?</li>
                <li>Rough capital available for down payment &amp; working capital?</li>
                <li>Timeline to close if we both like the fit?</li>
                <li>Plan to keep team/brand &mdash; or change things quickly?</li>
              </ul>
            </Card>
            <Card title="Share info in stages">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Stage 1: teaser, high-level answers</li>
                <li>Stage 2 (optional NDA): summary P&amp;L, lease terms, more photos</li>
                <li>Stage 3 (LOI signed): full diligence pack</li>
              </ul>
            </Card>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Keep a buyer log: dates, notes, what you shared. It speeds follow-up and protects confidentiality.
          </p>
        </section>

        {/* Negotiation & LOI */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Negotiation &amp; LOI (letter of intent)</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Price vs. terms">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Cash at close vs. seller note; earn-out only for growth claims</li>
                <li>Deposit amount and whether it becomes non-refundable</li>
                <li>Exclusivity window (30&ndash;60 days typical)</li>
                <li>Financing contingencies and timelines</li>
              </ul>
            </Card>
            <Card title="LOI outline (non-binding)">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Structure (asset vs. stock), price, inclusions/exclusions</li>
                <li>Down payment, note terms (rate, term, amortization)</li>
                <li>Working capital target or &quot;cash-free, debt-free&quot;</li>
                <li>Diligence scope and document list</li>
                <li>Exclusivity period and deposits</li>
                <li>Target closing date; key approvals (landlord, licenses)</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Diligence */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Due diligence (what they will check)</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Common requests">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Monthly P&amp;L and bank statements (12&ndash;24 months)</li>
                <li>Sales tax and payroll filings (as applicable)</li>
                <li>Customer and vendor lists (summary first)</li>
                <li>Copies of key contracts, equipment titles</li>
                <li>Lease &amp; landlord consent path</li>
              </ul>
            </Card>
            <Card title="Make it smooth">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Set a weekly check-in; answer in batches</li>
                <li>Stage documents in folders; label clearly</li>
                <li>Flag quirks upfront (seasonality, one-offs)</li>
                <li>Confirm transferability of licenses and utilities</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Contracts & closing */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Contracts &amp; closing</h3>
          <p className="text-gray-700">
            Most small deals are <strong>asset sales</strong> (buyer purchases assets and assumes selected liabilities).
            Your attorney will tailor the Asset Purchase Agreement, bill of sale, assignments, allocation of purchase price,
            and non-compete/non-solicit (as permitted). Coordinate landlord consent and any license transfers so funding can occur.
          </p>
        </section>

        {/* Seller financing protections */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">If you carry a seller note, protect yourself</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Safeguards to discuss">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Personal guarantee from buyer/owners</li>
                <li>Security interest (UCC-1) on business assets &amp; titled equipment</li>
                <li>Insurance with you as loss payee; additional insured</li>
                <li>ACH autopay and monthly reporting covenants</li>
                <li>No major brand/menu changes for [months] months without consent</li>
              </ul>
            </Card>
            <Card title="Learn more">
              <p className="text-sm text-gray-700">
                See our guide to&nbsp;
                <Link href="/guides/financing-options">
                  <a className="text-blue-700 hover:underline">financing options</a>
                </Link>
                &nbsp;for structure ideas and red flags.
              </p>
            </Card>
          </div>
        </section>

        {/* Pitfalls */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Common pitfalls (and fixes)</h3>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
            <li>Asking price with no SDE math &mdash; provide the range and show add-backs.</li>
            <li>Owner dependence &mdash; line up a lead or SOPs to reduce key-person risk.</li>
            <li>Lease surprises &mdash; confirm assignability and landlord process early.</li>
            <li>Data sprawl &mdash; organize docs into a simple folder structure.</li>
            <li>Buyer wants to &quot;change everything&quot; Day 1 &mdash; protect with covenants if you carry a note.</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center mb-10">
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            <Link href="/sellers">
              <a className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-5 py-2.5 rounded-xl font-semibold">
                Start Listing
              </a>
            </Link>
            <Link href="/business-valuation">
              <a className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-5 py-2.5 rounded-xl font-semibold">
                Get Your Valuation
              </a>
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4">
          <p className="text-sm">
            <strong>Important:</strong> This guide is general information, not legal, tax, or financial advice.
            Always consult a qualified attorney and CPA for your specific deal and jurisdiction.
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

function Step({ n, title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
          {n}
        </span>
        <div className="font-semibold text-[#2E3A59]">{title}</div>
      </div>
      <div className="mt-1.5 text-gray-700 text-sm">{children}</div>
    </div>
  )
}

