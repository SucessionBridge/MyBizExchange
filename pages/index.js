import { useEffect } from "react";
import { useRouter } from "next/router";
import supabase from "../lib/supabaseClient";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
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
          router.push("/buyer-dashboard");
        } else {
          router.push("/buyer-onboarding");
        }
      }
    };

    checkUserAndRedirect();
  }, []);

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
              Millions of boomer‑owned businesses are changing hands. Many will close without a buyer.
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

        <section className="bg-white rounded-xl p-10 mb-12 border border-gray-200 shadow-sm">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">Are You a Seller?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Maximize your legacy. Find a trusted buyer who’ll carry on what you’ve built — on your terms.
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

        <section className="bg-white rounded-xl p-10 mb-12 border border-gray-200">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">Are You a Buyer?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Discover stable businesses ready for transition. Get in with creative financing and zero bank stress.
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
