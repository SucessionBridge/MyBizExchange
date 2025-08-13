// pages/guides/how-to-sell.js
import Head from 'next/head'
import Link from 'next/link'

export default function HowToSell() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Head>
        <title>How to Sell Your Business — Quick Start (List Now, Prep As You Go)</title>
        <meta
          name="description"
          content="Plain-English quick start: list your business now, then prepare documents and details in stages while buyers discover your listing."
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-[#2E3A59]">
            How to Sell Your Business (Quick Start)
          </h1>
          <p className="mt-3 text-lg text-gray-700">
            Don’t wait months to make everything “perfect.” The fastest path is:
            <strong> get listed now</strong> so qualified buyers can find you, then
            <strong> prep the deeper materials in stages</strong> while conversations begin.
          </p>

          <div className="mt-4 flex gap-2 flex-wrap">
            <Link href="/sellers">
              <a className="inline-block bg-[#F59E0B] hover:bg-[#D97706] text-white px-4 py-2 rounded-lg text-sm font-semibold">
                List Your Business (Takes Minutes)
              </a>
            </Link>
            <Link href="/business-valuation">
              <a className="inline-block bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold">
                Get a Price Range
              </a>
            </Link>
            <Link href="/scorecard">
              <a className="inline-block bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold">
                Sellability Scorecard
              </a>
            </Link>
          </div>
        </header>

        {/* Quick Start — what to do this week */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#2E3A59]">This week: list it, then iterate</h2>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <Step n="1" title="Create your listing (15–30 min)">
              Business name (or “Confidential”), location, short description, headline photo, revenue/SDE rough numbers, and your target price range.
            </Step>
            <Step n="2" title="Price with a simple range">
              Use SDE × industry multiple. Our tool gives a low/base/high range you can explain in plain English.
            </Step>
            <Step n="3" title="Publish & start fielding inquiries">
              Visibility matters. You can polish the listing, photos, and docs over the next 1–2 weeks while buyers begin discovering it.
            </Step>
            <Step n="4" title="Prep in parallel (lightweight)">
              Add 6–12 good photos, a short memo (1–2 pages), and a simple SDE recast. Share deeper info only after fit checks.
            </Step>
          </div>
          <div className="mt-3 text-sm text-gray-700">
            <strong>Goal:</strong> get in front of buyers early, then tighten the package as interest builds.
          </div>
        </section>

        {/* What you need today vs later */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">What you need TODAY vs LATER</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Today (to go live fast)">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Clear headline + short description</li>
                <li>City/region and basic category</li>
                <li>Revenue and SDE (rough is fine)</li>
                <li>Price range (from our valuation)</li>
                <li>1–3 good photos</li>
              </ul>
            </Card>
            <Card title="Later (polish over 1–2 weeks)">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>More photos (interior, equipment, product)</li>
                <li>1–2 page memo: story, team, lease highlights</li>
                <li>Simple SDE recast schedule (add-backs)</li>
                <li>High-level customer/vendor notes (no secrets yet)</li>
                <li>Optional: inventory list at cost; equipment list</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Staged sharing policy */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Share info in stages (protect your time)</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Stage 1: teaser & quick screen">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Public listing + short answers</li>
                <li>Screen for fit, capital, and timeline</li>
              </ul>
            </Card>
            <Card title="Stage 2: summary pack (optional NDA)">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Summary P&amp;L + SDE, lease terms, more photos</li>
                <li>Confirm landlord path and key approvals</li>
              </ul>
            </Card>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Save full document dumps for later stages. Early buyers mostly need clarity, not a data room.
          </p>
        </section>

        {/* Pricing basics */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Pricing that buyers understand</h3>
          <p className="mt-2 text-gray-700">
            Main-street buyers expect <strong>SDE × industry multiple</strong>. Show a range (low/base/high) and
            explain what’s included. Inventory at cost is usually added on top; real estate is priced separately.
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

        {/* Handling inquiries quickly */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Handling inquiries (fast & fair)</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Quick screen (2–4 questions)">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Relevant experience or plan to hire</li>
                <li>Down payment &amp; working capital rough amount</li>
                <li>Timeline to close if it’s a fit</li>
                <li>Intent to keep what works vs. change everything</li>
              </ul>
            </Card>
            <Card title="Next step if it’s a fit">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Optional NDA, then share summary pack</li>
                <li>Set a short call; align on diligence scope &amp; timing</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Terms & seller note cautions (brief) */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Price vs. terms (keep it simple)</h3>
          <p className="text-gray-700">
            Cash at close is cleanest. If you consider a seller note, keep the docs simple and protect yourself
            (personal guarantee, UCC-1 on business assets, insurance, ACH autopay). Be careful with buyers who want
            to change everything on day one—if you carry a note, that can add risk.
          </p>
          <div className="mt-3">
            <Link href="/guides/financing-options">
              <a className="text-blue-700 hover:underline text-sm font-semibold">Financing options &amp; red flags</a>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-10">
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            <Link href="/sellers">
              <a className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-5 py-2.5 rounded-xl font-semibold">
                List Now (You Can Edit Anytime)
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
