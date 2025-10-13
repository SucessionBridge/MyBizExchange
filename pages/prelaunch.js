// pages/prelaunch.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import supabase from '../lib/supabaseClient';

export default function Prelaunch() {
  const [form, setForm] = useState({
    role: 'broker', // broker | seller
    name: '',
    email: '',
    city: '',
    state: '',
    heard_from: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState({ ref: '', path: '' });

  useEffect(() => {
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
    if (!form.role) return 'Please choose Broker or Business Owner.';
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
        location_city: form.city?.trim() || null,
        location_state: form.state?.trim() || null,
        heard_from: form.heard_from?.trim() || null,
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
          content="Join the pre-launch for MyBizExchange: Brokers claim 10 free ads, Business Owners list for free."
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
        Claim Your Free Pre-Launch Benefits
      </h1>
      <p className="mt-4 text-lg text-gray-700">
        Brokers get <span className="font-semibold">10 free ads</span> to seed inventory. 
        Business owners can <span className="font-semibold">list free</span> during pre-launch. 
        Lock in your benefits below.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#signup"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                     text-white px-6 font-semibold transition"
        >
          Claim Free Ads / Listings
        </a>

        <a
          href="/refer"   // 👈 update this to /refer page or an external Google Form
          className="inline-flex h-12 items-center justify-center rounded-lg border border-emerald-600 
                     text-emerald-700 bg-white hover:bg-emerald-50
                     focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
                     px-6 font-semibold transition"
        >
          Refer a Business Owner
        </a>
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
                  No payment required. We’ll email your invite and keep you posted on launch.
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
                        <option value="broker">Broker</option>
                        <option value="seller">Business Owner</option>
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
                    <div>
                      <label htmlFor="heard_from" className="block text-sm font-medium text-gray-700">
                        How did you hear about us? (optional)
                      </label>
                      <input
                        id="heard_from"
                        type="text"
                        name="heard_from"
                        value={form.heard_from}
                        onChange={onChange}
                        placeholder="Friend, referral, ad..."
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-rose-700">{error}</p>}

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                                 text-white px-5 py-3 font-semibold disabled:opacity-60 transition"
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
                  We’ll email your invite and keep you posted as we roll out Founding Member benefits.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
