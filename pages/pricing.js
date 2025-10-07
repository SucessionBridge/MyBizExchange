// pages/pricing.js
import Head from 'next/head'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937] relative overflow-hidden">
      <Head>
        <title>Pricing — SuccessionBridge</title>
        <meta
          name="description"
          content="Simple, transparent pricing for listing your business on SuccessionBridge."
        />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 relative">
        {/* Permanent overlay message */}
        <div className="absolute inset-0 z-10 flex items-start justify-center pt-8 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-xl max-w-xl w-full mx-auto p-5 text-center text-white">
            <p className="text-lg font-semibold">
              Early Access: Listings Are <span className="text-emerald-300">FREE</span>
            </p>
            <p className="text-sm mt-1 text-white/90">
              While we fill the marketplace, adding your business is free.<br />
              <span className="font-semibold">First-come, first-free</span> — lock in your spot today.
            </p>
            <div className="mt-4">
              <Link href="/sellers">
                <a className="inline-block px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                  List Your Business Free
                </a>
              </Link>
            </div>
            <p className="text-[11px] text-white/70 mt-2">
              Standard pricing shown below will apply after Early Access ends.
            </p>
          </div>
        </div>

        {/* Hero */}
        <section className="text-center mb-10 md:mb-14 relative z-0 opacity-70">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#2E3A59]">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
            List your business and reach qualified buyers. Most sales take
            <span className="font-semibold"> 100–189 days</span>, so pick the plan that fits your runway.
          </p>
        </section>

        {/* Plans */}
        <section className="relative grid md:grid-cols-3 gap-6 md:gap-8 opacity-70">
          <PlanCard
            name="Monthly Flex"
            price="$55"
            cadence="/ month"
            badge="3-month minimum"
            description="Get listed fast. Best if you’re testing the market."
            features={[
              'Public listing + messaging',
              'Valuation summary PDF',
              'AI description polish (basic)',
              '3-month minimum term',
            ]}
            ctaHref="/sellers?plan=monthly"
            cta="Start with Monthly"
            finePrint="Billed monthly with a 3-month minimum."
          />

          <PlanCard
            name="6-Month Saver"
            price="$50"
            cadence="/ month"
            badge="Recommended"
            highlight
            description="Covers the typical time-to-sell window."
            features={[
              'Everything in Monthly',
              'Homepage/category boost rotations',
              'Priority in buyer alerts',
              'Best fit for 100–189 day sell cycle',
            ]}
            ctaHref="/sellers?plan=semiannual"
            cta="Choose 6-Month ($300)"
            finePrint="One-time $300 for 6 months."
          />

          <PlanCard
            name="1-Year"
            price="$500"
            cadence="/ year"
            description="Maximum exposure over a full year."
            features={[
              'Everything in 6-Month',
              'Featured in newsletter at least once',
              'Great for seasonal or niche businesses',
            ]}
            ctaHref="/sellers?plan=annual"
            cta="Choose Annual"
            finePrint="One-time $500 for 12 months."
          />
        </section>

        {/* Notes / assurances */}
        <section className="mt-10 md:mt-14 grid md:grid-cols-3 gap-4 opacity-70">
          <Note title="No success fees">
            We don’t charge a broker-style commission. Your plan covers distribution and tools.
          </Note>
          <Note title="No auto-renew">
            Plans do not auto-renew. We’ll send a reminder email 7 days before your plan ends.
          </Note>
          <Note title="Upgrade anytime">
            Move from Monthly to 6-Month or Annual without losing visibility.
          </Note>
        </section>

        {/* FAQ */}
        <section className="mt-12 md:mt-16 bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 opacity-70">
          <h2 className="text-2xl font-semibold text-[#2E3A59]">FAQ</h2>
          <div className="mt-4 space-y-4">
            <Faq q="What if I sell before my plan ends?">
              Congrats! Plans simply expire at the end of their term. We don’t prorate partial periods.
            </Faq>
            <Faq q="Do you verify my numbers or provide an appraisal?">
              No. Our valuation tool is an indicative guide to help you price; it’s not an appraisal for lending, tax, insurance, or legal use.
            </Faq>
            <Faq q="Can I use my own broker?">
              Yes. Many owners use SuccessionBridge alongside a broker to increase exposure.
            </Faq>
          </div>

          <div className="mt-6 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <strong>Disclaimer:</strong> The valuation outputs and materials are guidance only and must not be used for bank loans,
            insurance, tax filings, or legal purposes. We have not verified the information you provide.
          </div>
        </section>

        {/* CTA footer */}
        <section className="text-center mt-10 md:mt-16 opacity-70">
          <Link href="/sellers">
            <a className="inline-block bg-[#14B8A6] hover:bg-[#0D9488] text-white px-6 py-3 rounded-xl font-semibold text-lg">
              List my business
            </a>
          </Link>
        </section>
      </div>
    </main>
  )
}

/* ——— components-in-file to keep this page self-contained ——— */

function PlanCard({ name, price, cadence, description, features, ctaHref, cta, finePrint, badge, highlight }) {
  return (
    <div
      className={[
        'relative rounded-2xl border shadow-sm bg-white p-6 flex flex-col',
        highlight ? 'border-blue-300 ring-2 ring-blue-200' : 'border-gray-200',
      ].join(' ')}
    >
      {badge && (
        <div
          className={[
            'absolute -top-3 left-4 px-2 py-1 text-xs font-semibold rounded-md',
            highlight ? 'bg-blue-600 text-white' : 'bg-gray-900 text-white',
          ].join(' ')}
        >
          {badge}
        </div>
      )}

      <h3 className="text-xl font-semibold text-[#2E3A59]">{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <div className="text-4xl font-bold">{price}</div>
        <div className="text-gray-600">{cadence}</div>
      </div>
      <p className="mt-2 text-gray-700">{description}</p>

      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-green-500" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <Link href={ctaHref}>
          <a
            className={[
              'block text-center w-full px-4 py-2 rounded-lg font-semibold',
              highlight
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-900 text-white hover:bg-black/90',
            ].join(' ')}
          >
            {cta}
          </a>
        </Link>
        {finePrint && <p className="mt-2 text-xs text-gray-500 text-center">{finePrint}</p>}
      </div>
    </div>
  )
}

function Note({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-700 mt-1">{children}</div>
    </div>
  )
}

function Faq({ q, children }) {
  return (
    <details className="rounded-lg border border-gray-200 bg-white p-4">
      <summary className="cursor-pointer font-medium text-[#2E3A59]">{q}</summary>
      <div className="mt-2 text-gray-700 text-sm">{children}</div>
    </details>
  )
}


