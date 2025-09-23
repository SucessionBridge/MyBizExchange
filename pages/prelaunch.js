// pages/prelaunch.js
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import supabase from '../lib/supabaseClient';

const ROLES = ['buyer', 'seller', 'broker', 'investor'];

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

      // Role-specific enrichment
      if (role === 'buyer') {
        payload.budget_min = Number(form.budget_min) || null;
        payload.budget_max = Number(form.budget_max) || null;
      } else if (role === 'seller') {
        payload.industry = (form.industry || '').trim() || null;
        payload.financing_open = (form.financing_open || '').trim() || null;
      } else if (role === 'broker') {
        // Optional: you can later add broker-specific fields
      } else if (role === 'investor') {
        // Optional: add investor-specific fields later
      }

      // Ensure a ref code exists for this email (upsert by email)
      const myCode = genRefCode(payload.email);

      // Try upsert; requires a unique index on email if you want true upsert.
      const { data: upData, error: upErr } = await supabase
        .from('prelaunch_signups')
        .upsert([{ ...payload, ref_code: myCode, referred_by: referredBy || null }], { onConflict: 'email' })
        .select('*')
        .single();

      if (upErr) {
        // Fallback: if onConflict not available, try: find existing, then insert/update manually.
        // (You can remove this fallback once the unique index on email exists.)
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
    // Compute queue position within role = count of rows where created_at <= mine
    let pos = null;
    try {
      // If you don't have created_at, you can just show total count instead.
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
        <meta name="description" content="Get early access to MyBizExchange — where seller-financed deals get discovered." />
        <meta property="og:site_name" content="MyBizExchange" />
        <meta property="og:title" content="Join the Waitlist – MyBizExchange" />
      </Head>

      <div className="max-w-3xl mx-auto py-10 px-4">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-[#2E3A59]">Seller-Financed Deals, Discovered.</h1>
          <p className="mt-3 text-lg text-gray-700">
            Join the pre-launch list to get early access to{' '}
            <span className="font-semibold text-blue-700">MyBizExchange</span>.
          </p>
          <div className="mt-4">{RoleTabs}</div>
          {referredBy && (
            <p className="mt-2 text-xs text-gray-500">Referred by <span className="font-mono">{referredBy}</span></p>
          )}
        </div>

        {/* Form / Success */}
        {!done ? (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            {/* Common fields */}
            <div className="grid sm:grid-cols-2 gap-3">
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
            )}

            {role === 'broker' && (
              <div>
                <label className="block text-sm font-medium mb-1">How many listings do you handle per year? (optional)</label>
                <input
                  name="heard_from"
                  value={form.heard_from}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., 10–20; also tell us where you broker"
                />
              </div>
            )}

            {role === 'investor' && (
              <div>
                <label className="block text-sm font-medium mb-1">What types of deals are you looking for? (optional)</label>
                <input
                  name="heard_from"
                  value={form.heard_from}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., search fund, SBA lender, holdco, ticket size"
                />
              </div>
            )}

            {/* Privacy + Submit */}
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <span>By joining, you agree to receive occasional emails. We’ll never share your info. <Link href="/privacy"><a className="underline">Privacy</a></Link></span>
            </div>

            {error && <div className="text-sm text-rose-700">{error}</div>}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded disabled:opacity-60"
              >
                {submitting ? 'Joining…' : 'Join the Waitlist'}
              </button>
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
                <p className="text-xs text-gray-600 mt-1">Share it—each signup bumps you up the list.</p>
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

        {/* How it works / FAQ (light) */}
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold">How the waitlist works</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1.5">
              <li>We onboard in waves to balance sellers and buyers.</li>
              <li>Sellers open to financing and verified buyers get earlier access.</li>
              <li>Sharing your link moves you up the list.</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold">What you’ll get</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1.5">
              <li>Early access to seller-financed deals</li>
              <li>AI tools to value, structure, and message</li>
              <li>Intros to lenders familiar with SBA and holdbacks</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
