import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import supabase from "../lib/supabaseClient";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [featuredListings, setFeaturedListings] = useState([]);
  const carouselRef = useRef(null);

  const scrollByCard = (dir) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    const amount = card ? card.clientWidth + 16 : 320; // card width + gap
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (router.query.force === 'true') {
        console.log("✅ Force=true detected on index.js. Skipping redirect.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: buyerProfile } = await supabase
          .from("buyers")
          .select("email")
          .eq("email", user.email)
          .maybeSingle();

        if (buyerProfile) {
          console.log("✅ Buyer profile found. Redirecting to dashboard.");
          router.push("/buyer-dashboard");
        } else {
          console.log("🆕 No buyer profile. Redirecting to onboarding.");
          router.push("/buyer-onboarding");
        }
      }
    };

    checkUserAndRedirect();

    // Fetch featured listings (includes photos)
    const fetchFeaturedListings = async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('id, business_name, location, asking_price, ad_id, image_urls')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        setFeaturedListings(data);
      } else {
        console.warn("⚠️ Failed to fetch featured listings:", error?.message);
      }
    };

    fetchFeaturedListings();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937] font-sans">
      <div className="max-w-6xl mx-auto">

        {/* ✅ Hero Section */}
        <section
          className="relative w-full bg-cover bg-center text-center mb-20 py-24"
          style={{ backgroundImage: "url('/images/hero-city.jpg')" }}
        >
          <div className="bg-white/60 p-6 rounded-xl inline-block max-w-3xl mx-auto">
            <h1 
              className="text-4xl sm:text-5xl font-serif font-bold text-[#2E3A59] leading-tight"
            >
              Millions of boomer-owned businesses are changing hands. Many will close without a buyer.
            </h1>
            <p 
              className="mt-4 text-xl font-semibold text-[#2E3A59] max-w-2xl mx-auto"
            >
              SuccessionBridge helps retiring owners sell with flexible financing options that secure your exit and protect your legacy.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 items-center justify-center">
              <Link href="/listings">
                <a className="bg-[#14B8A6] hover:bg-[#0D9488] text-white px-6 py-3 rounded-xl font-semibold text-lg inline-block">
                  Find a Business
                </a>
              </Link>
              <Link href="/sellers">
                <a className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-6 py-3 rounded-xl font-semibold text-lg inline-block">
                  Sell My Business
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* ✅ Why We Built SuccessionBridge Section */}
        <section className="bg-gray-50 py-16 px-6 md:px-12 mb-16 rounded-xl shadow-sm">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Why We Built SuccessionBridge</h2>
            <div className="text-lg text-gray-700 leading-relaxed space-y-4">
              <p>After 8 years of running a profitable business, my partner and I decided to sell.</p>
              <p>We were generating around <strong>$200K/year in revenue</strong> with approximately <strong>$150K/year in SDE</strong>, but when we called a business broker, we were told:</p>
              <blockquote className="italic text-gray-600 border-l-4 border-blue-500 pl-4">
                “Unless your asking price is $1M or more, no broker will give you the time.”
              </blockquote>
              <p>One year later, we sold the business for <strong>over $4M — without a broker.</strong></p>
              <p><strong>The key?</strong><br />We got the listing in front of the right buyers and let the market create the value.</p>
              <p className="font-semibold">That experience taught us a simple truth:<br />More eyes = more chances to sell.</p>
              <p>SuccessionBridge was built to give business owners that same advantage — connecting sellers and buyers directly without relying on expensive brokers.</p>
            </div>
          </div>
        </section>

        {/* ⭐️ Featured Listings (moved here; mobile carousel + desktop grid) */}
        <section className="bg-white rounded-xl p-8 mb-16 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-semibold text-[#2E3A59]">Featured Listings</h2>
            <Link href="/listings">
              <a className="text-[#14B8A6] hover:underline font-semibold">See all listings →</a>
            </Link>
          </div>

          {featuredListings.length === 0 ? (
            <p className="text-center text-gray-600">No listings available at the moment.</p>
          ) : (
            <>
              {/* Mobile carousel */}
              <div className="md:hidden">
                <div className="relative">
                  {/* nav buttons */}
                  <button
                    type="button"
                    onClick={() => scrollByCard(-1)}
                    aria-label="Previous"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-gray-200 shadow p-2"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByCard(1)}
                    aria-label="Next"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-gray-200 shadow p-2"
                  >
                    ›
                  </button>

                  <div
                    ref={carouselRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
                  >
                    {featuredListings.map((listing) => {
                      const cover = Array.isArray(listing.image_urls) && listing.image_urls.length > 0
                        ? listing.image_urls[0]
                        : "/images/placeholders/listing-placeholder.jpg"; // add this file to /public/images/placeholders/

                      return (
                        <Link key={listing.id} href={`/listings/${listing.id}`}>
                          <a
                            data-card
                            className="snap-start shrink-0 w-[85%] sm:w-[70%] rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-lg transition-shadow"
                          >
                            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cover}
                                alt={listing.business_name || "Business listing"}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <h3 className="text-base font-semibold text-[#2E3A59] line-clamp-1">
                                  {listing.business_name || "Unnamed Business"}
                                </h3>
                                {listing.ad_id ? (
                                  <span className="ml-3 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                                    Ad #{listing.ad_id}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                                {listing.location || "Location undisclosed"}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-green-700">
                                {listing.asking_price
                                  ? `Asking: $${Number(listing.asking_price).toLocaleString()}`
                                  : "Inquire for price"}
                              </p>
                            </div>
                          </a>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Desktop grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredListings.map((listing) => {
                  const cover = Array.isArray(listing.image_urls) && listing.image_urls.length > 0
                    ? listing.image_urls[0]
                    : "/images/placeholders/listing-placeholder.jpg";

                  return (
                    <Link key={listing.id} href={`/listings/${listing.id}`}>
                      <a className="group block rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-lg transition-shadow">
                        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cover}
                            alt={listing.business_name || "Business listing"}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold text-[#2E3A59] line-clamp-1">
                              {listing.business_name || "Unnamed Business"}
                            </h3>
                            {listing.ad_id ? (
                              <span className="ml-3 shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                Ad #{listing.ad_id}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                            {listing.location || "Location undisclosed"}
                          </p>
                          <p className="mt-2 text-base font-semibold text-green-700">
                            {listing.asking_price
                              ? `Asking: $${Number(listing.asking_price).toLocaleString()}`
                              : "Inquire for price"}
                          </p>
                        </div>
                      </a>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* ✅ How It Works Section */}
        <section className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-xl p-10 mb-16 shadow-md">
          <div>
            <img
              src="/images/handshake.jpg"
              alt="Handshake"
              className="rounded-lg shadow-sm"
            />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">How SuccessionBridge Works</h2>
            <p className="text-lg text-gray-700 mb-6">
              We make selling simple. From valuation to flexible financing, we connect business owners nearing retirement with serious buyers ready to carry on your legacy.
            </p>
            <ul className="space-y-3 text-lg">
              <li><span className="font-bold text-[#F59E0B]">1️⃣</span> Get a Free Business Valuation</li>
              <li><span className="font-bold text-[#F59E0B]">2️⃣</span> List Your Business Easily</li>
              <li><span className="font-bold text-[#F59E0B]">3️⃣</span> Connect with Qualified Buyers & Secure Flexible Deals</li>
            </ul>
          </div>
        </section>

        {/* ✅ Existing Sections */}
        <section className="bg-white rounded-xl p-10 mb-12 shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">What is Your Business Worth?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Use our AI-powered tool to get a free valuation instantly. Know your numbers before you negotiate.
            </p>
            <Link href="/business-valuation">
              <a className="bg-[#14B8A6] hover:bg-[#0D9488] text-white py-3 px-6 rounded-lg text-lg font-semibold inline-block">
                See How Much Your Business Is Worth
              </a>
            </Link>
          </div>
        </section>

        {/* Sellers Section */}
        <section className="bg-white rounded-xl p-10 mb-12 border border-gray-200 shadow-sm">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">
              Are You a Seller?
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Maximize your legacy and attract the right buyer with the power of our 
              <span className="font-semibold text-blue-600"> AI Business Broker</span>. 
              Get AI-enhanced listings, accurate valuations, and intelligent buyer matching — all without paying high broker fees.
            </p>
            <Link href="/sellers">
              <a className="bg-[#F59E0B] hover:bg-[#D97706] text-white py-3 px-6 rounded-lg text-lg font-semibold inline-block">
                List Your Business
              </a>
            </Link>
          </div>
        </section>

        <section className="bg-[#E0F2FE] rounded-xl p-10 mb-12 border border-blue-100">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">
              Not sure if your business is ready to sell?
            </h2>
            <Link href="/scorecard">
              <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md">
                👉 Take the Sellability Scorecard
              </a>
            </Link>
          </div>
        </section>

        {/* Buyer Section */}
        <section className="bg-white rounded-xl p-10 mb-12 border border-gray-200">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">Are You a Buyer?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Unlock <span className="font-semibold text-blue-600">AI-powered tools</span> to find the perfect business. 
              Use our <strong>Deal Maker</strong> to structure creative offers and get <strong>AI-matched</strong> with opportunities tailored to you.
            </p>
            <Link href="/listings">
              <a className="bg-[#14B8A6] hover:bg-[#0D9488] text-white py-3 px-6 rounded-lg text-lg font-semibold inline-block">
                Browse Businesses
              </a>
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
