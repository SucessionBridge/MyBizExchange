// pages/broker-onboarding.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

// Create a public bucket named `broker-media` in Supabase Storage once.
const BUCKET = 'broker-media';

export default function BrokerOnboarding() {
  const router = useRouter();
  const { edit } = router.query; // add ?edit=1 to force showing the form

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
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

    // NEW: persisted URLs on the broker row
    avatar_url: '',
    logo_url: '',
    card_url: '',
  });

  // NEW: local file inputs (optional)
  const [avatarFile, setAvatarFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [cardFile, setCardFile] = useState(null);

  // Require auth; if broker row exists and edit != 1 => go to dashboard
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: uRes, error: userErr } = await supabase.auth.getUser();
      const currUser = uRes?.user || null;

      if (userErr) {
        if (mounted) {
          setError(userErr.message);
          setUser(null);
          setLoadingUser(false);
        }
        return;
      }

      if (mounted) {
        setUser(currUser);
        setLoadingUser(false);
      }

      if (!currUser) {
        router.replace('/broker-login');
        return;
      }

      // Prefill email from auth
      if (mounted) {
        setForm((f) => ({ ...f, email: currUser.email || '' }));
      }

      // Check for an existing broker profile row
      const { data: br, error } = await supabase
        .from('brokers')
        .select(
          'id, email, first_name, last_name, phone, company_name, website, license_number, license_state, license_expiry, avatar_url, logo_url, card_url'
        )
        .eq('auth_id', currUser.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Broker fetch error:', error.message);
      }

      // If a row exists AND user didn't explicitly request edit => redirect to dashboard
      if (br && !edit) {
        setRedirecting(true);
        router.replace('/broker-dashboard');
        return;
      }

      // Otherwise (new broker or explicit edit), prefill the form and show onboarding
      if (mounted) {
        if (br) {
          setForm({
            email: br.email || currUser.email || '',
            first_name: br.first_name || '',
            last_name: br.last_name || '',
            phone: br.phone || '',
            company_name: br.company_name || '',
            website: br.website || '',
            license_number: br.license_number || '',
            license_state: br.license_state || '',
            license_expiry: br.license_expiry || '',
            avatar_url: br.avatar_url || '',
            logo_url: br.logo_url || '',
            card_url: br.card_url || '',
          });
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [edit, router]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // NEW: upload helper (only uploads when a new file is chosen)
  async function uploadIfNeeded(file, keyPrefix) {
    if (!file || !user) return null;
    const clean = String(file.name || 'upload').replace(/[^\w.\-]+/g, '_').slice(-120);
    const path = `broker-${user.id}/${Date.now()}_${keyPrefix}_${clean}`;
    const { error, data } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return pub?.publicUrl || null;
  }

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user) {
      router.replace('/broker-login');
      return;
    }
    setSaving(true);
    setError('');

    // Guard: form email must match authed user email
    const formEmail = String(form.email || '').trim().toLowerCase();
    const userEmail = String(user.email || '').trim().toLowerCase();
    if (formEmail && userEmail && formEmail !== userEmail) {
      setSaving(false);
      setError('Email mismatch: please log out and log back in with the correct address.');
      return;
    }

    try {
      // Upload any newly selected files
      const [avatarUrl, logoUrl, cardUrl] = await Promise.all([
        uploadIfNeeded(avatarFile, 'avatar'),
        uploadIfNeeded(logoFile, 'logo'),
        uploadIfNeeded(cardFile, 'card'),
      ]);

      const payload = {
        auth_id: user.id,
        email: user.email, // source of truth
        first_name: form.first_name?.trim() || null,
        last_name: form.last_name?.trim() || null,
        phone: form.phone?.trim() || null,
        company_name: form.company_name?.trim() || null,
        website: form.website?.trim() || null,
        license_number: form.license_number?.trim() || null,
        license_state: form.license_state?.trim() || null,
        license_expiry: form.license_expiry || null, // YYYY-MM-DD

        // Persist URLs (new uploads override existing)
        avatar_url: avatarUrl || form.avatar_url || null,
        logo_url:   logoUrl   || form.logo_url   || null,
        card_url:   cardUrl   || form.card_url   || null,
      };

      // Upsert by auth_id (RLS allows only own row)
      const { error: upErr } = await supabase
        .from('brokers')
        .upsert(payload, { onConflict: 'auth_id' });
      if (upErr) throw upErr;

      // Confirm exists (warm cache)
      const { error: checkErr } = await supabase
        .from('brokers')
        .select('id')
        .eq('auth_id', user.id)
        .limit(1)
        .maybeSingle();
      if (checkErr) throw checkErr;

      router.replace('/broker-dashboard');
    } catch (err) {
      setError(err?.message || 'Could not save broker profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser || redirecting) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div>{redirecting ? 'Redirecting to your dashboard…' : 'Loading…'}</div>
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
          <a
            href="/broker-login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
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
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={onChange}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Last name</label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={onChange}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full border rounded p-2 bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email comes from your login. To use a different email, log out and log in again.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>
          </section>

          {/* Company */}
          <section className="bg-gray-50 rounded border p-4">
            <h2 className="text-lg font-semibold mb-3">Company</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Company name</label>
                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={onChange}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Website</label>
                <input
                  name="website"
                  value={form.website}
                  onChange={onChange}
                  className="w-full border rounded p-2"
                  placeholder="https://…"
                />
              </div>
            </div>
          </section>

          {/* Licensing (optional) */}
          <section className="bg-gray-50 rounded border p-4">
            <h2 className="text-lg font-semibold mb-3">Licensing (optional)</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium">License #</label>
                <input
                  name="license_number"
                  value={form.license_number}
                  onChange={onChange}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">License State/Prov</label>
                <input
                  name="license_state"
                  value={form.license_state}
                  onChange={onChange}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Expiry</label>
                <input
                  type="date"
                  name="license_expiry"
                  value={form.license_expiry || ''}
                  onChange={onChange}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              You can leave these blank if licensing isn’t required in your region.
            </p>
          </section>

          {/* NEW: Branding & Media */}
          <section className="bg-gray-50 rounded border p-4">
            <h2 className="text-lg font-semibold mb-3">Branding & Media (optional)</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">Headshot</label>
                <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                {form.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.avatar_url} alt="avatar" className="mt-2 h-20 w-20 object-cover rounded-full border" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Company logo</label>
                <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                {form.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo_url} alt="logo" className="mt-2 h-12 object-contain border bg-white p-1" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Business card</label>
                <input type="file" accept="image/*" onChange={(e) => setCardFile(e.target.files?.[0] || null)} />
                {form.card_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.card_url} alt="card" className="mt-2 h-20 object-contain border bg-white p-1" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Supported: PNG/JPG. We’ll store them and show on your listings.</p>
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
