// pages/guides/prep-to-sell.js
import Head from 'next/head'
import Link from 'next/link'

export default function PrepToSell() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Head>
        <title>Get Your Business Ready to Sell — Practical Playbook</title>
        <meta
          name="description"
          content="A practical, plain-English playbook to make your business easier to buy: SOPs, managers, systems, contracts, and clean handover."
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-[#2E3A59]">
            Get Your Business Ready to Sell (Practical Playbook)
          </h1>
          <p className="mt-3 text-lg text-gray-700">
            Buyers pay more for businesses that run on systems—not the owner. Use this guide to
            tighten <strong>SOPs, management, contracts, and access</strong> so a buyer can step in
            with confidence.
          </p>

          <div className="mt-4 flex gap-2 flex-wrap">
            <Link href="/sellers">
              <a className="inline-block bg-[#F59E0B] hover:bg-[#D97706] text-white px-4 py-2 rounded-lg text-sm font-semibold">
                List Now (Polish As You Go)
              </a>
            </Link>
            <Link href="/business-valuation">
              <a className="inline-block bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold">
                Get a Price Range
              </a>
            </Link>
            <Link href="/guides/how-buyers-value">
              <a className="inline-block bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold">
                How Buyers Value Businesses
              </a>
            </Link>
          </div>

          <div className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <strong>Don’t wait:</strong> You can list first, then complete this prep in stages while
            buyer conversations begin.
          </div>
        </header>

        {/* 30/60/90 framing */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#2E3A59]">A simple 30/60/90 plan</h2>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <Pill title="Days 0–30">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Create/collect core SOPs for daily ops</li>
                <li>List key logins; turn on MFA + password manager</li>
                <li>Confirm lease assignment path with landlord</li>
                <li>Draft equipment &amp; inventory lists (at cost)</li>
              </ul>
            </Pill>
            <Pill title="Days 31–60">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Cross-train staff; document manager duties</li>
                <li>Clean vendor/customer contracts &amp; renewals</li>
                <li>Prep summary P&amp;L + simple SDE recast</li>
                <li>Organize digital assets (domain, website, socials)</li>
              </ul>
            </Pill>
            <Pill title="Days 61–90">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Finalize transition plan &amp; training hours</li>
                <li>Service/maintenance logs up to date</li>
                <li>Insurance review; COI for key customers/landlord</li>
                <li>Light “data room” for diligence (see tiers below)</li>
              </ul>
            </Pill>
          </div>
        </section>

        {/* Five pillars */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">The 5 pillars buyers look for</h3>
          <div className="grid md:grid-cols-2 gap-4 mt-3">
            <Card title="1) Operations & SOPs">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Document daily/weekly SOPs for core workflows</li>
                <li>Opening/closing checklists, cash handling, deposits</li>
                <li>Vendor ordering guides &amp; par levels</li>
                <li>Quality standards (photos/specs where helpful)</li>
                <li>Calendar of recurring tasks (payroll, filings, taxes)</li>
              </ul>
            </Card>
            <Card title="2) People & Management">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Org chart &amp; role descriptions (who does what)</li>
                <li>Cross-training to reduce single-point dependency</li>
                <li>Manager checklist: weekly KPIs, cash, staffing</li>
                <li>Onboarding packet &amp; training schedule templates</li>
                <li>Key person risk plan (backup coverage)</li>
              </ul>
            </Card>
            <Card title="3) Legal & Contracts">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Lease: term, options, assignment/consent steps</li>
                <li>Customer/vendor agreements; renewals &amp; notices</li>
                <li>Licenses/permits (status, expiry, transfer steps)</li>
                <li>IP &amp; brand assets (names, logos, domains)</li>
                <li>UCC/liens check; payoff letters if needed</li>
              </ul>
            </Card>
            <Card title="4) Systems & Access (Security Ready)">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Master list of logins; ownership email for each</li>
                <li>MFA enabled; shared via password manager</li>
                <li>POS/accounting/CRM access roles (least privilege)</li>
                <li>Backups for key data (export instructions)</li>
                <li>Handover plan for domains, website, socials, ads</li>
              </ul>
            </Card>
            <Card title="5) Financials & Assets">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>12–36 months P&amp;L + simple SDE add-back schedule</li>
                <li>Sales tax &amp; payroll filings current</li>
                <li>Equipment list (make/model/serial, condition)</li>
                <li>Inventory at cost (method &amp; cadence)</li>
                <li>Working capital expectations at close (if any)</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Data tiers */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Share in tiers (protect your time)</h3>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <Pill title="Tier 1 — Teaser">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Public listing + 6–12 photos</li>
                <li>Revenue &amp; SDE (range ok), price expectations</li>
                <li>Basic highlights (team, location, licenses)</li>
              </ul>
            </Pill>
            <Pill title="Tier 2 — Summary Pack (NDA optional)">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Summary P&amp;L + SDE recast</li>
                <li>Lease excerpt; key vendor/customer overview</li>
                <li>Ops overview (SOP table of contents)</li>
              </ul>
            </Pill>
            <Pill title="Tier 3 — Diligence Set (after fit & LOI)">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Contracts, full financials, bank statements</li>
                <li>Equipment/Inventory detail, maintenance logs</li>
                <li>Access role review; transition &amp; training plan</li>
              </ul>
            </Pill>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Most buyers don’t need a data room on day one—clarity and confidence matter more.
          </p>
        </section>

        {/* Landlord & assignment */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Lease & Landlord Readiness</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-2">
            <li>Assignment clause and any required forms/process</li>
            <li>Outstanding arrears/repairs addressed or disclosed</li>
            <li>Contact info & relationship notes (response times)</li>
            <li>What a “qualified” buyer must show (financials, resume)</li>
          </ul>
        </section>

        {/* Metrics buyers scan fast */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">The quick metrics buyers scan</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Health snapshot">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>SDE margin (SDE ÷ Revenue)</li>
                <li>Trailing-12 trend (last 12 months vs prior)</li>
                <li>Customer/vendor concentration (&gt;20% = flag)</li>
                <li>Seasonality notes (set expectations)</li>
              </ul>
            </Card>
            <Card title="Risk reducers">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Manager in place; owner hours low</li>
                <li>Documented SOPs + cross-training</li>
                <li>Clean lease path; licenses current</li>
                <li>Digital access tidy; MFA + password manager</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Transition plan */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Transition plan (make it easy to say “yes”)</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-2">
            <li>Training hours over first 2–6 weeks (calendar)</li>
            <li>Shadow period &amp; check-ins (weekly cadence)</li>
            <li>Handover of vendors, key customers, and team leads</li>
            <li>Access transfer day-by-day (domains, POS, banking)</li>
            <li>Optional consulting window post-close</li>
          </ul>
        </section>

        {/* Red flags & quick wins */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Common red flags (and quick wins)</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <Card title="Watch out for">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>“Only I can do this” owner dependence</li>
                <li>No SOPs; passwords in people’s heads</li>
                <li>Unclear lease assignment/expiring permits</li>
                <li>Messy books; cash skims you can’t substantiate</li>
              </ul>
            </Card>
            <Card title="Fast improvements">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Write the top 10 SOPs (one page each)</li>
                <li>Centralize logins; enable MFA; set roles</li>
                <li>Confirm landlord path; collect forms</li>
                <li>Summarize SDE add-backs clearly</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* CTAs */}
        <section className="text-center mb-10">
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            <Link href="/sellers">
              <a className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-5 py-2.5 rounded-xl font-semibold">
                List Your Business
              </a>
            </Link>
            <Link href="/business-valuation">
              <a className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-5 py-2.5 rounded-xl font-semibold">
                Run a Quick Valuation
              </a>
            </Link>
            <Link href="/guides/financing-options">
              <a className="text-blue-700 hover:underline font-semibold">
                See Financing Options &amp; Cautions
              </a>
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4">
          <p className="text-sm">
            <strong>Note:</strong> This guide is general information, not legal, tax, or financial advice.
            Always consult a qualified attorney and CPA for your specific situation and jurisdiction.
          </p>
        </section>
      </div>
    </main>
  )
}

/* ---------- helpers ---------- */
function Card({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="font-semibold text-[#2E3A59]">{title}</div>
      <div className="mt-2 text-gray-700">{children}</div>
    </div>
  )
}

function Pill({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="font-semibold text-[#2E3A59]">{title}</div>
      <div className="mt-2 text-gray-700 text-sm">{children}</div>
    </div>
  )
}
