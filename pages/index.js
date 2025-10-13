import { useEffect, useState, useRef, useCallback } from "react"; 
import Head from "next/head";
import { useRouter } from "next/router";
import supabase from "../lib/supabaseClient";
import Link from "next/link";
import Script from "next/script";
import WhyWeBuilt from "../components/WhyWeBuilt";

/** ─────────────────────────────────────────────────────────────
 *  Attention Banner (glass style + mobile sticky)
 *  - Copy (Option B): mission-driven, clear about helping to SELL
 *  - CTA opens Calendly popup
 *  - Dismiss = temporary hide (7 days) + Undo toast
 *  - Permanent hide after Calendly booking (postMessage event)
 *  - Desktop: glass card sticky under header
 *  - Mobile: sticky bar at bottom
 *  ──────────────────────────────────────────────────────────── */
function AttentionBanner({
  calendlyUrl = "https://calendly.com/YOUR_CALENDLY_LINK?hide_event_type_details=1&hide_gdpr_banner=1",
}) {
  // Shared keys across desktop + mobile
  const LS_KEY = "mbx_banner_state_v2"; // {mode:'visible'|'minimized'|'permanent', hideUntil:number}
  const BOOKED_KEY = "mbx_banner_booked"; // '1' when Calendly booked

  const GOLD = "#F59E0B";
  const TEXT = "#2E3A59";
  const TEMP_HIDE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  const [mode, setMode] = useState("visible"); // visible | minimized | permanent
  const [toast, setToast] = useState(null); // {msg, canUndo}
  const toastTimerRef = useRef(null);

  // Load state on mount
  useEffect(() => {
    try {
      if (localStorage.getItem(BOOKED_KEY) === "1") {
        setMode("permanent");
        return;
      }
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.mode === "permanent") {
        setMode("permanent");
      } else if (saved?.mode === "minimized" && saved?.hideUntil && saved.hideUntil > Date.now()) {
        setMode("minimized");
      }
    } catch {}
  }, []);

  // Persist
  const persist = useCallback((next) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  }, []);

  // Open Calendly
  const openCalendly = useCallback(() => {
    if (typeof window === "undefined") return;
    window.gtag?.("event", "banner_click", { component: "attention_banner" });
    if (window.Calendly) window.Calendly.initPopupWidget({ url: calendlyUrl });
    else window.open(calendlyUrl, "_blank");
  }, [calendlyUrl]);

  // Dismiss → minimize for 7 days + toast with Undo
  const dismiss = useCallback(() => {
    const next = { mode: "minimized", hideUntil: Date.now() + TEMP_HIDE_MS };
    setMode("minimized");
    persist(next);
    setToast({ msg: "Banner hidden", canUndo: true });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, [persist]);

  // Undo hide → back to visible
  const undo = useCallback(() => {
    setMode("visible");
    persist({ mode: "visible" });
    setToast({ msg: "Banner restored", canUndo: false });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 1800);
  }, [persist]);

  // "Don't show again" → permanent
  const dontShowAgain = useCallback(() => {
    setMode("permanent");
    persist({ mode: "permanent" });
    setToast(null);
  }, [persist]);

  // Reopen from pill (desktop only)
  const reopen = useCallback(() => {
    setMode("visible");
    persist({ mode: "visible" });
  }, [persist]);

  // Listen for Calendly booking success → permanent hide
  useEffect(() => {
    function onMessage(e) {
      if (!e?.data?.event) return;
      if (e.data.event === "calendly.event_scheduled") {
        try {
          localStorage.setItem(BOOKED_KEY, "1");
          setMode("permanent");
          persist({ mode: "permanent" });
        } catch {}
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [persist]);

  if (mode === "permanent") return null;

  return (
    <>
      {/* Desktop / Tablet GLASS banner (md+) */}
      {mode === "visible" && (
        <div className="hidden md:block sticky top-0 z-[1000] px-3 md:px-4 py-3">
          <div
            className="max-w-7xl mx-auto flex items-start md:items-center gap-3 md:gap-4 rounded-xl border shadow-md"
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(6px)",
              borderColor: "rgba(255,255,255,0.4)"
            }}
            role="region"
            aria-label="Help selling instead of closing"
          >
            <div className="flex-1 min-w-0 px-3 py-2">
              <p className="text-base md:text-lg font-semibold" style={{ color: TEXT }}>
                Don’t close your doors just yet — your business might be exactly what another owner needs.
              </p>
              <p className="text-sm md:text-base mt-0.5" style={{ color: TEXT, opacity: 0.9 }}>
                We believe small businesses power our economy. Let’s help you find a buyer who will keep yours thriving.
              </p>
            </div>

            <div className="flex items-center gap-2 pr-3 pb-2 md:pb-0">
              <button
                onClick={openCalendly}
                className="rounded-full px-4 py-2 text-sm md:text-[15px] font-semibold shadow hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: GOLD, color: "#000" }}
                aria-label="Book a 10-minute call"
              >
                Let’s Talk — 10-Minute Call
              </button>
              <button
                onClick={dismiss}
                className="h-9 w-9 grid place-items-center rounded-md hover:bg-black/5"
                aria-label="Hide banner for 7 days"
                title="Hide for now"
                style={{ color: TEXT }}
              >
                ✕
              </button>
              <button
                onClick={dontShowAgain}
                className="hidden lg:inline-flex text-xs underline underline-offset-2"
                aria-label="Don't show again"
                title="Don’t show again"
                style={{ color: TEXT, opacity: 0.7 }}
              >
                Don’t show again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky bar (<md) */}
      {mode === "visible" && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-[1000] px-3 pb-3">
          <div
            className="rounded-2xl border shadow-lg overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(6px)",
              borderColor: "rgba(0,0,0,0.06)"
            }}
          >
            <div className="px-3 pt-2" style={{ color: TEXT }}>
              <p className="text-[15px] font-semibold leading-snug">
                Don’t close your doors just yet — your business might be exactly what another owner needs.
              </p>
              <p className="text-[12px] opacity-90 -mt-0.5">
                We believe small businesses power our economy. Let’s help you find a buyer who will keep yours thriving.
              </p>
            </div>
            <div className="flex">
              <button
                onClick={openCalendly}
                className="flex-1 py-2.5 text-sm font-semibold"
                style={{ backgroundColor: GOLD, color: "#000" }}
                aria-label="Book a 10-minute call"
              >
                Book 10-min Call
              </button>
              <button
                onClick={dismiss}
                className="w-12 grid place-items-center text-lg"
                style={{ color: TEXT }}
                aria-label="Hide banner for 7 days"
                title="Hide for now"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen pill (desktop only, when minimized) */}
      {mode === "minimized" && (
        <div className="fixed left-3 bottom-3 z-[1000] hidden md:block">
          <button
            onClick={reopen}
            className="rounded-full px-3 py-2 text-sm font-semibold shadow-lg hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Reopen banner"
            style={{ backgroundColor: "#14B8A6", color: "white" }}
          >
            We can help — click to reopen
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-4 flex justify-center z-[1100] px-4">
          <div className="rounded-lg bg-gray-900 text-white px-3 py-2 text-sm shadow-lg flex items-center gap-3">
            <span>{toast.msg}</span>
            {toast.canUndo && (
              <button
                onClick={undo}
                className="rounded bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/15"
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const router = useRouter();
  const [featuredListings, setFeaturedListings] = useState([]);

  // Prevent duplicate redirects
  const hasRedirectedRef = useRef(false);

  // Mobile carousel
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);

  const formatCurrency = useCallback((n) => {
    if (n == null || n === "") return "Inquire";
    const num = Number(n);
    if (Number.isNaN(num)) return "Inquire";
    return num.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }, []);

  const scrollByCard = (dir) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    const gap = 16; // matches gap-4
    const amount = card ? card.clientWidth + gap : 340;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const onCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    const gap = 16;
    const amount = card ? card.clientWidth + gap : 340;
    const maxIndex = Math.max(0, (featuredListings?.length || 1) - 1);
    const idx = Math.round(el.scrollLeft / amount);
    setActiveSlide(Math.min(Math.max(0, idx), maxIndex));
  };

  useEffect(() => {
    const skipRedirect = router.query.force === "true";

    const redirectAccordingToProfile = async (user) => {
      if (!user || skipRedirect || hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;

      const { data: buyerProfile, error } = await supabase
        .from("buyers")
        .select("email")
        .eq("email", user.email)
        .maybeSingle();

      if (error) {
        console.warn("Buyer lookup error:", error.message);
        return;
      }

      if (buyerProfile) {
        router.replace("/buyer-dashboard");
      } else {
        router.replace("/buyer-onboarding");
      }
    };

    // Initial check on mount/refresh
    const checkUserAndRedirect = async () => {
      if (skipRedirect) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await redirectAccordingToProfile(user);
    };
    checkUserAndRedirect();

    // Also handle post-login (magic link) transitions
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) redirectAccordingToProfile(session.user);
    });

    // Fetch featured listings
    const fetchFeaturedListings = async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select("id, business_name, location, asking_price, ad_id, image_urls")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8);

      if (!error && data) {
        setFeaturedListings(data);
      } else {
        console.warn("⚠️ Failed to fetch featured listings:", error?.message);
      }
    };
    fetchFeaturedListings();

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, [router.query.force]); // narrow dependency to the flag we actually use

  const placeholder = "/images/placeholders/listing-placeholder.jpg";
  const pageTitle = "MyBizExchange — Buy or Sell a Small Business with Flexible Financing";
  const pageDescription =
    "Connect retiring owners with serious buyers. AI-enhanced listings, free valuations, and flexible financing to protect your legacy or launch your next acquisition.";

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937] font-sans">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://successionbridge-mvp3-0-clean.vercel.app/" />
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://successionbridge-mvp3-0-clean.vercel.app/" />
        <meta property="og:image" content="/images/og-hero.jpg" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="/images/og-hero.jpg" />
        {/* Basic JSON-LD (Organization + Website) */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MyBizExchange",
              url: "https://successionbridge-mvp3-0-clean.vercel.app/",
              logo: "https://successionbridge-mvp3-0-clean.vercel.app/images/og-hero.jpg",
              sameAs: [],
            }),
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MyBizExchange",
              url: "https://successionbridge-mvp3-0-clean.vercel.app/",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://successionbridge-mvp3-0-clean.vercel.app/listings?query={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </Head>

      {/* Calendly widget script (once, page-level) */}
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" />

      {/* ── New attention banner (glass desktop + mobile sticky) ── */}
      <AttentionBanner calendlyUrl="https://calendly.com/YOUR_CALENDLY_LINK?hide_event_type_details=1&hide_gdpr_banner=1" />

      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <section
          className="relative w-full bg-cover bg-center text-center mb-20 py-24"
          style={{ backgroundImage: "url('/images/hero-city.jpg')" }}
          aria-label="Hero"
        >
          <div className="bg-white/60 p-6 rounded-xl inline-block max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#2E3A59] leading-tight">
              Millions of boomer-owned businesses are changing hands. Many will close without a buyer.
            </h1>
            <p className="mt-4 text-xl font-semibold text-[#2E3A59] max-w-2xl mx-auto">
              MyBizExchange helps retiring owners sell with flexible financing options that secure your exit and protect your legacy.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 items-center justify-center">
              <Link href="/listings">
                <a className="bg-[#14B8A6] hover:bg-[#0D9488] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14B8A6] text-white px-6 py-3 rounded-xl font-semibold text-lg inline-block" aria-label="Browse available businesses for sale">
                  Find a Business
                </a>
              </Link>
              <Link href="/sellers">
                <a className="bg-[#F59E0B] hover:bg-[#D97706] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F59E0B] text-white px-6 py-3 rounded-xl font-semibold text-lg inline-block" aria-label="List your business for sale">
                  Sell My Business
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* Why We Built */}
        <WhyWeBuilt variant="owner" />

        {/* Featured Listings */}
        <section className="bg-white rounded-xl p-6 sm:p-8 mb-16 border border-gray-200 shadow-sm" aria-labelledby="featured-title">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 id="featured-title" className="text-2xl sm:text-3xl font-semibold text-[#2E3A59]">Featured Listings</h2>
            <Link href="/listings">
              <a className="text-[#14B8A6] hover:underline font-semibold text-sm sm:text-base" aria-label="See all listings">See all →</a>
            </Link>
          </div>

          {featuredListings.length === 0 ? (
            <p className="text-center text-gray-600" aria-live="polite">No listings available at the moment.</p>
          ) : (
            <>
              {/* Mobile carousel */}
              <div className="md:hidden" aria-roledescription="carousel">
                <div className="relative -mx-4 px-4">
                  {/* edge fades */}
                  <div className="pointer-events-none absolute left-0 top-0 h-full w-6 z-0 bg-gradient-to-r from-white to-transparent" />
                  <div className="pointer-events-none absolute right-0 top-0 h-full w-6 z-0 bg-gradient-to-l from-white to-transparent" />

                  <button
                    type="button"
                    onClick={() => scrollByCard(-1)}
                    aria-label="Previous listing"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-gray-200 shadow p-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByCard(1)}
                    aria-label="Next listing"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-gray-200 shadow p-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                  >
                    ›
                  </button>

                  <div
                    ref={carouselRef}
                    onScroll={onCarouselScroll}
                    className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-2 pb-3 no-scrollbar relative z-10"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft") scrollByCard(-1);
                      if (e.key === "ArrowRight") scrollByCard(1);
                    }}
                    aria-label="Featured listings"
                  >
                    {featuredListings.map((listing) => {
                      const cover =
                        Array.isArray(listing.image_urls) && listing.image_urls.length > 0
                          ? listing.image_urls[0]
                          : placeholder;

                      return (
                        <div
                          key={listing.id}
                          data-card
                          className="snap-center shrink-0 w-[80vw] max-w-[420px] p-1 rounded-2xl bg-gray-300/40 md:p-0 md:bg-transparent"
                          role="group"
                          aria-roledescription="slide"
                          aria-label={`${listing.business_name || "Business"}${listing.ad_id ? `, Ad #${listing.ad_id}` : ""}`}
                        >
                          <Link href={`/listings/${listing.id}`}>
                            <a className="block rounded-xl overflow-hidden bg-white border border-gray-400 shadow-md md:border md:border-gray-200 md:shadow-none hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
                              <div className="bg-gray-50 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={cover}
                                  alt={listing.business_name || "Business listing"}
                                  className="block w-full h-auto aspect-[4/3] object-cover object-center"
                                  loading="lazy"
                                  onError={(e) => {
                                    const img = e.currentTarget;
                                    if (img.src !== window.location.origin + placeholder) img.src = placeholder;
                                  }}
                                />
                              </div>

                              <div className="p-4">
                                <h3 className="text-[17px] font-semibold text-blue-700 leading-snug line-clamp-2">
                                  {listing.business_name || "Unnamed Business"}
                                </h3>
                                <div className="mt-2 flex items-center justify-between">
                                  <p className="text-[15px] font-semibold text-gray-900">
                                    {formatCurrency(listing.asking_price)}
                                  </p>
                                  <p className="text-[14px] text-gray-600 truncate max-w-[55%] text-right">
                                    {listing.location || "Location undisclosed"}
                                  </p>
                                </div>
                                {listing.ad_id ? (
                                  <div className="mt-2">
                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                      Ad #{listing.ad_id}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </a>
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden="true">
                    {featuredListings.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${i === activeSlide ? "w-4 bg-gray-800" : "w-2 bg-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop grid */}
              <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-5">
                {featuredListings.map((listing) => {
                  const cover =
                    Array.isArray(listing.image_urls) && listing.image_urls.length > 0
                      ? listing.image_urls[0]
                      : placeholder;

                  return (
                    <Link key={listing.id} href={`/listings/${listing.id}`}>
                      <a className="group block rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm transform transition duration-200 md:hover:-translate-y-0.5 md:hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
                        <div className="bg-gray-100 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cover}
                            alt={listing.business_name || "Business listing"}
                            className="w-full h-auto aspect-[4/3] object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (img.src !== window.location.origin + placeholder) img.src = placeholder;
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="text-[15px] font-semibold text-blue-700 line-clamp-2 min-h-[40px]">
                            {listing.business_name || "Unnamed Business"}
                          </h3>
                          <div className="mt-1.5 flex items-center justify-between">
                            <p className="text-[14px] font-semibold text-gray-900">
                              {formatCurrency(listing.asking_price)}
                            </p>
                            <p className="text-[13px] text-gray-600 truncate max-w-[60%] text-right">
                              {listing.location || "Location undisclosed"}
                            </p>
                          </div>
                          {listing.ad_id ? (
                            <div className="mt-1.5">
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                                Ad #{listing.ad_id}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </a>
                    </Link>
                  );
                })}
              </div>

              {/* View all featured */}
              <div className="mt-6 text-center">
                <Link href="/listings">
                  <a className="inline-block rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400">
                    View all featured
                  </a>
                </Link>
              </div>
            </>
          )}
        </section>

        {/* How It Works */}
        <section className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-xl p-10 mb-16 shadow-md">
          <div>
            <img src="/images/handshake.jpg" alt="Handshake" className="rounded-lg shadow-sm" loading="lazy" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">How MyBizExchange Works</h2>
            <p className="text-lg text-gray-700 mb-6">
              We make selling simple. From valuation to flexible financing, we connect business owners nearing retirement with serious buyers ready to carry on your legacy.
            </p>
            <ul className="space-y-3 text-lg">
              <li><span className="font-bold text-[#F59E0B]">1️⃣</span> Get a Free Business Valuation</li>
              <li><span className="font-bold text-[#F59E0B]">2️⃣</span> List Your Business Easily</li>
              <li><span className="font-bold text-[#F59E0B]">3️⃣</span> Connect with Qualified Buyers &amp; Secure Flexible Deals</li>
            </ul>
          </div>
        </section>

        {/* Valuation CTA */}
        <section className="bg-white rounded-xl p-10 mb-12 shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">What is Your Business Worth?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Use our AI-powered tool to get a free valuation instantly. Know your numbers before you negotiate.
            </p>
            <Link href="/business-valuation">
              <a className="bg-[#14B8A6] hover:bg-[#0D9488] text-white py-3 px-6 rounded-lg text-lg font-semibold inline-block focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14B8A6]">
                See How Much Your Business Is Worth
              </a>
            </Link>
          </div>
        </section>

        {/* Sellers */}
        <section className="bg-white rounded-xl p-10 mb-12 border border-gray-200 shadow-sm">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">Are You a Seller?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Maximize your legacy and attract the right buyer with the power of our{" "}
              <span className="font-semibold text-blue-600">AI Business Broker</span>. Get AI-enhanced listings, accurate valuations,
              and intelligent buyer matching — all without paying high broker fees.
            </p>
            <Link href="/sellers">
              <a className="bg-[#F59E0B] hover:bg-[#D97706] text-white py-3 px-6 rounded-lg text-lg font-semibold inline-block focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F59E0B]">
                List Your Business
              </a>
            </Link>
          </div>
        </section>

        {/* Scorecard */}
        <section className="bg-[#E0F2FE] rounded-xl p-10 mb-12 border border-blue-100">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">Not sure if your business is ready to sell?</h2>
            <Link href="/scorecard">
              <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600">
                👉 Take the Sellability Scorecard
              </a>
            </Link>
          </div>
        </section>

        {/* Buyers */}
        <section className="bg-white rounded-xl p-10 mb-12 border border-gray-200">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">Are You a Buyer?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Unlock <span className="font-semibold text-blue-600">AI-powered tools</span> to find the perfect business.
              Use our <strong>Deal Maker</strong> to structure creative offers and get <strong>AI-matched</strong> with opportunities tailored to you.
            </p>
            <Link href="/listings">
              <a className="bg-[#14B8A6] hover:bg-[#0D9488] text-white py-3 px-6 rounded-lg text-lg font-semibold inline-block focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14B8A6]">
                Browse Businesses
              </a>
            </Link>
          </div>
        </section>
      </div>

      {/* Global CSS (hide mobile scrollbar) */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        a, button { -webkit-tap-highlight-color: transparent; }
        /* Visible focus for accessibility */
        :focus-visible { outline: none; }
      `}</style>
    </main>
  );
}
