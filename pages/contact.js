import Head from "next/head";
import Script from "next/script";
import Link from "next/link";
import { useState } from "react";

export default function Contact() {
  const pageTitle = "Talk to Us — MyBizExchange";
  const pageDescription =
    "We already have buyers actively looking for service, home services, e-commerce, trucking, restaurants, and more. Tell us about your business and we’ll match you confidentially.";

  // Your live Calendly link
  const calendlyUrl = "https://calendly.com/thestevelodge/new-meeting";

  // Public contact email (used in mailto fallback link on success)
  const email = "thestevelodge@gmail.com";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Sell My Business — Intro",
    message: "",
    website: "", // honeypot (leave empty)
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

    // basic front-end validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    // honeypot check
    if (form.website) {
      setSubmitted(true); // quietly succeed for bots
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

      {/* Calendly script (for the inline embed below) */}
      <Script
        id="calendly-widget"
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />

      {/* Header section with Contact Form + Quick CTAs */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* LEFT: Simple contact form */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2E3A59]">
                Send us a message
              </h1>
              <p className="mt-2 text-gray-700">
                Tell us a bit about your business and what you’re hoping to do. We’ll reply quickly with next steps.
              </p>

              {submitted ? (
                <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="font-medium text-green-800">Thanks — your message has been received.</p>
                  <p className="mt-1 text-green-800">
                    We’ll get back to you shortly. If it’s urgent, feel free to{" "}
                    <a
                      className="underline font-semibold"
                      href={`mailto:${email}?subject=Replying to my contact form submission`}
                    >
                      email us directly
                    </a>{" "}
                    or{" "}
                    <a className="underline font-semibold" href={calendlyUrl} target="_blank" rel="noopener noreferrer">
                      book a call
                    </a>.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                  {/* Honeypot (hidden) */}
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
                        Phone
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
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>
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
                      className="inline-flex items-center justify-center rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white px-5 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F59E0B]"
                    >
                      Or Book a 15-min Call
                    </a>
                  </div>
                </form>
              )}
            </div>

            {/* RIGHT: Quick context + CTAs (short, keeps your current value props) */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-[#2E3A59]">Who’s already looking</h2>
                <p className="mt-2 text-gray-700">
                  Our marketplace has buyers across many categories. Share your goals and we’ll match you
                  confidentially and guide flexible structures like{" "}
                  <span className="font-semibold">seller financing</span> or{" "}
                  <span className="font-semibold">rent-to-own</span>.
                </p>
                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  {[
                    "Home services",
                    "Trucking & logistics",
                    "E-commerce / DTC",
                    "Auto services",
                    "Light manufacturing",
                    "Restaurants / cafés",
                  ].map((t) => (
                    <span key={t} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-800">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-[#2E3A59]">Prefer to grab a time?</h3>
                <p className="mt-2 text-gray-700">
                  Pick a slot that works for you. You’ll get an automatic{" "}
                  <span className="font-medium">Zoom/Google Meet/Phone</span> invite based on your event settings.
                </p>
                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2 font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14B8A6]"
                >
                  Book on Calendly
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inline Calendly (kept, optional) */}
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

      {/* Global helpers */}
      <style jsx global>{`
        a, button { -webkit-tap-highlight-color: transparent; }
        :focus-visible { outline: none; }
      `}</style>
    </main>
  );
}
