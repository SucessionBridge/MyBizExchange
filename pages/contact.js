import Head from "next/head";
import Script from "next/script";
import Link from "next/link";

export default function Contact() {
  const pageTitle = "Talk to Us — MyBizExchange";
  const pageDescription =
    "We already have buyers actively looking for service, home services, e-commerce, trucking, restaurants, and more. Tell us about your business and we’ll match you confidentially.";

  // Your live Calendly link
  const calendlyUrl = "https://calendly.com/thestevelodge/new-meeting";

  // Public contact email
  const email = "thestevelodge@gmail.com";

  // Popup handler (opens Calendly modal; falls back to direct link if script not ready)
  const openCalendly = (e) => {
    e?.preventDefault?.();
    if (typeof window !== "undefined" && window.Calendly) {
      window.Calendly.initPopupWidget({ url: calendlyUrl });
    } else {
      window.location.href = calendlyUrl;
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937] font-sans">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/og-hero.jpg" />
      </Head>

      {/* Calendly script for inline widget + popup */}
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />

      {/* Hero */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#2E3A59]">
              Talk to us — we already have buyers for businesses like yours.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-700">
              Our marketplace is full of serious buyers searching across industries and deal sizes.
              We’ll match you confidentially, help you price correctly, and guide flexible structures
              like <span className="font-semibold">seller financing</span> or <span className="font-semibold">rent-to-own</span>.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                onClick={openCalendly}
                href={calendlyUrl}
                className="inline-flex items-center justify-center rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white px-5 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14B8A6]"
                aria-label="Book an intro call"
              >
                Book an Intro Call
              </a>
              <a
                href={`mailto:${email}?subject=I want to sell my business&body=Hi, I’d like to discuss selling my business. Here are a few details:%0A%0ABusiness name:%0AIndustry:%0ALocation:%0AAnnual sales:%0AApprox. SDE (owner profit):%0AIdeal timeline:%0AAnything else:%0A`}
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                aria-label="Send us an email"
              >
                Email the Team
              </a>
              <Link href="/sellers">
                <a
                  className="inline-flex items-center justify-center rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white px-5 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F59E0B]"
                  aria-label="Start a listing"
                >
                  Start a Listing
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who’s already looking */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#2E3A59]">
            Who’s already looking on MyBizExchange
          </h2>
          <p className="mt-3 text-gray-700">
            We regularly hear from operators, corporate refugees, and small funds seeking profitable,
            steady businesses. Here are common buyer searches right now:
          </p>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              "Home services (landscaping, HVAC, cleaning)",
              "Trucking, logistics & last-mile delivery",
              "E-commerce & niche DTC brands",
              "Auto services & mobile repair",
              "Light manufacturing & specialty fabrication",
              "Restaurants & coffee shops (cash-flowing)",
              "B2B services & agency roll-ups",
              "Route & territory businesses",
              "Franchise resales",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 text-sm text-gray-600">
            Buyers are open to creative terms:{" "}
            <span className="font-medium text-gray-800">
              seller financing, earn-outs, profit-sharing, and rent-to-own
            </span>
            . We’ll help you choose what fits your goals.
          </div>
        </div>
      </section>

      {/* What you get / How it works */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
            <h3 className="text-xl md:text-2xl font-semibold text-[#2E3A59]">What you get</h3>
            <ul className="mt-4 space-y-3 text-gray-700">
              <li>✅ Confidential buyer outreach and screening</li>
              <li>✅ <span className="font-semibold">AI-enhanced listing</span> that highlights your strengths</li>
              <li>✅ Free <span className="font-semibold">valuation estimate</span> (SDE × industry multiple)</li>
              <li>✅ Guidance on flexible financing structures</li>
              <li>✅ Messaging and interest tracking from buyers</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
            <h3 className="text-xl md:text-2xl font-semibold text-[#2E3A59]">How it works</h3>
            <ol className="mt-4 space-y-3 text-gray-700">
              <li><span className="font-semibold">1)</span> Share a few details about your business.</li>
              <li><span className="font-semibold">2)</span> We prep your AI-assisted listing and valuation range.</li>
              <li><span className="font-semibold">3)</span> We match you with qualified buyers and structure offers.</li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                onClick={openCalendly}
                href={calendlyUrl}
                className="inline-flex items-center rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2 font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14B8A6]"
              >
                Book a Call
              </a>
              <Link href="/sellers">
                <a className="inline-flex items-center rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-white px-4 py-2 font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F59E0B]">
                  Start a Listing
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Inline Calendly */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-0 overflow-hidden">
          <div className="px-6 pt-6">
            <h3 className="text-xl md:text-2xl font-semibold text-[#2E3A59]">
              Prefer to grab time directly?
            </h3>
            <p className="mt-2 text-gray-700">
              Pick a slot that works for you. We’ll discuss goals, valuation, and buyer fit.
            </p>
          </div>
          <div
            className="calendly-inline-widget mt-4"
            data-url={calendlyUrl}
            style={{ minWidth: "320px", height: "680px" }}
            aria-label="Calendly scheduling widget"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
          <h3 className="text-xl md:text-2xl font-semibold text-[#2E3A59]">Common questions</h3>
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900">Will buyers see my business name?</h4>
              <p className="mt-2 text-gray-700">
                Not unless you want them to. We can keep your listing confidential and share details
                after a signed NDA or once fit is confirmed.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">What if my price is unclear?</h4>
              <p className="mt-2 text-gray-700">
                We’ll estimate value using your SDE and an industry multiple, then adjust based on
                growth, contracts, and equipment or real estate.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Do I need perfect financials?</h4>
              <p className="mt-2 text-gray-700">
                No. Bring what you have (P&amp;L, bank summaries, POS exports). We’ll help organize
                and present buyers with a clear, simple story.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Can you help with flexible deals?</h4>
              <p className="mt-2 text-gray-700">
                Yes — seller financing, profit-share, and rent-to-own are common on our platform.
                We’ll help you find a structure that fits your goals.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              onClick={openCalendly}
              href={calendlyUrl}
              className="inline-flex items-center justify-center rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white px-5 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14B8A6]"
            >
              Book an Intro Call
            </a>
            <a
              href={`mailto:${email}?subject=I want to sell my business&body=Hi, I’d like to discuss selling my business. Here are a few details:%0A%0ABusiness name:%0AIndustry:%0ALocation:%0AAnnual sales:%0AApprox. SDE (owner profit):%0AIdeal timeline:%0AAnything else:%0A`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
            >
              Email the Team
            </a>
          </div>
        </div>
      </section>

      {/* Global helpers */}
      <style jsx global>{`
        a, button { -webkit-tap-highlight-color: transparent; }
        :focus-visible { outline: none; }
      `}</style>
    </main>
  );
}

