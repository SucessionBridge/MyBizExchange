// pages/refer.js
import { useState } from 'react';
import Head from 'next/head';
import supabase from '../lib/supabaseClient';

export default function Refer() {
  const [form, setForm] = useState({
    referrer_email: '',
    business_name: '',
    business_type: '',
    city: '',
    state: '',
    owner_contact: '',
    relationship: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.referrer_email) {
      setError('Please enter your email.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        referrer_email: form.referrer_email.trim(),
        business_name: form.business_name?.trim() || null,
        business_type: form.business_type?.trim() || null,
        location_city: form.city?.trim() || null,
        location_state: form.state?.trim() || null,
        owner_contact: form.owner_contact?.trim() || null,
        relationship: form.relationship?.trim() || null,
      };

      const { error: insErr } = await supabase.from('prelaunch_referrals').insert([payload]);
      if (insErr) {
        console.error(insErr);
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
        <title>Refer a Business Owner | MyBizExchange</title>
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-8">
          {!done ? (
            <>
              <h1 className="text-3xl font-bold text-blue-900 mb-4">Refer a Business Owner</h1>
              <p className="text-gray-700 mb-6">
                Know a business that might be looking to sell? Refer them here — coffee shops, wine stores, book stores, 
                or any walk-in business. We’ll reach out and offer them a free listing during pre-launch.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Your Email</label>
                  <input
                    type="email"
                    name="referrer_email"
                    value={form.referrer_email}
                    onChange={onChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <input
                    type="text"
                    name="business_name"
                    value={form.business_name}
                    onChange={onChange}
                    placeholder="E.g. Joe’s Coffee Shop"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Type</label>
                  <input
                    type="text"
                    name="business_type"
                    value={form.business_type}
                    onChange={onChange}
                    placeholder="Coffee shop, wine store, bookstore..."
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={onChange}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State/Province</label>
                    <input
                      type="text"
                      name="state"
                      value={form.state}
                      onChange={onChange}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner Contact (optional)</label>
                  <input
                    type="text"
                    name="owner_contact"
                    value={form.owner_contact}
                    onChange={onChange}
                    placeholder="Phone, email, or leave blank"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">How do you know this business?</label>
                  <input
                    type="text"
                    name="relationship"
                    value={form.relationship}
                    onChange={onChange}
                    placeholder="Customer, friend, neighbor..."
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                {error && <p className="text-sm text-rose-700">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 font-semibold disabled:opacity-60 transition"
                >
                  {submitting ? 'Submitting…' : 'Submit Referral'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700 mb-3">
                ✓
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Thanks for your referral!</h3>
              <p className="mt-2 text-gray-700">
                We’ll reach out to the business and invite them to list for free during pre-launch.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
