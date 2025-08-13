// pages/guides/financing-options.js
import Head from 'next/head'
import Link from 'next/link'

export default function FinancingOptions() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Head>
        <title>Financing Options — SuccessionBridge</title>
        <meta
          name="description"
          content="Financing options for buying and selling small businesses. A practical guide focused on seller financing, risks, and protections."
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-[#2E3A59]">
            Financing Options for Small Business Deals
          </h1>
          <p className="mt-3 text-lg text-gray-700">
            There isn&apos;t one &quot;right&quot; structure. Every buyer and seller trades risk, speed, and price differently.
            This guide highlights the most common paths&mdash;with a practical focus on <strong>seller financing</strong>
            and what to watch out for.
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

        {/* Quick landscape */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#2E3A59]">Common structures (fast overview)</h2>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <Card title="All-cash">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Fastest close, lowest risk to seller.</li>
                <li>Usually lowest price vs. financed alternatives.</li>
              </ul>
            </Card>
            <Card title="SBA/Bank + Seller Note">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Lender funds most; seller carries 5&ndash;15% as a standby note.</li>
                <li>Heavier diligence; timing 45&ndash;90 days typical.</li>
              </ul>
            </Card>
            <Card title="Pure Seller Financing">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Seller receives down payment, carries the rest.</li>
                <li>Max flexibility on terms; also higher seller risk without safeguards.</li>
              </ul>
            </Card>
            <Card title="Earn-outs / Revenue-share">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Part of price paid only if performance happens.</li>
                <li>Useful when growth claims are unproven.</li>
              </ul>
            </Card>
            <Card title="Equipment / Asset lines">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Finance trucks/equipment separately; reduces cash at close.</li>
                <li>Assets secure the debt; relatively standard.</li>
              </ul>
            </Card>
            <Card title="Equity partners / Investors">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Buyer brings an investor; less debt, more stakeholders.</li>
                <li>Can speed close but adds governance docs.</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Deep dive: Seller Financing */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Seller Financing: what it is &amp; why it&apos;s popular</h3>
          <p className="mt-2 text-gray-700">
            The seller accepts a <strong>down payment</strong> at closing and a <strong>promissory note</strong> for the balance,
            paid over time. It often gets deals done when buyers can run the business but can&apos;t (or don&apos;t want to) borrow the whole price.
          </p>

          <div className="mt-4 grid md:grid-cols-2 gap-3">
            <Card title="Typical levers">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Down payment (10&ndash;40% common)</li>
                <li>Interest rate (fixed or variable)</li>
                <li>Term (e.g., 24&ndash;60 months), amortization &amp; any balloon</li>
                <li>Payment timing (monthly; seasonal schedules are possible)</li>
                <li>Security (UCC-1 on assets, titles, personal guarantee)</li>
              </ul>
            </Card>
            <Card title="Add protections (seller)">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Personal guarantee from buyer/owners</li>
                <li>Security interest (UCC-1) on business assets &amp; key equipment</li>
                <li>Landlord consent &amp; assignment rights (for step-in if default)</li>
                <li>Insurance with seller as loss payee; name seller as additional insured</li>
                <li>ACH autopay + monthly financial reporting covenants</li>
              </ul>
            </Card>
          </div>

          {/* Seasonal / example */}
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
            <h4 className="font-semibold text-[#2E3A59]">Seasonal businesses: match payments to cash flow</h4>
            <p className="mt-1 text-sm text-gray-700">
              If the business operates, say, <strong>7 months a year</strong>, consider either (a) payments only during those months,
              or (b) smaller off-season payments with catch-up in season. The goal is to keep the note serviceable from business cash flow&mdash;
              while still protecting the seller.
            </p>
            <div className="mt-3 text-sm text-gray-800">
              <strong>Real-world cautionary tale (from a seller):</strong> A profitable food-truck was sold with a
              down payment and monthly note over 4 years. The buyer immediately changed the <em>name, menu, hours, and quality</em>.
              Results declined, the business failed within ~2 years, and the seller had to take it back and re-sell at a fraction of the price.
              The initial down payment plus the second sale ultimately made the seller whole&mdash;but only after disruption and effort.
            </div>
            <p className="mt-2 text-sm text-gray-700">
              <em>Takeaway:</em> Seller financing works best when the buyer respects the playbook that created the cash flow&mdash;or when
              the note includes covenants and remedies if they decide to &quot;change everything&quot; too fast.
            </p>
          </div>
        </section>

        {/* Red flags & covenants */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Red flags &amp; smart covenants</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Card title="Red flags (before you carry a note)">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Buyer wants radical changes on Day 1 (brand/menu/offer)</li>
                <li>No operator experience and no plan to retain key staff</li>
                <li>Weak personal credit &amp; no guarantor</li>
                <li>No cushion for working capital / seasonality</li>
                <li>Unwilling to share monthly P&amp;L and bank statements</li>
              </ul>
            </Card>
            <Card title="Covenants that help">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li><strong>Operating covenants</strong>: no major brand/menu changes for 6&ndash;12 months without seller consent</li>
                <li><strong>Reporting</strong>: monthly P&amp;L + revenue proof (POS exports) to the seller</li>
                <li><strong>Cash controls</strong>: ACH autopay on note; late fees; cure periods; default triggers</li>
                <li><strong>Security &amp; step-in</strong>: UCC-1, titled vehicles, landlord consent to assign, domain/phone/brand in escrow</li>
                <li><strong>Training/transition</strong>: minimum hours/weeks defined; non-compete/non-solicit as permitted</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Seller note term sheet outline */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Seller-note: quick term sheet outline</h3>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Purchase structure</strong>: Asset sale (typical) or equity sale</li>
              <li><strong>Price</strong>: $[price] ; <strong>Down payment</strong>: $[down] ; <strong>Note</strong>: $[balance]</li>
              <li><strong>Interest</strong>: [rate]% fixed; <strong>Term</strong>: [months] months; <strong>Amortization</strong>: [schedule]; Balloon: $[balloon]</li>
              <li><strong>Payments</strong>: $[amount] monthly; seasonal schedule if applicable</li>
              <li><strong>Security</strong>: 1st/2nd lien on assets; UCC-1; titles; PG from owners</li>
              <li><strong>Covenants</strong>: reporting, no major changes for [months] months, insurance, taxes current</li>
              <li><strong>Default</strong>: late &gt; [days] days, [misses] missed payments in [window] months, breach of covenants</li>
              <li><strong>Remedies</strong>: late fees, interest step-up, acceleration, step-in/assignment rights</li>
              <li><strong>Transition</strong>: [hours] hours training; brand/IP license terms; escrowed logins/domains</li>
              <li><strong>Working capital</strong>: target &amp; true-up method at close</li>
            </ul>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            This is a <em>conversation checklist</em>, not legal language. Have a qualified attorney &amp; CPA adapt for your jurisdiction/taxes.
          </p>
        </section>

        {/* Taxes + legal */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E3A59]">Taxes &amp; legal (talk to pros)</h3>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
            <li><strong>Asset vs. stock</strong>: affects depreciation, goodwill, and taxes for both sides.</li>
            <li><strong>Installment sale</strong>: spreads gain over years (seller); specifics depend on your situation.</li>
            <li><strong>State rules</strong>: some states limit confession-of-judgment; repossession rules differ.</li>
            <li><strong>Licenses/permits/leases</strong>: confirm assignability and timing so the handoff is clean.</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center mb-10">
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            <Link href="/sellers">
              <a className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-5 py-2.5 rounded-xl font-semibold">
                List your business
              </a>
            </Link>
            <Link href="/business-valuation">
              <a className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-5 py-2.5 rounded-xl font-semibold">
                Price it with our tool
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


