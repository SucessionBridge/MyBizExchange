// pages/broker-onboarding.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

export default function BrokerOnboarding() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    company_name: '',
    website: '',
    license_number: '',
    license_state: '',
    license_expiry: '',
  });

  // Require auth; prefill from existing brokers row if present
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      setLoadingUser(false);

      if (!user) return;

      // prefill email
      setForm((f) => ({ ...f, email: user.email || '' }));

      const { data: br, error } = await supabase
        .from('brokers')
        .select('email, first_name, last_name, phone, company_name, website, license_number, license_state, license_expiry')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!error && br) {
        setForm({
          email: br.email || user.email || '',
          first_name: br.first_name || '',
          last_name: br.last_name || '',
          phone: br.phone || '',
          company_name: br.company_name || '',
          website: br.website || '',
          license_number: br.license_number || '',
          license_state: br.license_state || '',
          license_expiry: br.license_expiry || '',
        });
      }
    })();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user) {
      router.replace('/login?role=broker');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const payload = {
        auth_id: user.id,
        email: form.email || user.email,
        first_name: form.first_name?.trim() || null,
        last_name: form.last_name?.trim() || null,
        phone: form.phone?.trim() || null,
        company_name: form.company_name?.trim() || null,
        website: form.website?.trim() || null,
        license_number: form.license_number?.trim() || null,
        license_state: form.license_state?.trim() || null,
        license_expiry: form.license_expiry || null, // YYYY-MM-DD
      };

      const { error } = await supabase
        .from('brokers')
        .upsert(payload, { onConflict: 'auth_id' });

      if (error) throw error;

      // Done → dashboard
      router.replace('/broker-dashboard');
    } catch (err) {
      setError(err?.message || 'Could not save broker profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div>Loading…</div>
      </main>
    );
  }

  // Not signed in → send to broker login
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded shadow max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-2">Broker Onboarding</h1>
          <p className="text-gray-600 mb-4">
            Please sign in to start your broker profile.
          </p>
          <a href="/login?role=broker" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Broker Login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Broker Onboarding</h1>

        <form onSubmit={saveProfile} className="space-y-8">
          {/* Contact */}
          <section className="bg-gray-50 rounded border p-4">
            <h2 className="text-lg font-semibold mb-3">Contact</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">First name</label>
                <input name="first_name" value={form.first_name} onChange={onChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Last name</label>
                <input name="last_name" value={form.last_name} onChange={onChange} className="w-full border rounded p-2" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input name="email" value={form.email} onChange={onChange} className="w-full border rounded p-2 bg-gray-50" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded p-2" />
              </div>
            </div>
          </section>

          {/* Company */}
          <section className="bg-gray-50 rounded border p-4">
            <h2 className="text-lg font-semibold mb-3">Company</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Company name</label>
                <input name="company_name" value={form.company_name} onChange={onChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Website</label>
                <input name="website" value={form.website} onChange={onChange} className="w-full border rounded p-2" placeholder="https://…" />
              </div>
            </div>
          </section>

          {/* Licensing (optional) */}
          <section className="bg-gray-50 rounded border p-4">
            <h2 className="text-lg font-semibold mb-3">Licensing (optional)</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium">License #</label>
                <input name="license_number" value={form.license_number} onChange={onChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">License State/Prov</label>
                <input name="license_state" value={form.license_state} onChange={onChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Expiry</label>
                <input type="date" name="license_expiry" value={form.license_expiry || ''} onChange={onChange} className="w-full border rounded p-2" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              You can leave these blank if licensing isn’t required in your region.
            </p>
          </section>

          {/* Actions */}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save & Continue'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/broker-dashboard')}
              className="px-4 py-2 rounded border"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
