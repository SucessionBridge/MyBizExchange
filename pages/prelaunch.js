// pages/prelaunch.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import supabase from '../lib/supabaseClient';

export default function Prelaunch() {
  const [userEmail, setUserEmail] = useState('');
  const [form, setForm] = useState({
    role: 'buyer', // buyer | seller | broker
    name: '',
    email: '',
    city: '',
    state: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState({ ref: '', path: '' });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const e = data?.user?.email || '';
        setUserEmail(e);
        setForm((prev) => ({ ...prev, email: e || prev.email }));
      } catch {
        // ignore
      }
    })();
    if (typeof window !== 'undefined') {
      setSource({
        ref: document.referrer || '',
        path: window.location.href || '',
      });
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Please enter a valid email.';
    }
    if (!form.role) return 'Please choose Buyer, Seller, or Broker.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        email: form.email.trim(),
        role: form.role,
        name: form.name?.trim() || null,
        city: form.city?.trim() || null,
        state: form.state?.trim() || null,
        referrer_url: source.ref || null,
        landing_url: source.path || null,
      };

      const { error: insErr } = await supabase.from('prelaunch_signups').insert([payload]);
      if (insErr && insErr.code !== '23505') {
        console.error('prelaunch insert error:', insErr);
        setError(insErr.message || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      setDone(true);
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setError('Unexpected error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Pre-Launch | MyBizExchange</title>
        <meta
          name="description"
          content="Join the pre-launch for MyBizExchange to lock in founding-member benefits, free listing for DIY sellers, 10 free ads for brokers, and first-look access for buyers."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 pt-16 pb-10 sm:pt-24 sm:pb-14">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 text-xs font-semibold mx-auto">
                LIMITED-TIME FOUNDING OFFER
              </span>

              <h1 className="mt-4 text-4xl sm:text-5xl font-serif font-extrabold text-blue-900 leading-tight tracking-tight">
                Join the My&nbsp;Biz&nbsp;Exchange Pre-Launch
              </h1>

              <p className="mt-4 text-lg text-gray-700">
                We’re building a better marketplace for small business transfers—especially seller-financed deals. Become a{' '}
                <span className="font-semibold">Founding Member</span> and lock in early benefits below.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#signup"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                             text-white px-6 font-semibold transition"
                >
                  Reserve Your Spot
                </a>

                <Link href="/listings">
                  <a
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50
                               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                               px-6 font-semibold text-gray-800 transition"
                  >
                    Keep Browsing
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="max-w-6xl mx-auto px-4 pb-6">
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {/* BUYERS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full transition hover:shadow-md">
              <div className="text-sm inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-800 border border-blue-100 px-3 py-1 font-semibold">
                Buyers
              </div>
              <h3 className="mt-3 text-xl font-semibold text-gray-900">First Look Access</h3>
              <ul className="mt-3 space-y-2 text-gray-700 text-sm list-disc pl-5">
                <li>
                  Be the first to see <span className="font-medium">newly listed businesses</span>—fewer competing offers.
                </li>
                <li>
                  Early access to our <span className="font-medium">Deal Maker</span> for flexible, seller-financed proposals.
                </li>
                <li>Email alerts tailored to your profile when matches appear.</li>
              </ul>
              <p className="mt-3 text-[12px] text-gray-500">No payment required to join the waitlist.</p>
            </div>

            {/* DIY SELLERS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full transition hover:shadow-md">
              <div className="text-sm inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 font-semibold">
                DIY Sellers
              </div>
              <h3 className="mt-3 text-xl font-semibold text-gray-900">List Free During Pre-Launch</h3>
              <ul className="mt-3 space-y-2 text-gray-700 text-sm list-disc pl-5">
                <li>
                  <span className="font-medium">Create your listing for free</span> and “test the waters.”
                </li>
                <li>
                  Get <span className="font-medium">priority placement</span> as one of the first listings.
                </li>
                <li>Optional seller-financing fields help attract qualified buyers.</li>
              </ul>
              <p className="mt-3 text-[12px] text-gray-500">Founding members lock in free listing for the pre-launch window.</p>
            </div>

            {/* BROKERS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full transition hover:shadow-md">
              <div className="text-sm inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 font-semibold">
                Brokers
              </div>
              <h3 className="mt-3 text-xl font-semibold text-gray-900">10 Free Ad Credits</h3>
              <ul className="mt-3 space-y-2 text-gray-700 text-sm list-disc pl-5">
                <li>
                  Claim <span className="font-medium">10 free ads</span> to seed your inventory.
                </li>
                <li>“Founding Broker” badge on your profile at launch.</li>
                <li>Early access to tools that highlight seller-financed deals.</li>
              </ul>
              <p className="mt-3 text-[12px] text-gray-500">Credits apply to standard listing placements during pre-launch.</p>
            </div>
          </div>
        </section>

        {/* WHY NOW */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-semibold text-gray-900">Why reserve your spot now?</h2>
              <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 text-xs font-semibold">
                Limited seats for Founding Members
              </span>
            </div>
            <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="font-semibold text-gray-900 mb-1">Early Demand Advantage</div>
                Get seen sooner. Early listings receive concentrated attention while inventory is low.
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="font-semibold text-gray-900 mb-1">Better Seller-Financed Matches</div>
                We highlight flexible terms to connect serious buyers and motivated sellers.
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="font-semibold text-gray-900 mb-1">Founding-Member Perks</div>
                Free DIY listing during pre-launch, 10 broker ads, and first-look alerts for buyers.
              </div>
            </div>
          </div>
        </section>

        {/* SIGNUP FORM */}
        <section id="signup" className="scroll-mt-24 max-w-3xl mx-auto px-4 pb-16">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            {!done ? (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">Reserve Your Founding Spot</h2>
                <p className="mt-2 text-gray-700 text-sm">
                  No payment required. We’ll email your early-access invite and keep you posted on launch.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        I am a
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={form.role}
                        onChange={onChange}
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller (DIY)</option>
                        <option value="broker">Broker</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={onChange}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                      {userEmail && userEmail === form.email ? (
                        <p className="mt-1 text-[11px] text-green-700">Using your signed-in email</p>
                      ) : null}
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name (optional)
                      </label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        placeholder="Your name"
                        autoComplete="name"
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          City (optional)
                        </label>
                        <input
                          id="city"
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={onChange}
                          placeholder="City"
                          autoComplete="address-level2"
                          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                          State/Province (optional)
                        </label>
                        <input
                          id="state"
                          type="text"
                          name="state"
                          value={form.state}
                          onChange={onChange}
                          placeholder="State or Province"
                          autoComplete="address-level1"
                          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-sm text-rose-700">{error}</p>}

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                                 text-white px-6 font-semibold disabled:opacity-60 transition"
                    >
                      {submitting ? 'Reserving…' : 'Reserve My Spot'}
                    </button>
                    <p className="text-[12px] text-gray-500">
                      By reserving, you agree to receive pre-launch updates from MyBizExchange.
                    </p>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700 mb-3">
                  ✓
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">You’re on the list!</h3>
                <p className="mt-2 text-gray-700">
                  We’ll email your early-access invite as we roll out Founding Member benefits.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Link href="/listings">
                    <a className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50
                                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                                   px-6 font-semibold transition">
                      Browse Listings
                    </a>
                  </Link>
                  <Link href="/sellers">
                    <a className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700
                                   focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
                                   text-white px-6 font-semibold transition">
                      List Free Now
                    </a>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Small note about transparency—no counters shown */}
          <p className="mt-4 text-center text-[12px] text-gray-500">
            We’re not showing signup counts yet—we’ll share metrics once we have launch-ready numbers.
          </p>
        </section>

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <h2 className="text-2xl font-semibold text-gray-900">Pre-Launch FAQ</h2>
            </div>
            <div className="md:col-span-2 space-y-5">
              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <div className="font-semibold text-gray-900">Is this really free?</div>
                <p className="text-sm text-gray-700 mt-1">
                  Yes—joining the waitlist is free. DIY sellers get a free listing during pre-launch. Brokers receive 10 free
                  ad credits. Buyers get early alerts—no charge.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <div className="font-semibold text-gray-900">What happens after I reserve?</div>
                <p className="text-sm text-gray-700 mt-1">
                  You’ll receive a confirmation email. As we open early access, we’ll invite Founding Members in waves. If
                  you’re ready now, you can still complete onboarding today—your benefits will carry over.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <div className="font-semibold text-gray-900">Can I use the platform before launch?</div>
                <p className="text-sm text-gray-700 mt-1">
                  Yes. You can create a buyer profile, list a business, or set up a broker account now. During pre-launch, we
                  focus attention on new listings to help early users get traction.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
