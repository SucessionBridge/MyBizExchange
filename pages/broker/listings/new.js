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

  // ----- Import (URL + optional freeform text) -----
  const [importUrl, setImportUrl] = useState('');
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importInfo, setImportInfo] = useState('');

  function parseMoney(str) {
    if (!str) return '';
    const n = Number(String(str).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? String(n) : '';
  }

  // --- proxy fallback (browser) ---
  const PROXY_BASE = 'https://r.jina.ai/http/';

  function firstNonEmptyClient(...vals) {
    for (const v of vals) {
      const s = (v ?? '').toString().trim();
      if (s) return s;
    }
    return '';
  }

  function absUrlClient(base, maybe) {
    if (!maybe) return '';
    try { return new URL(maybe, base).toString(); } catch { return ''; }
  }

  function browserExtractFromProxy(html, baseUrl) {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const q = (sel) => doc.querySelector(sel);
    const get = (sel, attr = 'content') => (q(sel)?.getAttribute(attr) || '').trim();
    const text = (sel) => (q(sel)?.textContent || '').trim();

    const title = firstNonEmptyClient(
      get('meta[property="og:title"]'),
      get('meta[name="twitter:title"]'),
      text('h1'),
      text('title')
    );

    let description = firstNonEmptyClient(
      get('meta[name="description"]'),
      get('meta[property="og:description"]'),
      get('meta[name="twitter:description"]')
    );
    if (!description) {
      const paras = Array.from(doc.querySelectorAll('p'))
        .map(p => (p.textContent || '').trim())
        .filter(t => t && t.length > 80)
        .slice(0, 4);
      description = paras.join('\n\n');
    }

    const image = firstNonEmptyClient(
      absUrlClient(baseUrl, get('meta[property="og:image"]')),
      absUrlClient(baseUrl, get('meta[name="twitter:image"]')),
      absUrlClient(baseUrl, q('img[src]')?.getAttribute('src') || '')
    );

    const metaPrice = firstNonEmptyClient(
      get('meta[property="product:price:amount"]'),
      (q('[itemprop="price"]')?.getAttribute('content') || q('[itemprop="price"]')?.textContent || '').trim(),
      text('[data-testid="price"]'),
      text('[class*="price"]')
    );
    let price = metaPrice;
    if (!price) {
      const bodyText = (doc.body?.textContent || '').toString();
      const askingIdx = bodyText.search(/asking|list\s*price|price[\s:]/i);
      const dollarMatch = bodyText.match(/\$\s?[\d.,]+(?:\s?(?:million|m|k))?/i);
      if (askingIdx >= 0 && dollarMatch) price = dollarMatch[0];
    }

    let location = '';
    const city = (q('[itemprop="addressLocality"]')?.textContent || '').trim();
    const region = (q('[itemprop="addressRegion"]')?.textContent || '').trim();
    if (city) location = region ? `${city}, ${region}` : city;
    if (!location) {
      location = firstNonEmptyClient(
        text('[data-testid*="location"]'),
        text('[class*="location"]')
      );
    }
    if (!location) {
      const m = (doc.body?.textContent || '').match(/\b([A-Za-z .'-]{2,}),\s*([A-Za-z]{2})\b/);
      if (m) location = `${m[1]}, ${m[2]}`;
    }

    const industry = firstNonEmptyClient(
      text('[itemprop="industry"]'),
      get('meta[name="category"]'),
      get('meta[property="article:section"]'),
      text('[class*="industry"]')
    );

    const extracted = {
      title: title || '',
      price: price || '',
      description: description || '',
      location: location || '',
      industry: industry || '',
      image: image || ''
    };

    const hasAny = extracted.title || extracted.price || extracted.description || extracted.location || extracted.industry || extracted.image;
    return hasAny ? extracted : null;
  }

  // functional setForm to prevent stale state merges
  function applyExtracted(ex) {
    setForm((prev) => {
      const next = { ...prev };

      if (ex?.title) next.businessName = ex.title;
      if (ex?.industry) next.industry = ex.industry;
      if (ex?.description) {
        next.description = [prev.description, ex.description].filter(Boolean).join('\n\n').trim();
      }
      if (ex?.price) {
        const p = parseMoney(ex.price);
        if (p) next.askingPrice = p;
      }
      if (ex?.location) {
        // Try to split "City, ST" or "City, State"
        const m = ex.location.match(/^\s*([^,]+)\s*,\s*([A-Za-z]{2})\s*$/);
        if (m) {
          next.city = m[1];
          next.state = m[2].toUpperCase();
        } else {
          next.city = ex.location;
        }
      }

      return next;
    });

    // Remote preview only — do not upload here
    if (ex?.image && imagePreviews.length < 8) {
      setImagePreviews((prev) => [...prev, ex.image]);
    }
  }

  const runImport = async () => {
    setImportError('');
    setImportInfo('');

    if (!importUrl.trim() && !importText.trim()) {
      setImportError('Paste a listing URL or some listing text.');
      setMode('import');
      return;
    }

    try {
      setImportLoading(true);

      let extracted = null;

      // 1) If URL provided, ask the server to scrape it
      if (importUrl.trim()) {
        const res = await fetch('/api/scrape-listing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: importUrl.trim() }),
        });

        const ct = res.headers.get('content-type') || '';
        let data = null;
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          const t = await res.text().catch(() => '');
          console.warn('Non-JSON from /api/scrape-listing', { ct, t: t?.slice(0, 200) });
        }

        if (data?.ok && data?.extracted) {
          extracted = data.extracted;
          setImportInfo('We imported what we could. Please review the fields below before publishing.');
        } else {
          const code = data?.code || 'UNKNOWN';
          let handledByProxy = false;

          // 2) If server timed out / blocked / upstream error → browser proxy fallback
          if (code === 'TIMEOUT' || code === 'FETCH_ERROR' || code === 'UPSTREAM') {
            try {
              const proxied = PROXY_BASE + importUrl.trim();
              const px = await fetch(proxied, { cache: 'no-store' });
              const html = await px.text();
              const ex = browserExtractFromProxy(html, importUrl.trim());
              if (ex) {
                extracted = ex;
                handledByProxy = true;
                setImportInfo('Imported via proxy. Please review the fields below.');
              }
            } catch (e) {
              // fall through to show error below
            }
          }

          if (!handledByProxy && !extracted) {
            let msg = data?.error || 'Import failed.';
            if (code === 'NON_HTML') msg = 'That URL is not an HTML page (e.g., it might be a PDF or JSON).';
            if (code === 'EMPTY') msg = 'We parsed the page but could not detect listing fields.';
            if (code === 'TIMEOUT' || code === 'FETCH_ERROR') msg = 'Timed out fetching that URL. Try again or paste details manually.';
            setImportError(msg);
            setMode('import');
            return;
          }
        }
      }

      // Apply extracted fields if any
      if (extracted) applyExtracted(extracted);

      // 3) If extra text provided, append to description
      if (importText.trim()) {
        setForm((f) => ({
          ...f,
          description: [f.description, `Source notes:\n${importText.trim()}`]
            .filter(Boolean)
            .join('\n\n'),
        }));
      }

      // 4) Switch to the manual form so the broker can finish & publish
      setMode('manual');
    } catch (e) {
      console.error(e);
      const msg = /aborted|abortcontroller|timed out/i.test(String(e?.message || ''))
        ? 'Timed out fetching that URL.'
        : (e?.message || 'Import failed.');
      setImportError(msg);
      setMode('import'); // remain in Import mode on failure
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
                Paste a public listing URL (and optional text). We’ll prefill the form; you can edit everything before publishing.
              </p>
            </button>
          </div>
        )}

        {mode === 'import' && (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="text-sm text-gray-600">
              Import saves time and reduces copy-paste mistakes. We try to grab the business name, price clues,
              description, location, and a lead image.
              <div className="mt-2 text-xs text-gray-500">
                Why we might not capture everything:
                <ul className="list-disc ml-5 mt-1">
                  <li>Sites use very different HTML structures.</li>
                  <li>Some pages block bots or require cookies.</li>
                  <li>Numbers may be formatted oddly or embedded in images/PDFs.</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Listing URL (optional)</label>
              <input
                className="w-full border rounded p-2"
                placeholder="https://yourcompany.com/listing/123"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Paste listing text (optional)</label>
              <textarea
                className="w-full border rounded p-2 min-h-[140px]"
                placeholder="Paste the full listing text here…"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Adding text helps if the site blocks scraping — we’ll append it to Description so nothing is lost.
              </p>
            </div>

            {importError && (
              <div className="text-sm text-red-600">{importError}</div>
            )}
            {importInfo && (
              <div className="text-sm text-emerald-700">{importInfo}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={runImport}
                disabled={importLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {importLoading ? 'Importing…' : 'Import & Prefill'}
              </button>
              <button
                onClick={() => setMode('choose')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded"
              >
                Back
              </button>
            </div>

            <p className="text-xs text-gray-500">
              You’ll review all imported fields on the next screen before creating the listing.
            </p>
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Selected ${i + 1}`}
                        className="h-24 w-full object-cover rounded border"
                        onError={(e) => { e.currentTarget.style.opacity = 0.5; }}
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

