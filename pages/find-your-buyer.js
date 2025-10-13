// pages/find-your-buyer.js
import { useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";

const TEAL = "#14B8A6";
const GOLD = "#F59E0B";
const TEXT = "#2E3A59";
const CALENDLY_URL = "https://calendly.com/YOUR_CALENDLY_LINK?hide_event_type_details=1&hide_gdpr_banner=1";

export default function FindYourBuyer() {
  const openCalendly = useCallback(() => {
    if (typeof window === "undefined") return;
    window.gtag?.("event", "find_your_buyer_call_click");
    if (window.Calendly) window.Calendly.initPopupWidget({ url: CALENDLY_URL });
    else window.open(CALENDLY_URL, "_blank");
  }, []);

  const pageTitle = "Find Your Buyer — MyBizExchange";
  const pageDescription =
    "Every business has a match. We connect owners with strategic buyers — from operators to creators — so you can exit without closing.";

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937] font-sans">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://yourdomain.com/find-your-buyer" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/og-hero.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="/images/og-hero.jpg" />
        {/* Basic JSON-LD */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: pageTitle,
              description: pageDescription,
              url: "https://yourdomain.com/find-your-buyer",
            }),
          }}
        />
      </Head>

      {/* Calendly widget (popup) */}
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" />

      {/* HERO */}
      <section
        className="relative w-full bg-cover bg-center text-center py-20 sm:py-24"
        style={{ backgroundImage: "url('/images/hero-city.jpg')" }}
        aria-label="Find your buyer hero"
      >
        <div
          className="inline-block max-w-3xl mx-auto rounded-2xl border shadow-md px-6 sm:px-8 py-8 sm:py-10"
          style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", borderColor: "rgba(255,255,255,0.5)" }}
        >
          <h1 className="text-3xl sm:text-5xl font-serif font-bold leading-tight" style={{ color: TEXT }}>
            Your buyer might not be who you think.
          </h1>
          <p className="mt-4 text-lg sm:text-xl font-medium max-w-2xl mx-auto" style={{ color: TEXT, opacity: 0.9 }}>
            From operators expanding capacity to creators turning audiences into brands—today’s buyers are everywhere.
            Let’s identify the one who sees what your business could become.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={openCalendly}
              className="w-full sm:w-auto rounded-xl px-6 py-3 font-semibold shadow"
              style={{ backgroundColor: GOLD, color: "#000" }}
              aria-label="Book a free 10-minute strategy call"
            >
              Book a 10-Minute Strategy Call
            </button>
            <Link href="/sellers">
              <a
                className="w-full sm:w-auto rounded-xl px-6 py-3 font-semibold border"
                style={{ backgroundColor: "#fff", color: TEXT, borderColor: "rgba(0,0,0,0.08)" }}
                aria-label="List your business now"
              >
                List My Business
              </a>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* WHY EVERY BUSINESS CAN SELL */}
        <section className="mt-14 sm:mt-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold" style={{ color: TEXT }}>
                Every business has a match — the strategy is finding them.
              </h2>
              <p className="mt-3 text-lg text-gray-700">
                Many owners assume “no one would buy this.” In reality, the right buyer is often a{" "}
                <span className="font-semibold">strategic fit</span>—someone who can grow faster by acquiring what
                you’ve already built.
              </p>
              <ul className="mt-5 space-y-3 text-gray-700">
                <li>• A designer with a large audience buys a local print shop to produce her own merch line.</li>
                <li>• A farming creator buys a bearings supplier and sells direct to their tractor/implement followers.</li>
                <li>• A niche print company with downtime acquires a vehicle wraps shop to utilize machines year-round.</li>
              </ul>
            </div>
            <div>
              <div
                className="rounded-2xl border shadow-sm p-6"
                style={{ background: "rgba(255,255,255,0.9)", borderColor: "rgba(0,0,0,0.06)" }}
              >
                <h3 className="text-xl font-semibold" style={{ color: TEXT }}>
                  The new kind of buyer
                </h3>
                <div className="mt-4 grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white border p-4">
                    <p className="text-sm font-semibold text-gray-900">Strategic Operator</p>
                    <p className="mt-1 text-sm text-gray-700">Expands capacity, fills skill or equipment gaps.</p>
                  </div>
                  <div className="rounded-xl bg-white border p-4">
                    <p className="text-sm font-semibold text-gray-900">Creator / Influencer</p>
                    <p className="mt-1 text-sm text-gray-700">Turns audience into product lines & brand extensions.</p>
                  </div>
                  <div className="rounded-xl bg-white border p-4">
                    <p className="text-sm font-semibold text-gray-900">Complementary Business</p>
                    <p className="mt-1 text-sm text-gray-700">Buys to serve existing customers year-round.</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Your buyer doesn’t have to look like a traditional investor. They just need the strategic reason.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-16 sm:mt-20">
          <div
            className="rounded-2xl border shadow-sm p-6 sm:p-8"
            style={{ background: "rgba(255,255,255,0.9)", borderColor: "rgba(0,0,0,0.06)" }}
          >
            <h2 className="text-2xl sm:text-3xl font-semibold" style={{ color: TEXT }}>
              How we help you find the right buyer
            </h2>
            <div className="mt-6 grid md:grid-cols-4 gap-6">
              <div className="rounded-xl bg-white border p-5">
                <p className="text-sm font-semibold text-gray-900">1) 10-Minute Strategy Call</p>
                <p className="mt-1 text-sm text-gray-700">We learn your goals and identify viable buyer profiles.</p>
              </div>
              <div className="rounded-xl bg-white border p-5">
                <p className="text-sm font-semibold text-gray-900">2) Quick Valuation & Packaging</p>
                <p className="mt-1 text-sm text-gray-700">We position your strengths and clarify the upside.</p>
              </div>
              <div className="rounded-xl bg-white border p-5">
                <p className="text-sm font-semibold text-gray-900">3) Targeted Exposure</p>
                <p className="mt-1 text-sm text-gray-700">We get your opportunity in front of the right eyes.</p>
              </div>
              <div className="rounded-xl bg-white border p-5">
                <p className="text-sm font-semibold text-gray-900">4) Conversations that Count</p>
                <p className="mt-1 text-sm text-gray-700">Qualified buyers only; we save your time and energy.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={openCalendly}
                className="w-full sm:w-auto rounded-xl px-6 py-3 font-semibold shadow"
                style={{ backgroundColor: GOLD, color: "#000" }}
                aria-label="Book a free 10-minute strategy call"
              >
                Book a 10-Minute Strategy Call
              </button>
              <Link href="/sellers">
                <a
                  className="w-full sm:w-auto rounded-xl px-6 py-3 font-semibold text-white"
                  style={{ backgroundColor: TEAL }}
                  aria-label="List your business"
                >
                  List My Business
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* TWO-PATH CHOICE */}
        <section className="mt-16 sm:mt-20">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold" style={{ color: TEXT }}>
              Choose your path
            </h2>
            <p className="mt-3 text-lg text-gray-700">
              Ready to move? List now. Want clarity first? Let’s talk. Either way, we’ll help you explore the
              buyers who see your business as a strategic fit.
            </p>
          </div>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">List My Business</h3>
              <p className="mt-2 text-sm text-gray-700">
                Create a listing in minutes. It’s free to start, and we’ll guide your next steps.
              </p>
              <Link href="/sellers">
                <a
                  className="mt-4 inline-block rounded-lg px-4 py-2 font-semibold text-white"
                  style={{ backgroundColor: TEAL }}
                >
                  List Now
                </a>
              </Link>
            </div>
            <div className="rounded-2xl bg-white border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Talk to Us First</h3>
              <p className="mt-2 text-sm text-gray-700">
                Not sure it’s sellable? We’ll map the buyer profiles and show the strategy.
              </p>
              <button
                onClick={openCalendly}
                className="mt-4 inline-block rounded-lg px-4 py-2 font-semibold"
                style={{ backgroundColor: GOLD, color: "#000" }}
              >
                Book 10-Minute Call
              </button>
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="mt-16 sm:mt-20 mb-16 sm:mb-24">
          <div
            className="rounded-2xl border shadow-sm p-6 sm:p-8 text-center"
            style={{ background: "rgba(255,255,255,0.9)", borderColor: "rgba(0,0,0,0.06)" }}
          >
            <h2 className="text-2xl sm:text-3xl font-semibold" style={{ color: TEXT }}>
              Exit without closing. Keep what you built alive.
            </h2>
            <p className="mt-3 text-lg text-gray-700 max-w-3xl mx-auto">
              We believe small businesses power the economy and the communities they serve. Our mission is to help owners
              move on with confidence—by matching them with buyers who see strategic value and a path to growth.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={openCalendly}
                className="w-full sm:w-auto rounded-xl px-6 py-3 font-semibold shadow"
                style={{ backgroundColor: GOLD, color: "#000" }}
                aria-label="Book a free 10-minute strategy call"
              >
                Book a Strategy Call
              </button>
              <Link href="/sellers">
                <a
                  className="w-full sm:w-auto rounded-xl px-6 py-3 font-semibold text-white"
                  style={{ backgroundColor: TEAL }}
                  aria-label="List your business"
                >
                  List My Business
                </a>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Page-specific micro styles */}
      <style jsx global>{`
        a, button { -webkit-tap-highlight-color: transparent; }
        :focus-visible { outline: none; }
      `}</style>
    </main>
  );
}
