// pages/prelaunch.js
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import supabase from '../lib/supabaseClient';

const ROLES = ['buyer', 'seller', 'broker', 'investor'];

const SUBHEAD_BY_ROLE = {
  buyer:
    "Be first to see new listings that match your budget and location. We’ll email you curated deals before the public feed.",
  seller:
    "List now (free during pre-launch) and get early visibility with qualified buyers. Add simple seller-financing terms to boost traction.",
  broker:
    "Bring your pipeline and get preferred placement when we open. Simple NDA/LOI workflow and buyer triage built-in.",
  investor:
    "Get early access to small-cap, cash-flowing deals and flexible structures. Indicate your ticket size and focus.",
};

const BENEFITS_BY_ROLE = {
  buyer: [
    'First peek at new listings (email alerts)',
    'Filters by budget, industry, and location',
    'Deal Maker to structure creative offers',
  ],
  seller: [
    'Free to list during pre-launch',
    'Featured to early buyer cohort',
    'Guidance to set seller-financing terms',
  ],
  broker: [
    'Preferred placement for verified brokers',
    'Centralized buyer messaging + NDA/LOI',
    'CSV export & pipeline reporting',
  ],
  investor: [
    'Qualified, off-market opportunities',
    'Flexible seller-financing friendly',
    'Option to indicate thesis & ticket size',
  ],
};

