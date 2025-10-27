// pages/about.js
import Head from 'next/head'
import Link from 'next/link'

// Show founder name on the page
const SHOW_FOUNDER_NAME = true;
const FOUNDER_NAME = 'Steve Lodge';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Head>
        <title>About Us — MyBizExchange</title>
        <meta
          name="description"
          content="MyBizExchange helps main-street owners sell well: more qualified eyes, plain-English valuation guidance, and flexible financing basics."
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Hero */}
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#2E3A59]">
            Built to help main-street owners exit well
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-700">
            More qualified eyes on your business. Plain-English tools. Practical financing guidance.
          </p>

          {/* Side-by-side on mobile & desktop; wraps if too narrow */}
          <div className="mt-6 flex flex-row flex-wrap items-center justify-center gap-3">
            <Link href="/sellers">
              <a className="text-center bg-[#F59E0B] hover:bg-[#D97706] text-white px-6 py-3 rounded-xl font-semibold">
                List your business
              </a>
            </Link>
            <Link href="/listings">
              <a className="text-center bg-[#14B8A6] hover:bg-[#0D9488] text-white px-6 py-3 rounded-xl font-semibold">
                Browse listings
              </a>
            </Link>
          </div>
        </header>

        {/* Our Story */}
        <section className="mt-12 md:mt-16 bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-[#2E3A59]">Why we built MyBizExchange</h2>
          <div className="mt-3 space-y-4 text-gray-700 leading-relaxed">
            {SHOW_FOUNDER_NAME ? (
              <p>
                Hi, I’m <strong>{FOUNDER_NAME}</strong>, founder of MyBizExchange. I’ve bought, built, and sold multiple
                businesses—some wins, some hard lessons. I’ve used seller financing as a buyer (great outcomes) and as a
                seller (one deal that went sideways while the buyer still did fine). Those experiences shaped how we think
                about risk and structure.
              </p>
            ) : (
              <p>
                We’ve bought, built, and sold multiple businesses—some wins, some hard lessons. We’ve used seller financing as
                buyers (great outcomes) and as sellers (one deal that went sideways while the buyer still did fine). Those
                experiences shaped how we think about risk and structure.
              </p>
            )}

            <p>
              A few years ago, we co-founded a tech business on <strong>$160K</strong> of investment and a ton of sweat. It
              bootstrapped into steady cash flow. When we asked a broker about selling, we heard: <em>“With SDE around
              $200K, you might need to find your own buyer.”</em> We didn’t have a playbook—so we built one the scrappy way:
              we contacted industry leaders, shared the story, and focused on getting <strong>more eyes</strong> on the
              opportunity.
            </p>
            <p>
              The result? We sold for <strong>$4.5M</strong> USD. That taught us a simple truth:
              <br />
              <span className="font-semibold">
                A business might be worth X to the average buyer—but to the right buyer with a specific fit, it can be worth
                many times more.
              </span>
            </p>
            <p>
              MyBizExchange exists to give main-street owners that same advantage: modern listing tools, valuation guidance,
              and practical financing basics that help you reach serious buyers and structure deals that actually work.
              Many brokers do great work; you can use our platform as a DIY path or alongside a broker.
            </p>
          </div>
        </section>

        {/* The spark — your mower/landscaping story */}
        <section className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
          <h3 className="text-xl font-semibold text-[#2E3A59]">The spark: a driveway conversation</h3>
          <div className="mt-3 space-y-4 text-gray-700 leading-relaxed">
            <p>
              The idea for MyBizExchange clicked on a road trip with my son, who runs a small landscaping company.
              We’d seen two commercial mowers listed at less than half their value—three hours away. We drove out, met the
              owner, and asked why he was selling.
            </p>
            <p>
              He said, “I’m 68. I can’t keep doing landscaping, so I’m shutting down and selling the equipment.” He had a
              strong customer base. When we asked what would happen to his clients, he said they’d have to find someone else.
            </p>
            <p>
              We didn’t end up buying the mowers—we didn’t need them—but on the drive home the thought stuck:
              <span className="font-semibold"> he shouldn’t have to close; he should be able to sell</span>. Even a simple
              handover of accounts to a nearby operator could have unlocked real value for him and continuity for his
              customers.
            </p>
            <p>
              That’s the gap we’re closing. If a listing can help an owner capture even an extra <strong>$50,000</strong>,
              spending <strong>$50/month</strong> is a no-brainer. MyBizExchange is the place to try—put the opportunity in
              front of qualified buyers and let the market create the value.
            </p>
          </div>
        </section>

        {/* What you get */}
        <section className="mt-8 grid md:grid-cols-2 gap-4">
          <Card
            title="What you get"
            items={[
              'Visibility: public listing + category/homepage rotations + buyer alerts',
              'Valuation guidance: SDE × industry ranges, in plain English',
              'AI listing polish: turn bullet points into a clear, compelling summary',
              'Flexible financing basics: seller-finance guardrails and checklists',
              'Direct conversations: secure messaging with interested buyers',
              'Scorecard & prep: know your sellability and what to tighten up next',
            ]}
          />
          <Card
            title="What we’re not"
            items={[
              'Not an appraisal and not a substitute for legal/tax/lending advice',
              'We don’t verify your numbers; our tools are indicative guidance',
              'No sneaky auto-renewals — we send reminders before terms end',
            ]}
          />
        </section>

        {/* Links to deep dives */}
        <section className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
          <h3 className="text-xl font-semibold text-[#2E3A59]">Learn the playbook</h3>
          <p className="mt-2 text-gray-700">
            Start fast, then refine as buyer interest builds. These guides keep you moving without over-engineering day one.
          </p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <GuideLink href="/business-valuation" title="Value your business" />
            <GuideLink href="/guides/how-to-sell" title="How to sell (start now, polish as you go)" />
            <GuideLink href="/guides/prep-to-sell" title="Get your business ready to sell" />
            <GuideLink href="/guides/financing-options" title="Financing options & seller-finance basics" />
            <GuideLink href="/scorecard" title="Sellability Scorecard" />
          </div>
        </section>

        {/* Trust & privacy */}
        <section className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-[#2E3A59]">Your data, handled carefully</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>We only ask for what we need; you control what appears in your listing.</li>
              <li>Transport + at-rest encryption; role-based access; RLS policies for public data access.</li>
              <li>
                See our{' '}
                <Link href="/privacy">
                  <a className="text-blue-700 hover:underline">Privacy Notice</a>
                </Link>{' '}
                and{' '}
                <Link href="/terms">
                  <a className="text-blue-700 hover:underline">Terms of Use</a>
                </Link>
                .
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-[#2E3A59]">What’s next</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>Smarter buyer matching signals</li>
              <li>Cleaner document request rooms</li>
              <li>Light due-diligence templates and checklists</li>
              <li>Optional broker add-ons</li>
            </ul>
          </div>
        </section>

        {/* CTA footer */}
        <section className="text-center mt-10 md:mt-14">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3">
            <Link href="/sellers">
              <a className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-6 py-3 rounded-xl font-semibold text-lg">
                List my business
              </a>
            </Link>
            <Link href="/listings">
              <a className="bg-[#14B8A6] hover:bg-[#0D9488] text-white px-6 py-3 rounded-xl font-semibold text-lg">
                Browse listings
              </a>
            </Link>
          </div>

          <p className="mt-4 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3 inline-block">
            <strong>Disclaimer:</strong> Valuation outputs are guidance only and must not be used for bank loans, insurance,
            tax filings, or legal purposes.
          </p>
        </section>
      </div>
    </main>
  );
}

function Card({ title, items }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-[#2E3A59]">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-700">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-green-500" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GuideLink({ href, title }) {
  return (
    <Link href={href}>
      <a className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 hover:bg-gray-50">
        {title} →
      </a>
    </Link>
  );
}

