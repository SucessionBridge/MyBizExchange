// components/Footer.js
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 bg-[#555B60] text-white/90">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo / Social (optional now) */}
          <div>
            <div className="text-2xl font-semibold">Succession<span className="text-[#F59E0B]">Bridge</span></div>
            <p className="mt-3 text-sm text-white/70">
              Helping owners exit and buyers take the baton.
            </p>
          </div>

          {/* Search (placeholder for later) */}
          <div>
            <h3 className="text-white font-semibold mb-3">Search</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/listings"><a className="hover:underline">Established Businesses</a></Link></li>
              <li><Link href="/listings?type=franchise"><a className="hover:underline">Franchises for Sale</a></Link></li>
              <li><Link href="/listings?type=asset"><a className="hover:underline">Asset Sales</a></Link></li>
              <li><Link href="/listings?type=real-estate"><a className="hover:underline">Business Real Estate</a></Link></li>
              <li><Link href="/brokers"><a className="hover:underline">Find a Broker</a></Link></li>
            </ul>
          </div>

          {/* Resources (placeholder for later) */}
          <div>
            <h3 className="text-white font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/business-valuation"><a className="hover:underline">Value a Business</a></Link></li>
              <li><Link href="/learning-center"><a className="hover:underline">Learning Center</a></Link></li>
              <li><Link href="/blog"><a className="hover:underline">Blog</a></Link></li>
              <li><Link href="/insights"><a className="hover:underline">Insights</a></Link></li>
            </ul>
          </div>

          {/* Advertisers (placeholder for later) */}
          <div>
            <h3 className="text-white font-semibold mb-3">Advertisers</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sellers"><a className="hover:underline">Sell Your Business</a></Link></li>
              <li><Link href="/advertise"><a className="hover:underline">Advertise</a></Link></li>
              <li><Link href="/franchisors"><a className="hover:underline">Franchisors</a></Link></li>
            </ul>
          </div>

          {/* ✅ Company — the must-have column */}
          <div>
            <h3 className="text-white font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about"><a className="hover:underline">About Us</a></Link></li>
              <li><Link href="/contact"><a className="hover:underline">Contact Us</a></Link></li>
              <li><Link href="/terms"><a className="hover:underline">Terms of Use</a></Link></li>
              <li><Link href="/privacy"><a className="hover:underline">Privacy Notice</a></Link></li>
              <li><Link href="/sitemap"><a className="hover:underline">Sitemap</a></Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 h-px w-full bg-white/10" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/70">
          <p>© {new Date().getFullYear()} SuccessionBridge. All rights reserved.</p>
          <Link href="/privacy#ca-do-not-sell"><a className="hover:underline">CA: Do Not Sell My Personal Info</a></Link>
        </div>
      </div>
    </footer>
  );
}
