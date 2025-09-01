// pages/broker/listings/new.js
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import supabase from '../../../lib/supabaseClient';

export default function BrokerNewListing() {
  const router = useRouter();

  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [brokerId, setBrokerId] = useState(null);
  const [creatingBrokerRow, setCreatingBrokerRow] = useState(false);

  // UI state
  const [mode, setMode] = useState('choose'); // 'choose' | 'manual' | 'import'

  // Minimal manual form state
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [form, setForm] = useState({
    businessName: '',
    industry: '',
    city: '',
    state: '',
    askingPrice: '',
    annualRevenue: '',
    sde: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ----- Auth gate -----
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user || null;
      setAuthUser(u);
      setLoadingAuth(false);

      if (!u) {
        const next = '/broker/listings/new';
        router.replace(`/login?role=broker&next=${encodeURIComponent(next)}`);
        return;
      }

      // Ensure a broker row exists for this auth_id
      setCreatingBrokerRow(true);
      const { data: existing, error: exErr } = await supabase
        .from('brokers')
        .select('id, verified, email')
        .eq('auth_id', u.id)
        .maybeSingle();

      if (exErr) {
        console.error('Error finding broker row:', exErr);
        setCreatingBrokerRow(false);
        return;
      }

      if (!existing) {
        const minimal = { auth_id: u.id, email: u.email };
        const { data: upserted, error: upErr } = await supabase
          .from('brokers')
          .upsert(minimal, { onConflict: 'auth_id' })
          .select('id')
          .single();
        if (upErr) {
          console.error('Error creating minimal broker row:', upErr);
          setCreatingBrokerRow(false);
          return;
        }
        setBrokerId(upserted.id);
      } else {
        setBrokerId(existing.id);
      }
      setCreatingBrokerRow(false);
    })();
  }, [router]);

  // ----- Helpers -----
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = Math.max(0, 8 - images.length);
    const selected = files.slice(0, remaining);

    const previews = selected.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...selected]);
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeImageAt = (idx) => {
    const u = imagePreviews[idx];
    if (u) URL.revokeObjectURL(u);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locationString = useMemo(() => {
    const c = (form.city || '').trim();
    const s = (form.state || '').trim();
    if (c && s) return `${c}, ${s}`;
    return c || s || '';
  }, [form.city, form.state]);

  const validateManual = () => {
    const errs = [];
    if (!form.businessName.trim()) errs.push('Business name is required');
    if (!form.industry.trim()) errs.push('Industry is required');
    if (!locationString) errs.push('City or State is required');
    return errs;
  };

  // ----- Submit (manual create) -----
  const submitManual = async () => {
    if (!authUser || !brokerId) return;

    const errs = validateManual();
    if (errs.length) {
      setSubmitError(errs.join('. ') + '.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      // Upload images to bucket `seller-images`
      const uploadedImageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const safeName = String(file.name || `file_${i}`).replace(/[^\w.\-]/g, '_');
        const filePath = `broker-${brokerId}/${Date.now()}_${i}_${safeName}`;

        const { data: uploaded, error: upErr } = await supabase
          .storage
          .from('seller-images')
          .upload(filePath, file, { upsert: false });

        if (upErr) {
          setSubmitting(false);
          setSubmitError(`Image upload failed: ${upErr.message}`);
          return;
        }

        const { data: pub } = supabase.storage.from('seller-images').getPublicUrl(uploaded.path);
        uploadedImageUrls.push(pub.publicUrl);
      }

      const payload = {
        name: 'Broker',
        email: authUser.email,
        business_name: form.businessName.trim(),
        industry: form.industry.trim(),
        location: locationString || 'Undisclosed',
        location_city: form.city.trim() || null,
        location_state: form.state.trim() || null,
        financing_type: 'buyer-financed',
        asking_price: form.askingPrice ? Number(form.askingPrice) : null,
        annual_revenue: form.annualRevenue ? Number(form.annualRevenue) : null,
        sde: form.sde ? Number(form.sde) : null,
        business_description: form.description.trim() || '',
        description_choice: 'manual',
        ai_description: '',
        image_urls: uploadedImageUrls,
        auth_id: authUser.id,
        broker_id: brokerId,
        status: 'active',
      };

      const res = await fetch('/api/submit-seller-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Safely attempt to read JSON; fall back to text
        let msg = 'Create failed';
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const data = await res.json();
            msg = data?.detail || data?.error || msg;
          } else {
            const t = await res.text();
            msg = t || msg;
          }
        } catch {}
        setSubmitting(false);
        setSubmitError(msg);
        return;
      }

      router.replace('/broker-dashboard');
    } catch (e) {
      setSubmitting(false);
      setSubmitError(e.message || 'Submission error, please try again.');
    }
  };

  // ----- Import (NEW) -----
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importReasons, setImportReasons] = useState([]);
  const [importTips, setImportTips] = useState([]);

  const runImport = async () => {
    setImportError('');
    if (!importUrl.trim()) {
      setImportError('Please paste a listing URL.');
      return;
    }
    try {
      setImportLoading(true);
      const res = await fetch('/api/scrape-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      // Always try JSON, but guard against HTML just in case
      let payload;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        payload = await res.json();
      } else {
        const t = await res.text();
        throw new Error(t || `Unexpected response (${res.status})`);
      }

      if (!payload.ok) {
        throw new Error(payload.error || 'Import failed');
      }

      const pre = payload.prefill || {};
      // Prefill form
      setForm((f) => ({
        ...f,
        businessName: pre.businessName || f.businessName,
        industry: pre.industry || f.industry,
        city: pre.city || f.city,
        state: pre.state || f.state,
        askingPrice: pre.askingPrice ?? f.askingPrice,
        annualRevenue: pre.annualRevenue ?? f.annualRevenue,
        sde: pre.sde ?? f.sde,
        description: [f.description, pre.description].filter(Boolean).join('\n\n'),
      }));

      // Prefill image previews as “remote” placeholders (you can re-upload later)
      // We won’t upload remote images now; you can add uploads later if you want.
      if (Array.isArray(pre.images) && pre.images.length) {
        // Create object URLs is only for local files; for remote URLs just show them.
        setImagePreviews((prev) => [
          ...prev,
          ...pre.images.slice(0, 8 - prev.length),
        ]);
      }

      setImportReasons(pre.reasons || []);
      setImportTips(pre.tips || []);

      // Switch to manual so they can review & submit
      setMode('manual');
    } catch (e) {
      setImportError(e.message || 'Import failed.');
    } finally {
      setImportLoading(false);
    }
  };

  // ----- Render -----
  if (loadingAuth || creatingBrokerRow) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div>Loading…</div>
      </main>
    );
  }

  if (!authUser) return null;

  return (
    <main className="bg-white min-h-screen p-6">
      <Head>
        <title>New Listing · Broker</title>
      </Head>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Add a New Listing</h1>

        {mode === 'choose' && (
          <div className="grid md:grid-cols-2 gap-4">
            <button
              className="border rounded-lg p-5 text-left hover:bg-gray-50"
              onClick={() => setMode('manual')}
            >
              <div className="text-lg font-semibold mb-1">Create from scratch</div>
              <p className="text-sm text-gray-600">
                Use our simple form to enter the details and publish.
              </p>
            </button>
            <button
              className="border rounded-lg p-5 text-left hover:bg-gray-50"
              onClick={() => setMode('import')}
            >
              <div className="text-lg font-semibold mb-1">Import existing listing</div>
              <p className="text-sm text-gray-600">
                Paste your public listing URL — we’ll prefill the form for you. You can edit everything before publishing.
              </p>
            </button>
          </div>
        )}

        {mode === 'import' && (
          <div className="space-y-4 border rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium mb-1">Listing URL</label>
              <input
                className="w-full border rounded p-2"
                placeholder="https://yourcompany.com/listing/123"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                Why we ask: importing saves time and reduces copy-paste mistakes. We only prefill obvious fields so you stay in control.
              </p>
            </div>

            {importError && (
              <div className="text-sm text-red-600">{importError}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={runImport}
                disabled={importLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {importLoading ? 'Importing…' : 'Import from URL'}
              </button>
              <button
                onClick={() => setMode('choose')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded"
              >
                Back
              </button>
            </div>

            {(importReasons.length > 0 || importTips.length > 0) && (
              <div className="bg-gray-50 rounded p-3 text-sm">
                {importReasons.length > 0 && (
                  <>
                    <div className="font-medium mb-1">Reasons we prefill</div>
                    <ul className="list-disc ml-5 mb-2">
                      {importReasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </>
                )}
                {importTips.length > 0 && (
                  <>
                    <div className="font-medium mb-1">Tips after import</div>
                    <ul className="list-disc ml-5">
                      {importTips.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'manual' && (
          <div className="space-y-5 border rounded-lg p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business name</label>
                <input
                  name="businessName"
                  className="w-full border rounded p-2"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="e.g., Acme HVAC Services"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Industry</label>
                <input
                  name="industry"
                  className="w-full border rounded p-2"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="e.g., HVAC, Restaurant, eCommerce"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  name="city"
                  className="w-full border rounded p-2"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State/Province</label>
                <input
                  name="state"
                  className="w-full border rounded p-2"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="State or Province"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Asking price (USD)</label>
                <input
                  name="askingPrice"
                  type="number"
                  className="w-full border rounded p-2"
                  value={form.askingPrice}
                  onChange={handleChange}
                  placeholder="e.g., 450000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Annual revenue (USD)</label>
                <input
                  name="annualRevenue"
                  type="number"
                  className="w-full border rounded p-2"
                  value={form.annualRevenue}
                  onChange={handleChange}
                  placeholder="e.g., 1200000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SDE (USD)</label>
                <input
                  name="sde"
                  type="number"
                  className="w-full border rounded p-2"
                  value={form.sde}
                  onChange={handleChange}
                  placeholder="e.g., 325000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                className="w-full border rounded p-2 min-h-[140px]"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief overview of the business…"
              />
              <p className="text-xs text-gray-500 mt-2">
                Tip: add revenue/SDE and unique advantages to improve buyer matches.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Photos (up to 8)
              </label>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`Selected ${i + 1}`}
                        className="h-24 w-full object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageAt(i)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-red-700"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                You can replace imported images with your originals before publishing.
              </p>
            </div>

            {submitError && <div className="text-sm text-red-600">{submitError}</div>}

            <div className="flex items-center gap-3">
              <button
                onClick={submitManual}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create Listing'}
              </button>
              <button
                onClick={() => setMode('choose')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

