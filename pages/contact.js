import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

export default function Contact() {
  const pageTitle = "Talk to Us — MyBizExchange";
  const pageDescription =
    "We already have buyers actively looking across industries. Your business doesn’t have to be perfect to sell — we help you reach more buyers and structure flexible deals.";

  // Live Calendly link (kept to show real-human guidance)
  const calendlyUrl = "https://calendly.com/thestevelodge/new-meeting";

  // Public contact email (used in the success note)
  const email = "thestevelodge@gmail.com";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    subject: "Sell My Business — Intro",
    message: "",
    website: "", // honeypot
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (submitting) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    if (form.website) {
      // Honeypot: silently succeed for bots
      setSubmitted(true);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/contact-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to send your message.");
      }
      setSubmitted(true);
      setForm({
        name: "",
        email: "",
        phone: "",
        businessName: "",
        subject: "Sell My Business — Intro",
        message: "",
        website: "",
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
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

      {/* Top section: clear positioning + quick CTAs */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#2E3A59]">
              Talk to us — we already have buyers for businesses like yours.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-700">
              Your business doesn’t have to be perfect to sell. Getting your listing in front of{" "}
              <span className="font-semibold">more of the right buyers</span> makes it more sellable — that’s what we do.
              We’ll match you confidentially, help you price correctly, and guide flexible structures like{" "}
              <span className="font-semibold">seller financing</span> or{" "}
              <span className="font-semibold">rent-to-own</span>. Prefer real-human guidance?{" "}
              <span className="font-medium">Book a quick call.</span>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white px-5 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14B8A6]"
              >
                Book a 15-min Call
              </a>
              <Link href="/sellers">
                <a
                  className="inline-flex items-center justify-center rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white px-5 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F59E0B]"
                >
                  Start a Listing
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main content: form + credibility column */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* LEFT: Contact form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#2E3A59]">
              Send us a message
            </h2>
            <p className="mt-2 text-gray-700">
              Share a few details and we’ll get right back to you. Prefer live help?{" "}
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#14B8A6] underline"
              >
                Book a quick call
              </a>{" "}
              (Zoom/Google Meet/Phone).
            </p>

            {submitted ? (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="font-medium text-green-800">
                  Thanks — your message has been received.
                </p>
                <p className="mt-1 text-green-800">
                  We’ll reply shortly. If it’s urgent,{" "}
                  <a
                    className="underline font-semibold"
                    href={`mailto:${email}?subject=Replying to my contact form submission`}
                  >
                    email us directly
                  </a>{" "}
                  or{" "}
                  <a
                    className="underline font-semibold"
                    href={calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    book a call
                  </a>.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={onChange}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="name">
                    Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={onChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={onChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="phone">
                      Phone (optional)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={onChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="businessName">
                      Business name (optional)
                    </label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      value={form.businessName}
                      onChange={onChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                      placeholder="Acme Services"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="subject">
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      value={form.subject}
                      onChange={onChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="message">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={onChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                    placeholder="A few quick details about your business, timeline, and goals…"
                  />
                </div>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-60 text-white px-5 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14B8A6]"
                  >
                    {submitting ? "Sending…" : "Send Message"}
                  </button>

                  <a
                    href={calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-[#2E3A59] hover:opacity-95 text-white px-5 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2E3A59]"
                  >
                    Or Book a Call (Zoom / Meet / Phone)
                  </a>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT: Credibility / Buyer demand */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-[#2E3A59]">
                We already have buyers looking
              </h3>
              <p className="mt-2 text-gray-700">
                Operators, corporate refugees, and small funds are actively searching for steady, profitable businesses.
                We’ll get your listing in front of more eyes and help you structure offers that work.
              </p>
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  "Home services",
                  "Trucking & logistics",
                  "E-commerce / DTC",
                  "Auto services",
                  "Light manufacturing",
                  "Restaurants / cafés",
                  "B2B services",
                  "Franchise resales",
                  "Routes & territories",
                ].map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-700">
                Flexible deals welcome:{" "}
                <span className="font-medium">seller financing, earn-outs, profit-share, rent-to-own</span>.
              </div>
              <div className="mt-6">
                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2 font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14B8A6]"
                >
                  Book a 15-min Intro
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
              <h4 className="text-xl font-semibold text-[#2E3A59]">How it works</h4>
              <ol className="mt-3 space-y-3 text-gray-700">
                <li><span className="font-semibold">1)</span> Send a quick message or book a call.</li>
                <li><span className="font-semibold">2)</span> We prep your AI-assisted listing & valuation range.</li>
                <li><span className="font-semibold">3)</span> We put it in front of more buyers and structure offers.</li>
              </ol>
              <div className="mt-4">
                <Link href="/sellers">
                  <a className="inline-flex items-center rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-white px-4 py-2 font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F59E0B]">
                    Start a Listing
                  </a>
                </Link>
              </div>
            </div>
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