export default function Prelaunch() {
  const [role, setRole] = useState('buyer');
  const [form, setForm] = useState({
    name: '',
    email: '',
    location_city: '',
    location_state: '',
    // buyer
    budget_min: '',
    budget_max: '',
    // seller
    industry: '',
    financing_open: '',
    // common
    heard_from: '',
  });

  // Counters for social proof (optional; loads after mount)
  const [totalCount, setTotalCount] = useState(null);
  const [segmentCount, setSegmentCount] = useState(null);

  const [referredBy, setReferredBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Success state
  const [refCode, setRefCode] = useState('');
  const [position, setPosition] = useState(null); // number in segment queue
  const [copyOK, setCopyOK] = useState(false);

  // Grab ?ref=CODE if present
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const r = (p.get('ref') || '').trim();
      if (r) setReferredBy(r);
    } catch {}
  }, []);

  // Lightweight social proof counts
  useEffect(() => {
    (async () => {
      try {
        const total = await supabase
          .from('prelaunch_signups')
          .select('id', { count: 'exact', head: true });
        setTotalCount(typeof total.count === 'number' ? total.count : null);

        const seg = await supabase
          .from('prelaunch_signups')
          .select('id', { count: 'exact', head: true })
          .eq('role', role);
        setSegmentCount(typeof seg.count === 'number' ? seg.count : null);
      } catch {
        // ignore
      }
    })();
  }, [role]);

  const referralLink = useMemo(() => {
    if (!refCode) return '';
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin || 'https://mybizexchange.com';
    return `${origin}/prelaunch?ref=${encodeURIComponent(refCode)}`;
  }, [refCode]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
  }

  function genRefCode(email) {
    // Simple deterministic-ish code: 8 chars base36 from email + timestamp salt.
    const salt = (Date.now() % 1e7).toString(36);
    const base = (email || 'x').toLowerCase().replace(/[^a-z0-9]/g, '');
    return (base.slice(0, 3) + salt).toUpperCase().slice(0, 8);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: (form.name || '').trim(),
        email: (form.email || '').trim().toLowerCase(),
        role,
        location_city: (form.location_city || '').trim(),
        location_state: (form.location_state || '').trim(),
        heard_from: (form.heard_from || '').trim() || null,
      };

      if (!payload.name) return fail('Please enter your name.');
      if (!validEmail(payload.email)) return fail('Please enter a valid email.');

      if (role === 'buyer') {
        payload.budget_min = Number(form.budget_min) || null;
        payload.budget_max = Number(form.budget_max) || null;
      } else if (role === 'seller') {
        payload.industry = (form.industry || '').trim() || null;
        payload.financing_open = (form.financing_open || '').trim() || null;
      }

      const myCode = genRefCode(payload.email);

      const { data: upData, error: upErr } = await supabase
        .from('prelaunch_signups')
        .upsert([{ ...payload, ref_code: myCode, referred_by: referredBy || null }], { onConflict: 'email' })
        .select('*')
        .single();

      if (upErr) {
        // Fallback path if onConflict not set server-side
        const { data: existing } = await supabase
          .from('prelaunch_signups')
          .select('*')
          .eq('email', payload.email)
          .maybeSingle();

        let row = existing;
        if (existing) {
          const { data: upd, error: updErr } = await supabase
            .from('prelaunch_signups')
            .update({ ...payload, referred_by: existing.referred_by || referredBy || null })
            .eq('id', existing.id)
            .select('*')
            .single();
          if (updErr) return fail(updErr.message || 'Could not update your signup.');
          row = upd;
        } else {
          const { data: ins, error: insErr } = await supabase
            .from('prelaunch_signups')
            .insert([{ ...payload, ref_code: myCode, referred_by: referredBy || null }])
            .select('*')
            .single();
          if (insErr) return fail(insErr.message || 'Could not save your signup.');
          row = ins;
        }
        await finalizeSuccess(row);
        return;
      }

      await finalizeSuccess(upData);
    } catch (err) {
      console.error(err);
      return fail('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function finalizeSuccess(row) {
    // Compute queue position within role
    let pos = null;
    try {
      const createdAt = row?.created_at;
      if (createdAt) {
        const { count } = await supabase
          .from('prelaunch_signups')
          .select('id', { count: 'exact', head: true })
          .eq('role', row.role)
          .lte('created_at', createdAt);
        pos = typeof count === 'number' ? count : null;
      }
    } catch (e) {
      console.warn('Position calc failed:', e?.message);
    }

    setRefCode(row?.ref_code || genRefCode(row?.email));
    setPosition(pos);
    setDone(true);
  }

  function fail(msg) {
    setError(msg);
    setSubmitting(false);
    return false;
  }

  const RoleTabs = (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setRole(r)}
          className={`px-3 py-1.5 text-sm rounded-md capitalize ${
            role === r ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <Head>
        <title>Join the Waitlist – MyBizExchange</title>
        <meta name="description" content="Join the pre-launch of MyBizExchange — be first to see seller-financed deals or list your business for free during pre-launch." />
        <meta property="og:site_name" content="MyBizExchange" />
        <meta property="og:title" content="Join the Waitlist – MyBizExchange" />
      </Head>

      <div className="max-w-3xl mx-auto py-10 px-4">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-[#2E3A59]">Get First Pick of New Deals.</h1>
          <p className="mt-3 text-lg text-gray-800">
            Join the pre-launch for <span className="font-semibold">MyBizExchange</span> — where seller-financed deals get discovered.
          </p>
          <div className="mt-4">{RoleTabs}</div>
          <p className="mt-3 text-[15px] text-gray-700 max-w-2xl mx-auto">
            {SUBHEAD_BY_ROLE[role]}
          </p>

          {/* Social proof + urgency */}
          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-600">
            {typeof totalCount === 'number' && (
              <span className="rounded-full bg-gray-100 px-2 py-1">Total joined: {totalCount.toLocaleString()}</span>
            )}
            {typeof segmentCount === 'number' && (
              <span className="rounded-full bg-gray-100 px-2 py-1 capitalize">{role}s in line: {segmentCount.toLocaleString()}</span>
            )}
            <span className="rounded-full bg-amber-50 text-amber-800 px-2 py-1 border border-amber-200">
              Early cohort invites start soon
            </span>
          </div>
          {referredBy && (
            <p className="mt-2 text-xs text-gray-500">Referred by <span className="font-mono">{referredBy}</span></p>
          )}
        </div>

        {/* Form / Success */}
        {!done ? (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            {/* Role-specific “Why join now” bullets */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="border rounded-lg p-3">
                <div className="text-sm font-semibold mb-1">Why join now</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
                  {BENEFITS_BY_ROLE[role].map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-sm font-semibold mb-1">What happens next</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
                  <li>We’ll invite users in waves as we balance markets</li>
                  <li>You’ll get a welcome email with next steps</li>
                  <li>You can move up the list by sharing your link</li>
                </ul>
              </div>
            </div>

            {/* Common fields */}
            <div className="grid sm:grid-cols-2 gap-3 mt-1">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="you@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  name="location_city"
                  value={form.location_city}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Toronto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State/Province</label>
                <input
                  name="location_state"
                  value={form.location_state}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ontario"
                />
              </div>
            </div>

            {/* Role-specific fields */}
            {role === 'buyer' && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Budget (min)</label>
                  <input
                    name="budget_min"
                    type="number"
                    min="0"
                    value={form.budget_min}
                    onChange={onChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="100000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Budget (max)</label>
                  <input
                    name="budget_max"
                    type="number"
                    min="0"
                    value={form.budget_max}
                    onChange={onChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="750000"
                  />
                </div>
              </div>
            )}

            {role === 'seller' && (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Industry</label>
                    <input
                      name="industry"
                      value={form.industry}
                      onChange={onChange}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Home services"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Open to seller financing?</label>
                    <select
                      name="financing_open"
                      value={form.financing_open}
                      onChange={onChange}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="maybe">Maybe</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                {/* Inline “List now for free” prompt */}
                <div className="mt-1 text-[13px] text-gray-700 bg-emerald-50 border border-emerald-200 rounded p-3">
                  Want to jump the line? <Link href="/sellers"><a className="font-semibold text-emerald-800 underline">List your business now</a></Link> — it’s free during pre-launch and gets featured to early buyers.
                </div>
              </>
            )}

            {role === 'broker' && (
              <div>
                <label className="block text-sm font-medium mb-1">Anything we should know? (optional)</label>
                <input
                  name="heard_from"
                  value={form.heard_from}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., markets you cover, typical deal size"
                />
              </div>
            )}

            {role === 'investor' && (
              <div>
                <label className="block text-sm font-medium mb-1">Focus (optional)</label>
                <input
                  name="heard_from"
                  value={form.heard_from}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., search fund, holdco, $250k–$1M EBITDA"
                />
              </div>
            )}

            {/* Privacy + Submit */}
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <span>By joining, you agree to receive occasional emails. We’ll never share your info. <Link href="/privacy"><a className="underline">Privacy</a></Link></span>
            </div>

            {error && <div className="text-sm text-rose-700">{error}</div>}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded disabled:opacity-60"
              >
                {submitting ? 'Joining…' : 'Join the Waitlist'}
              </button>

              {/* Secondary CTAs by role */}
              {role === 'seller' && (
                <Link href="/sellers">
                  <a className="inline-block rounded border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                    List now — free in pre-launch
                  </a>
                </Link>
              )}
              {role === 'buyer' && (
                <Link href="/listings">
                  <a className="inline-block rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Browse listings
                  </a>
                </Link>
              )}
              <Link href="/"><a className="text-sm text-gray-600 hover:underline">Back to home</a></Link>
            </div>
          </form>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-emerald-700">You’re in! 🎉</h2>
            <p className="mt-2 text-gray-700">
              Thanks for joining as a <span className="font-semibold">{role}</span>.
              {typeof position === 'number' ? (
                <> You’re approximately <span className="font-semibold">#{position}</span> in the {role} queue.</>
              ) : null}
              {' '}We’ll email next steps and, for buyers, early matches as we bring sellers online.
            </p>

            {referralLink && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Your referral link</label>
                <div className="flex gap-2">
                  <input readOnly value={referralLink} className="flex-1 border rounded px-3 py-2 font-mono text-sm" />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(referralLink);
                        setCopyOK(true);
                        setTimeout(() => setCopyOK(false), 1600);
                      } catch {}
                    }}
                    className="border rounded px-3 py-2 hover:bg-gray-50"
                  >
                    {copyOK ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Share it — each signup bumps you up the list.</p>
              </div>
            )}

            <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
              <div className="border rounded p-3">
                <div className="font-semibold">Next</div>
                <p className="text-gray-700 mt-1">We’ll start inviting users in waves over the next few weeks.</p>
              </div>
              <div className="border rounded p-3">
                <div className="font-semibold">Faster access</div>
                <p className="text-gray-700 mt-1">Complete your profile when invited to get priority matching.</p>
              </div>
              <div className="border rounded p-3">
                <div className="font-semibold">Questions?</div>
                <p className="text-gray-700 mt-1">Reply to the welcome email or contact support@mybizexchange.com.</p>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/"><a className="text-blue-700 hover:underline">← Back to home</a></Link>
            </div>
          </div>
        )}

        {/* Lightweight FAQ */}
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold">Why sign up before we go live?</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1.5">
              <li>Early access to listings and features</li>
              <li>Better placement if you’re selling</li>
              <li>We balance markets by region & price band</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold">Will you spam me?</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1.5">
              <li>No — a welcome email and occasional updates</li>
              <li>Buyers: only relevant matches based on your inputs</li>
              <li>Unsubscribe anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}




