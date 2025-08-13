// pages/sitemap.js
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export async function getStaticProps() {
  let listings = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data } = await supabase
      .from('sellers')
      .select('id, business_name')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100); // keep the page light; adjust as you like
    listings = data || [];
  } catch {
    listings = [];
  }
  return { props: { listings }, revalidate: 3600 }; // update hourly
}

export default function HTMLSitemap({ listings }) {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Sitemap</h1>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border p-4">
            <h2 className="font-semibold mb-2">Top Pages</h2>
            <ul className="space-y-1 text-sm">
              <li><Link href="/"><a className="hover:underline">Home</a></Link></li>
              <li><Link href="/listings"><a className="hover:underline">Browse Listings</a></Link></li>
              <li><Link href="/sellers"><a className="hover:underline">List Your Business</a></Link></li>
              <li><Link href="/business-valuation"><a className="hover:underline">Value Your Business</a></Link></li>
              <li><Link href="/scorecard"><a className="hover:underline">Sellability Scorecard</a></Link></li>
              <li><Link href="/pricing"><a className="hover:underline">Pricing</a></Link></li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <h2 className="font-semibold mb-2">Guides</h2>
            <ul className="space-y-1 text-sm">
              <li><Link href="/guides/how-buyers-value"><a className="hover:underline">How Buyers Value Businesses</a></Link></li>
              <li><Link href="/guides/financing-options"><a className="hover:underline">Financing Options</a></Link></li>
              <li><Link href="/guides/how-to-sell"><a className="hover:underline">How to Sell Your Business</a></Link></li>
              <li><Link href="/guides/prep-to-sell"><a className="hover:underline">Get Your Business Ready to Sell</a></Link></li>
              <li><Link href="/blog"><a className="hover:underline">Blog</a></Link></li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <h2 className="font-semibold mb-2">Company</h2>
            <ul className="space-y-1 text-sm">
              <li><Link href="/about"><a className="hover:underline">About Us</a></Link></li>
              <li><Link href="/contact"><a className="hover:underline">Contact</a></Link></li>
              <li><Link href="/terms"><a className="hover:underline">Terms of Use</a></Link></li>
              <li><Link href="/privacy"><a className="hover:underline">Privacy Notice</a></Link></li>
            </ul>
          </div>
        </section>

        <section className="mt-8 bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-2">Recent Listings</h2>
          {listings.length === 0 ? (
            <div className="text-sm text-gray-600">No active listings yet.</div>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              {listings.map((l) => (
                <li key={l.id}>
                  <Link href={`/listings/${l.id}`}>
                    <a className="hover:underline">{l.business_name || `Listing #${l.id}`}</a>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 text-sm">
            <Link href="/listings"><a className="text-blue-700 hover:underline">See all listings →</a></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
