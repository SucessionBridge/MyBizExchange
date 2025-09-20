// pages/broker-onboarding.js
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

// Must exist once in Supabase Storage (public)
const BUCKET = 'broker-media';

function safeName(n = 'upload') {
  return String(n).replace(/[^\w.\-]+/g, '_').slice(-120);
}
function relPathFromPublicUrl(url) {
  // Public URLs look like: https://.../storage/v1/object/public/<bucket>/<path>
  try {
    const u = new URL(url);
    const ix = u.pathname.indexOf(`/storage/v1/object/public/${BUCKET}/`);
    if (ix === -1) return null;
    return u.pathname.slice(ix + `/storage/v1/object/public/${BUCKET}/`.length);
  } catch {
    return null;
  }
}

export default function BrokerOnboarding() {
  const router = useRouter();
  const { edit } = router.query;

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bucketHint, setBucketHint] = useState('');

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
    // persisted URLs
    avatar_url: '',
    logo_url: '',
    card_url: '',
  });

  // Local chosen files (uploaded on Save)
  const [avatarFile, setAvatarFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [cardFile, setCardFile] = useState(null);

  // Live previews (ObjectURL or existing URL)
  const [preview, setPreview] = useState({ avatar: '', logo: '', card: '' });

  // Per-item busy (for Remove button)
  const [brandBusy, setBrandBusy] = useState({ avatar: false, logo: false, card: false });

  // hidden file inputs (for nicer “Replace” buttons, optional)
  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const cardInputRef = useRef(null);

  // ---------- Auth + broker row ----------
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

      setForm((f) => ({ ...f, email: currUser.email || '' }));

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

      // If row exists and no ?edit=1 => go straight to dashboard
      if (br && !edit) {
        setRedirecting(true);
        router.replace('/broker-dashboard');
        return;
      }

      if (mounted && br) {
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

        setPreview({
          avatar: br.avatar_url || '',
          logo: br.logo_url || '',
          card: br.card_url || '',
        });
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

  // ---------- File pickers with live preview ----------
  const onPick = (kind) => (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (kind === 'avatar') {
      setAvatarFile(f);
    } else if (kind === 'logo') {
      setLogoFile(f);
    } else {
      setCardFile(f);
    }
    setPreview((p) => ({ ...p, [kind]: url }));
  };

  // ---------- Upload helper (called on Save) ----------
  async function uploadIfNeeded(file, keyPrefix) {
    if (!file || !user) return null;
    const clean = safeName(file.name || 'upload');
    const path = `broker-${user.id}/${Date.now()}_${keyPrefix}_${clean}`;

    const up = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });

    if (up.error) {
      const msg = up.error.message || '';
      if (/bucket/i.test(msg) && /not.*found/i.test(msg)) {
        setBucketHint(
          `Storage bucket "${BUCKET}" not found. Create a PUBLIC bucket named "${BUCKET}" in Supabase → Storage.`
        );
      }
      throw new Error(up.error.message);
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(up.data.path);
    return pub?.publicUrl || null;
  }

  // ---------- Remove one media (immediate DB update) ----------
  async function removeOne(kind) {
    if (!user) return;
    setBrandBusy((b) => ({ ...b, [kind]: true }));
    try {
      // Figure out which column + current URL
      const map = { avatar: 'avatar_url', logo: 'logo_url', card: 'card_url' };
      const col = map[kind];
      const currentUrl = form[col];

      // Try to delete the underlying storage object (best-effort)
      const rel = currentUrl ? relPathFromPublicUrl(currentUrl) : null;
      if (rel) {
        await supabase.storage.from(BUCKET).remove([rel]);
      }

      // Null the column
      const { error: upErr } = await supabase
        .from('brokers')
        .update({ [col]: null })
        .eq('auth_id', user.id);
      if (upErr) throw new Error(upErr.message);

      // Clear local form + preview + file
      setForm((f) => ({ ...f, [col]: '' }));
      setPreview((p) => ({ ...p, [kind]: '' }));
      if (kind === 'avatar') setAvatarFile(null);
      if (kind === 'logo') setLogoFile(null);
      if (kind === 'card') setCardFile(null);
    } catch (e) {
      alert(e.message || 'Remove failed.');
    } finally {
      setBrandBusy((b) => ({ ...b, [kind]: false }));
    }
  }

  // ---------- Save profile ----------
  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user) {
      router.replace('/broker-login');
      return;
    }
    setSaving(true);
    setError('');
    setBucketHint('');

    // Guard: email in form must match authed email
    const formEmail = String(form.email || '').trim().toLowerCase();
    const userEmail = String(user.email || '').trim().toLowerCase();
    if (formEmail && userEmail && formEmail !== userEmail) {
      setSaving(false);
      setError('Email mismatch: please log out and log back in with the correct address.');
      return;
    }

    try {
      // Upload any newly chosen files
      const [avatarUrl, logoUrl, cardUrl] = await Promise.all([
        uploadIfNeeded(avatarFile, 'avatar'),
        uploadIfNeeded(logoFile, 'logo'),
        uploadIfNeeded(cardFile, 'card'),
      ]);

      const payload = {
        auth_id: user.id,
        email: user.email,
        first_name: form.first_name?.trim() || null,
        last_name: form.last_name?.trim() || null,
        phone: form.phone?.trim() || null,
        company_name: form.company_name?.trim() || null,
        website: form.website?.trim() || null,
        license_number: form.license_number?.trim() || null,
        license_state: form.license_state?.trim() || null,
        license_expiry: form.license_expiry || null,
        // Overwrite URLs only if new upload exists; otherwise keep current (or null)
        avatar_url: avatarUrl ?? (form.avatar_url || null),
        logo_url: logoUrl ?? (form.logo_url || null),
        card_url: cardUrl ?? (form.card_url || null),
      };

      const { error: upErr } = await supabase
        .from('brokers')
        .upsert(payload, { onConflict: 'auth_id' });
      if (upErr) throw upErr;

      // Warm cache / confirm
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

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded shadow max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-2">Broker Onboarding</h1>
          <p className="text-gray-600 mb-4">Please sign in to start your broker profile.</p>
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

          {/* Branding & Media */}
          <section className="bg-gray-50 rounded border p-4">
            <h2 className="text-lg font-semibold mb-3">Branding &amp; Media (optional)</h2>

            {bucketHint && (
              <div className="mb-3 p-3 rounded border border-amber-200 bg-amber-50 text-amber-900 text-sm">
                {bucketHint}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {/* Avatar */}
              <div className="border rounded-xl p-4 bg-white flex flex-col gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-800">Headshot</div>
                  <div className="text-xs text-gray-500">Professional photo (JPG/PNG).</div>
                </div>
                <div className="aspect-[1/1] bg-gray-50 border rounded-lg overflow-hidden flex items-center justify-center">
                  {preview.avatar || form.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.avatar || form.avatar_url}
                      alt="Headshot"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No headshot yet</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPick('avatar')}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50"
                  >
                    {form.avatar_url || preview.avatar ? 'Replace' : 'Upload'}
                  </button>
                  {(form.avatar_url || preview.avatar) && (
                    <button
                      type="button"
                      disabled={brandBusy.avatar}
                      onClick={() => removeOne('avatar')}
                      className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50"
                    >
                      {brandBusy.avatar ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>

              {/* Logo */}
              <div className="border rounded-xl p-4 bg-white flex flex-col gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-800">Company logo</div>
                  <div className="text-xs text-gray-500">Square works best (PNG/JPG).</div>
                </div>
                <div className="aspect-[4/3] bg-gray-50 border rounded-lg overflow-hidden flex items-center justify-center">
                  {preview.logo || form.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.logo || form.logo_url}
                      alt="Logo"
                      className="object-contain w-full h-full bg-white"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No logo yet</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPick('logo')}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50"
                  >
                    {form.logo_url || preview.logo ? 'Replace' : 'Upload'}
                  </button>
                  {(form.logo_url || preview.logo) && (
                    <button
                      type="button"
                      disabled={brandBusy.logo}
                      onClick={() => removeOne('logo')}
                      className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50"
                    >
                      {brandBusy.logo ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>

              {/* Business card */}
              <div className="border rounded-xl p-4 bg-white flex flex-col gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-800">Business card</div>
                  <div className="text-xs text-gray-500">PNG/JPG; crop if needed.</div>
                </div>
                <div className="aspect-[4/3] bg-gray-50 border rounded-lg overflow-hidden flex items-center justify-center">
                  {preview.card || form.card_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.card || form.card_url}
                      alt="Business card"
                      className="object-contain w-full h-full bg-white"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No card yet</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={cardInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPick('card')}
                  />
                  <button
                    type="button"
                    onClick={() => cardInputRef.current?.click()}
                    className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50"
                  >
                    {form.card_url || preview.card ? 'Replace' : 'Upload'}
                  </button>
                  {(form.card_url || preview.card) && (
                    <button
                      type="button"
                      disabled={brandBusy.card}
                      onClick={() => removeOne('card')}
                      className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50"
                    >
                      {brandBusy.card ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Files are uploaded when you click <strong>Save &amp; Continue</strong>.
              Use <em>Remove</em> to clear an existing image immediately.
            </p>
          </section>

          {/* Actions */}
          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
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
