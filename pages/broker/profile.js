// pages/broker/profile.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../lib/supabaseBrowserClient';

export default function BrokerProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [user, setUser] = useState(null);
  const [brokerId, setBrokerId] = useState(null);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/broker-login');
          return;
        }
        if (cancelled) return;
        setUser(user);

        // Load broker row by auth_id
        const { data: br, error: brErr } = await supabase
          .from('brokers')
          .select('id, email, first_name, last_name, phone, company_name, website, license_number, license_state, license_expiry')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (brErr) {
          setError(brErr.message || 'Could not load broker profile.');
          setLoading(false);
          return;
        }

        if (!br) {
          // No profile yet → send to onboarding to create one first
          router.replace('/broker-onboarding?next=/broker/profile');
          return;
        }

        if (cancelled) return;
        setBrokerId(br.id);
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
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Unexpected error.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!user || !brokerId) return;

    setSaving(true);
    setError('');
    try {
      const payload = {
        // email comes from auth; keep it the same
        first_name: form.first_name?.trim() || null,
        last_name: form.last_name?.trim() || null,
        phone: form.phone?.trim() || null,
        company_name: form.company_name?.trim() || null,
        website: form.website?.trim() || null,
        license_number: form.license_number?.trim() || null,
        license_state: form.license_state?.trim() || null,
        license_expiry: form.license_expiry || null,
      };

      const { error: upErr } = await supabase
        .from('brokers')
        .update(payload)
        .eq('auth_id', user.id); // RLS: user can only update own row
      if (upErr) throw upErr;

      alert('Profile updated');
      router.push('/broker-dashboard');
    } catch (err) {
      setError(err?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div>Loading profile…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {form.first_name ? `Welcome back, ${form.first_name}` : 'Broker Profile'}
          </h1>
          <button
            onClick={() => router.push('/broker-dashboard')}
            className="px-3 py-2 rounded border"
          >
            Back to Dashboard
          </button>
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <form onSubmit={save} className="space-y-8">
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
                <input name="email" value={form.email} className="w-full border rounded p-2 bg-gray-50" disabled />
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
          </section>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-60">
              {saving ? 'Saving…' : 'Update Profile'}
            </button>
            <button type="button" onClick={() => router.push('/broker-dashboard')} className="px-4 py-2 rounded border">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
