import { useEffect } from "react";
import { useRouter } from "next/router";
import supabase from "../lib/supabaseClient"; // ✅ correct

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
          router.push("/buyer-dashboard"); // ✅ FIXED REDIRECT PATH
        } else {
          router.push("/buyer-onboarding");
        }
      }
    };

    checkUserAndRedirect();
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937] px-4 py-12 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Hero Section */}
        <section className="text-center mb-20">
          <h1 className="text-5xl font-serif font-bold text-[#2E3A59] mb-4">
            Helping Business Owners Exit on Their Terms
          </h1>
          <p className="text-lg text-[#1F2937] max-w-2xl mx-auto">
            SuccessionBridge supports entrepreneurs planning for retirement or transition — by connecting them with qualified buyers who value their legacy.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 items-center justify-center">
            <Link href="/listings">
              <a className="bg-[#14B8A6] hover:bg-[#0D9488] text-white px-6 py-3 rounded-xl font-semibold text-lg inline-block">
                Browse Businesses
              </a>
            </Link>
            <Link href="/sellers">
              <a className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-6 py-3 rounded-xl font-semibold text-lg inline-block">
                List Your Business
              </a>
            </Link>
          </div>
        </section>

        {/* Valuation Tool Section */}
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

        {/* Sellability Scorecard Section */}
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

        {/* Buyers Section */}
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

        {/* How It Works Section */}
        <section className="bg-gray-50 rounded-xl p-10 border border-gray-200">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-[#2E3A59] mb-4">How SuccessionBridge Works</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              We connect business owners nearing retirement with serious buyers who are ready to take over. Our tools support seller-financed deals, help you value your business, and ensure a smooth handoff that honors your legacy.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
