// components/Footer.js
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 bg-[#555B60] text-white/90">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div>
            <div className="text-2xl font-semibold">
              Succession<span className="text-[#F59E0B]">Bridge</span>
            </div>
            <p className="mt-3 text-sm text-white/70">
              Helping owners exit and buyers take the baton.
            </p>
          </div>

          {/* Buy */}
          <div>
            <h3 className="text-white font-semibold mb-3">Buy</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/listings">
                  <a className="hover:underline">Browse Listings</a>
                </Link>
              </li>
              <li>
                <Link href="/guides/how-buyers-value">
                  <a className="hover:underline">How Buyers Value Businesses</a>
                </Link>
              </li>
              <li>
                <Link href="/guides/financing-options">
                  <a className="hover:underline">Financing Options</a>
                </Link>
              </li>
              <li>
                <Link href="/buyer-dashboard">
                  <a className="hover:underline">Buyer Dashboard</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h3 className="text-white font-semibold mb-3">Sell</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sellers">
                  <a className="hover:underline">List Your Business</a>
                </Link>
              </li>
              <li>
                <Link href="/business-valuation">
                  <a className="hover:underline">Value Your Business</a>
                </Link>
              </li>
              <li>
                <Link href="/scorecard">
                  <a className="hover:underline">Sellability Scorecard</a>
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-sell">
                  <a className="hover:underline">How to Sell Your Business</a>
                </Link>
              </li>
              <li>
                <Link href="/guides/prep-to-sell">
                  <a className="hover:underline">Get Ready to Sell</a>
                </Link>
              </li>
              <li>
                <Link href="/pricing">
                  <a className="hover:underline">Pricing</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h3 className="text-white font-semibold mb-3">Learn</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog">
                  <a className="hover:underline">Blog</a>
                </Link>
              </li>
              <li>
                <Link href="/guides/how-buyers-value">
                  <a className="hover:underline">Valuation Basics</a>
                </Link>
              </li>
              <li>
                <Link href="/guides/financing-options">
                  <a className="hover:underline">Deal Financing 101</a>
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-sell">
                  <a className="hover:underline">Selling Playbook</a>
                </Link>
              </li>
              <li>
                <Link href="/guides/prep-to-sell">
                  <a className="hover:underline">Prep Checklist</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about">
                  <a className="hover:underline">About Us</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="hover:underline">Contact Us</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="hover:underline">Terms of Use</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="hover:underline">Privacy Notice</a>
                </Link>
              </li>
              <li>
                <Link href="/sitemap">
                  <a className="hover:underline">Sitemap</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 h-px w-full bg-white/10" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/70">
          <p>© {new Date().getFullYear()} SuccessionBridge. All rights reserved.</p>
          <Link href="/privacy#ca-do-not-sell">
            <a className="hover:underline">CA: Do Not Sell My Personal Info</a>
          </Link>
        </div>
      </div>
    </footer>
  );
}

