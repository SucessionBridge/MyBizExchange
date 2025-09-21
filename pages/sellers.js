import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import supabase from '../lib/supabaseClient';
import FloatingInput from '../components/FloatingInput';
import EditDescriptionModal from '../components/EditDescriptionModal';

/* ---------------- Email verification gate (magic link) ---------------- */
function EmailVerifyGate() {
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [asBroker, setAsBroker] = useState(false); // 👈 preserves ?as=broker

  useEffect(() => {
    // detect broker context from URL (?as=broker)
    try {
      const p = new URLSearchParams(window.location.search);
      setAsBroker(p.get('as') === 'broker');
    } catch {}
  }, []);

  const COMMON_DOMAINS = [
    'gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com',
    'aol.com','comcast.net','live.com','proton.me'
  ];

  const suggestDomain = (addr) => {
    const [local, domainRaw = ''] = String(addr).split('@');
    const domain = domainRaw.toLowerCase();
    if (!domain) return '';

    const fixes = {
      gmai: 'gmail.com',
      gmial: 'gmail.com',
      gmal: 'gmail.com',
      hotmai: 'hotmail.com',
      yaho: 'yahoo.com',
      'icloud.co': 'icloud.com',
    };
    for (const bad in fixes) {
      if (domain.startsWith(bad)) return `${local}@${fixes[bad]}`;
    }
    if (domain.endsWith('.con')) return `${local}@${domain.replace(/\.con$/, '.com')}`;
    if (domain.endsWith('.cmo')) return `${local}@${domain.replace(/\.cmo$/, '.com')}`;

    const dist = (a, b) => {
      if (Math.abs(a.length - b.length) > 2) return 99;
      let d = 0;
      const L = Math.max(a.length, b.length);
      for (let i = 0; i < L; i++) if (a[i] !== b[i]) d++;
      return d;
    };
    let best = ''; let bestD = 99;
    for (const d of COMMON_DOMAINS) {
      const dd = dist(domain, d);
      if (dd < bestD) { bestD = dd; best = d; }
    }
    return best && bestD <= 2 ? `${local}@${best}` : '';
  };

  useEffect(() => {
    setSuggestion(suggestDomain(email));
  }, [email]);

  const sendMagicLink = async () => {
    setError('');
    const e1 = email.trim();
    const e2 = confirm.trim();

    if (!e1 || !e2 || e1.toLowerCase() !== e2.toLowerCase()) {
      setError('Emails do not match.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e1)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      // 👇 preserve broker context so the flow returns to /sellers?as=broker
      const nextDest = asBroker ? '/sellers?as=broker' : '/sellers';
      localStorage.setItem('pendingNext', nextDest);
      const { error } = await supabase.auth.signInWithOtp({
        email: e1,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextDest)}`,
        },
      });

      if (error) throw error;
      setSentTo(e1);
    } catch (e) {
      setError(e.message || 'Could not send verification link.');
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Verify your email</h2>
        <p className="text-gray-700">
          We sent a sign-in link to <strong>{sentTo}</strong>.
        </p>
        <p className="text-gray-600 text-sm mt-1">
          Open that link on this device to continue your sellers onboarding.
        </p>
        <button
          className="mt-4 text-sm text-blue-700 underline"
          onClick={() => { setSentTo(''); setEmail(''); setConfirm(''); }}
        >
          Wrong email? Change it
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-2">Start with your email</h2>
      <p className="text-gray-600 text-sm mb-4">
        We’ll send a one-click sign-in link. You’ll manage your listing with this email.
      </p>

      <label className="block text-sm font-medium mb-1">Email</label>
      <input
        className="w-full border rounded p-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        type="email"
      />
      {suggestion && suggestion.toLowerCase() !== email.toLowerCase() && (
        <div className="text-[12px] text-amber-700 mt-1">
          Did you mean{' '}
          <button className="underline" onClick={() => setEmail(suggestion)}>
            {suggestion}
          </button>
          ?
        </div>
      )}

      <label className="block text-sm font-medium mt-3 mb-1">Confirm email</label>
      <input
        className="w-full border rounded p-2"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="retype your email"
        type="email"
        onKeyDown={(e) => { if (e.key === 'Enter') sendMagicLink(); }}
      />

      {error && <div className="text-sm text-rose-700 mt-2">{error}</div>}

      <button
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-60"
        onClick={sendMagicLink}
        disabled={sending}
      >
        {sending ? 'Sending…' : 'Send sign-in link'}
      </button>
    </div>
  );
}


/* ---------------------------- Seller Wizard ---------------------------- */

export default function SellerWizard() {
  const router = useRouter();

  // 🔐 Check auth (verified email)
  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user || null;
      setAuthUser(u);
      setLoadingAuth(false);
      if (u?.email) {
        setFormData(prev => ({ ...prev, email: u.email }));
      }
    })();
  }, []);

  const [step, setStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);

  // 👉 EDIT-MODE additions
  const [isEditing, setIsEditing] = useState(false);
  const [listingId, setListingId] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Images: separate existing server URLs from new local previews
  const [existingUrls, setExistingUrls] = useState([]); // from DB
  const [imagePreviews, setImagePreviews] = useState([]); // blob: previews for new files

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentEditType, setCurrentEditType] = useState('manual');
  const [tempDescription, setTempDescription] = useState('');
  const [tempAIDescription, setTempAIDescription] = useState('');

  // ----- UI-only additions (no schema changes) -----
  const [currencySymbol, setCurrencySymbol] = useState('$'); // presentation only
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    hideBusinessName: false,
    industry: '',
    location: '',
    location_city: '',
    location_state: '',
    years_in_business: '',
    owner_hours_per_week: '',
    website: '',
    annualRevenue: '',
    sde: '',
    askingPrice: '',
    employees: '',
    monthly_lease: '',
    inventory_value: '',
    equipment_value: '',
    includesInventory: false,
    includesBuilding: false,
    relocatable: false,
    home_based: false,
    financingType: 'buyer-financed',
    businessDescription: '',
    aiDescription: '',
    descriptionChoice: 'manual',
    ownerInvolvement: '',
    growthPotential: '',
    reasonForSelling: '',
    trainingOffered: '',
    sentenceSummary: '',
    customers: '',
    bestSellers: '',
    customerProfile: '',
    repeatCustomers: '',
    keepsThemComing: '',
    proudOf: '',
    adviceToBuyer: '',
    annualProfit: '',
    seller_financing_considered: '',
    down_payment: '',
    interest_rate: '',
    term_length: '',
    images: [] // File objects for NEW uploads only
  });

  // ======== EDIT MODE: load listing when ?edit=<id> =========
  useEffect(() => {
    const { edit } = router.query || {};
    if (!authUser || !edit) return;

    (async () => {
      try {
        setLoadingExisting(true);
        const { data, error } = await supabase
          .from('sellers')
          .select('*')
          .eq('id', edit)
          .single();

        if (error) throw error;
        // Optional guard: ensure owner
        if (data?.email && authUser?.email && data.email !== authUser.email) {
          alert('You can only edit your own listing.');
          router.replace('/seller-dashboard');
          return;
        }

        setIsEditing(true);
        setListingId(edit);

        // Map DB snake_case -> wizard form keys
        setFormData(prev => ({
          ...prev,
          name: prev.name || '',
          email: authUser.email || prev.email || '',
          businessName: data.business_name || '',
          hideBusinessName: !!data.hide_business_name,
          industry: data.industry || '',
          location: data.location || '',
          location_city: data.location_city || data.city || '',
          location_state: data.location_state || data.state_or_province || '',
          years_in_business: data.years_in_business || '',
          owner_hours_per_week: data.owner_hours_per_week || '',
          website: data.website || '',
          annualRevenue: data.annual_revenue ?? '',
          sde: data.sde ?? '',
          askingPrice: data.asking_price ?? '',
          employees: data.employees ?? '',
          monthly_lease: data.monthly_lease ?? '',
          inventory_value: data.inventory_value ?? '',
          equipment_value: data.equipment_value ?? '',
          includesInventory: !!data.includes_inventory,
          includesBuilding: !!data.includes_building,
          relocatable: !!data.relocatable,
          home_based: !!data.home_based,
          financingType: (data.financing_type || 'buyer-financed').replace(/\s+/g, '-'),
          businessDescription: data.business_description || '',
          aiDescription: data.ai_description || '',
          descriptionChoice: data.description_choice || (data.ai_description ? 'ai' : 'manual'),
          ownerInvolvement: data.owner_involvement || '',
          growthPotential: data.growth_potential || '',
          reasonForSelling: data.reason_for_selling || '',
          trainingOffered: data.training_offered || '',
          sentenceSummary: data.sentence_summary || '',
          customers: data.customers || '',
          bestSellers: data.best_sellers || '',
          customerProfile: data.customer_profile || '',
          repeatCustomers: data.repeat_customers || '',
          keepsThemComing: data.keeps_them_coming || '',
          proudOf: data.proud_of || '',
          adviceToBuyer: data.advice_to_buyer || '',
          annualProfit: data.annual_profit ?? '',
          seller_financing_considered: data.seller_financing_considered || '',
          down_payment: data.down_payment ?? '',
          interest_rate: (data.seller_financing_interest_rate ?? data.interest_rate) ?? '',
          term_length: data.term_length ?? '',
          images: [] // start with none; existing images live in existingUrls
        }));

        const urls = Array.isArray(data.image_urls) ? data.image_urls.slice(0, 8) : [];
        setExistingUrls(urls);
        setPreviewMode(false);

        // If deep-linked to financing, scroll after paint
        if (typeof window !== 'undefined' && window.location.hash === '#financing') {
          setTimeout(() => {
            const el = document.getElementById('financing');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      } catch (err) {
        console.error('Failed to load listing for edit:', err);
        alert('Could not load the listing to edit.');
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [router.query, authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // If they switch to preview and there's no AI text yet, generate once
  useEffect(() => {
    if (previewMode && !formData.aiDescription) {
      const fetchDescription = async () => {
        try {
          const res = await fetch('/api/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sentenceSummary: formData.sentenceSummary,
              customerProfile: formData.customerProfile,
              bestSellers: formData.bestSellers,
              ownerInvolvement: formData.ownerInvolvement,
              opportunity: formData.growthPotential,
              proudOf: formData.proudOf,
              adviceToBuyer: formData.adviceToBuyer,
              businessName: formData.businessName,
              industry: formData.industry,
              location: formData.location || `${formData.location_city}, ${formData.location_state}`,
              annualRevenue: formData.annualRevenue,
              annualProfit: formData.annualProfit,
              includesInventory: formData.includesInventory,
              includesBuilding: formData.includesBuilding
            })
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error('AI description error:', err?.message);
            return;
          }

          const data = await res.json();
          setFormData(prev => ({ ...prev, aiDescription: data.description }));
        } catch (err) {
          console.error('AI fetch failed:', err);
        }
      };
      fetchDescription();
    }
  }, [previewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ✅ Modal controls for editing descriptions
  const openModal = (type) => {
    setEditTarget(type);
    setCurrentEditType(type);
    if (type === 'manual') {
      setTempDescription(formData.businessDescription || '');
    } else {
      setTempAIDescription(formData.aiDescription || '');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
  };

  const saveModalChanges = () => {
    if (editTarget === 'manual') {
      setFormData(prev => ({ ...prev, businessDescription: tempDescription }));
    } else if (editTarget === 'ai') {
      setFormData(prev => ({ ...prev, aiDescription: tempAIDescription }));
    }
    closeModal();
  };

  // ✅ Safer image upload + live previews + delete (UI-only guards)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentCount = existingUrls.length + imagePreviews.length;
    const remaining = Math.max(0, 8 - currentCount);
    const selected = files.slice(0, remaining);

    const filtered = [];
    for (const f of selected) {
      if (!f.type?.startsWith('image/')) {
        alert(`"${f.name}" is not an image.`);
        continue;
      }
      if (f.size > 8 * 1024 * 1024) {
        alert(`"${f.name}" is larger than 8MB.`);
        continue;
      }
      filtered.push(f);
    }
    if (!filtered.length) return;

    const newBlobs = filtered.map(file => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...filtered] }));
    setImagePreviews(prev => [...prev, ...newBlobs]);
  };

  const deleteImageAt = (index) => {
    // If index is inside existing URLs, remove from server list
    if (index < existingUrls.length) {
      setExistingUrls(prev => prev.filter((_, i) => i !== index));
      return;
    }
    // Else remove a new blob preview and its file
    const blobIdx = index - existingUrls.length;
    setImagePreviews(prev => {
      const url = prev[blobIdx];
      try { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url); } catch {}
      return prev.filter((_, i) => i !== blobIdx);
    });
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== blobIdx)
    }));
  };

  useEffect(() => {
    // cleanup blob urls on unmount
    return () => {
      imagePreviews.forEach(u => {
        try { if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); } catch {}
      });
    };
  }, [imagePreviews]);

  // UI-only currency helpers
  const formatCurrency = (val) => {
    const num = Number(val);
    if (!isFinite(num) || num === 0) return '';
    return `${currencySymbol}${num.toLocaleString()}`;
  };
  const fmtMoney = (n, digits = 0) =>
    `${currencySymbol}${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: digits })}`;

  // Explicit AI generation button (Step 3)
  async function generateAIFromAnswers() {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentenceSummary: formData.sentenceSummary,
          customerProfile: formData.customerProfile,
          bestSellers: formData.bestSellers,
          ownerInvolvement: formData.ownerInvolvement,
          opportunity: formData.growthPotential,
          proudOf: formData.proudOf,
          adviceToBuyer: formData.adviceToBuyer,
          businessName: formData.businessName,
          industry: formData.industry,
          location: formData.location || `${formData.location_city}, ${formData.location_state}`,
          annualRevenue: formData.annualRevenue,
          annualProfit: formData.annualProfit,
          includesInventory: formData.includesInventory,
          includesBuilding: formData.includesBuilding
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.message || 'Could not generate AI description.');
        return;
      }
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        aiDescription: data.description || prev.aiDescription || '',
        descriptionChoice: prev.descriptionChoice || 'ai'
      }));
    } catch (e) {
      console.error('AI generation failed', e);
      alert('AI generation failed. Try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  const handleSubmit = async () => {
    try {
      if (!authUser) {
        alert('Please verify your email first.');
        return;
      }
      setIsSubmitting(true);

      // 👇 detect broker mode and fetch broker id if verified
      const asBroker = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('as') === 'broker';
      let brokerId = null;
      if (asBroker) {
        const { data: b } = await supabase
          .from('brokers')
          .select('id, verified')
          .eq('auth_id', authUser.id)
          .single();
        if (!b) {
          window.location.href = '/broker-onboarding';
          return;
        }
        if (!b.verified) {
          alert('Your broker profile is pending verification.');
          window.location.href = '/broker-onboarding';
          return;
        }
        brokerId = b.id;
      }

      // Upload NEW images to Supabase Storage
      const uploadedImageUrls = [];
      for (const file of formData.images) {
        const fileSafe = file.name.replace(/[^\w.\-]+/g, '_');
        const filePath = `seller-${authUser.id}/${Date.now()}-${fileSafe}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('seller-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error("❌ Image upload failed:", uploadError.message);
          alert("Image upload failed. Please try again.");
          setIsSubmitting(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('seller-images')
          .getPublicUrl(uploadData.path);

        uploadedImageUrls.push(publicUrlData.publicUrl);
      }

      const cleanString = (val) => (typeof val === 'string' && val.trim() === '') ? null : val?.trim() || null;

      // Build payload (snake_case to match DB)
      const payload = {
        name: cleanString(formData.name) || 'Unnamed Seller',
        email: authUser.email,
        business_name: cleanString(formData.businessName) || 'Unnamed Business',
        hide_business_name: !!formData.hideBusinessName,
        industry: cleanString(formData.industry) || 'Unknown Industry',
        location: cleanString(formData.location) ||
          (formData.location_city && formData.location_state
            ? `${formData.location_city.trim()}, ${formData.location_state.trim()}`
            : 'Unknown Location'),
        location_city: cleanString(formData.location_city),
        location_state: cleanString(formData.location_state),
        years_in_business: Number(formData.years_in_business) || 0,
        owner_hours_per_week: Number(formData.owner_hours_per_week) || 0,
        seller_financing_considered: formData.seller_financing_considered ? formData.seller_financing_considered.toString() : null,
        website: cleanString(formData.website),
        annual_revenue: Number(formData.annualRevenue) || 0,
        annual_profit: Number(formData.annualProfit) || 0,
        sde: Number(formData.sde) || 0,
        asking_price: Number(formData.askingPrice) || 0,
        employees: Number(formData.employees) || 0,
        monthly_lease: Number(formData.monthly_lease) || 0,
        inventory_value: Number(formData.inventory_value) || 0,
        equipment_value: Number(formData.equipment_value) || 0,
        includes_inventory: !!formData.includesInventory,
        includes_building: !!formData.includesBuilding,
        relocatable: !!formData.relocatable,
        home_based: !!formData.home_based,
        financing_type: cleanString(formData.financingType)?.replace(/-/g, ' ') || 'buyer financed',
        description_choice: formData.descriptionChoice,
        business_description: formData.descriptionChoice === 'manual' ? cleanString(formData.businessDescription) : null,
        ai_description: formData.descriptionChoice === 'ai' ? cleanString(formData.aiDescription) : null,

        marketing_method: cleanString(formData.marketingMethod),
        owner_involvement: cleanString(formData.ownerInvolvement),
        can_run_without_owner: !!formData.can_run_without_owner,
        competitive_edge: cleanString(formData.competitiveEdge),
        competitors: cleanString(formData.competitors),
        growth_potential: cleanString(formData.growthPotential),
        reason_for_selling: cleanString(formData.reasonForSelling),
        training_offered: cleanString(formData.trainingOffered),
        creative_financing: !!formData.creativeFinancing,
        willing_to_mentor: !!formData.willingToMentor,
        sentence_summary: cleanString(formData.sentenceSummary),

        customer_profile: cleanString(formData.customerProfile),
        best_sellers: cleanString(formData.bestSellers),

        proud_of: cleanString(formData.proudOf),
        advice_to_buyer: cleanString(formData.adviceToBuyer),

        auth_id: authUser.id, // RLS owner link
        financing_preference: cleanString(formData.financingPreference),
        down_payment: Number(formData.down_payment) || 0,
        term_length: Number(formData.term_length) || 0,
        seller_financing_interest_rate: Number(formData.sellerFinancingInterestRate || formData.interest_rate) || 0,
        interest_rate: Number(formData.interest_rate) || 0,

        // IMAGES:
        image_urls: isEditing
          ? [...existingUrls, ...uploadedImageUrls].slice(0, 8)
          : uploadedImageUrls,

        broker_id: brokerId, // 👈 ties listing to verified broker when in broker mode
      };

      if (isEditing && listingId) {
        // ✅ UPDATE existing listing
        const { error } = await supabase.from('sellers').update(payload).eq('id', listingId);
        if (error) throw error;
        setSubmitSuccess(true);
        alert('Listing updated!');
        // If they came for financing, keep them here; otherwise you may redirect:
        // router.push(`/listings/${listingId}`);
      } else {
        // ✅ CREATE new listing via your existing API
        const res = await fetch('/api/submit-seller-listing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("❌ Submission failed:", errData);
          setSubmitError(errData.error || 'Unknown error');
          setIsSubmitting(false);
          return;
        }

        setSubmitSuccess(true);
        setSubmitError('');
        alert('Listing created!');
        // router.push('/seller-dashboard');
      }

      setIsSubmitting(false);
    } catch (error) {
      console.error("❌ Submission error:", error);
      setSubmitError('Submission error, please try again.');
      setIsSubmitting(false);
    }
  };

  const renderBackButton = () => (
    <button onClick={() => setStep(s => Math.max(1, s - 1))} className="text-sm text-blue-600 underline mt-2">Back</button>
  );

  const allPreviewUrls = () => [...existingUrls, ...imagePreviews];

  const renderImages = () => (
    <div className="space-y-2">
      <label className="block font-medium text-gray-700">Photos of your business (max 8)</label>
      <input
        type="file"
        multiple
        onChange={handleImageUpload}
        accept="image/*"
        className="w-full border rounded p-2"
      />
      <p className="text-xs text-gray-500">Up to 8 photos • JPG/PNG • max 8MB each</p>
      {allPreviewUrls().length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
          {allPreviewUrls().map((src, i) => (
            <div key={i} className="relative group">
              <img
                src={src}
                alt={`Selected ${i + 1}`}
                className="h-24 w-full object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => deleteImageAt(i)}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-red-700"
                aria-label={`Remove image ${i + 1}`}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPreview = () => {
    const toTitleCase = (str) =>
      String(str || '')
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const getListingTitle = () => {
      if (formData.industry) {
        return `${toTitleCase(formData.industry)} Business for Sale`;
      } else if (formData.hideBusinessName) {
        return 'Confidential Business Listing';
      } else {
        return formData.businessName;
      }
    };

    const previews = allPreviewUrls();

    return (
      <div className="bg-white rounded shadow p-6 space-y-8 font-serif text-gray-900">
        <h2 className="text-4xl font-bold tracking-tight mb-1">{getListingTitle()}</h2>
        <p className="text-md text-gray-600">
          {formData.location_city && formData.location_state
            ? `${formData.location_city}, ${formData.location_state}`
            : formData.location}
        </p>

        {(previews.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {previews.map((src, i) => (
              <div key={i} className="relative">
                <img
                  src={src}
                  alt={`Image ${i + 1}`}
                  className="rounded-md border h-32 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => deleteImageAt(i)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full px-2 py-1 hover:bg-red-700"
                  title="Remove"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Financials + Business Details */}
        <div className="grid md:grid-cols-2 gap-10 text-base mt-6">
          <div>
            <h3 className="text-xl font-semibold border-b pb-2 mb-3">Financial Overview</h3>
            <p><strong>Asking Price:</strong> {formatCurrency(formData.askingPrice)}</p>

            {(formData.seller_financing_considered === 'yes' || formData.seller_financing_considered === 'maybe') && (
              <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded font-medium mt-2">
                💰 Seller Financing Possible
              </div>
            )}

            <p><strong>Annual Revenue:</strong> {formatCurrency(formData.annualRevenue)}</p>
            <p><strong>SDE:</strong> {formatCurrency(formData.sde)}</p>
            <p><strong>Annual Profit:</strong> {formatCurrency(formData.annualProfit)}</p>
            <p><strong>Inventory Value:</strong> {formatCurrency(formData.inventory_value)}</p>
            <p><strong>Equipment Value:</strong> {formatCurrency(formData.equipment_value)}</p>
            <p><strong>Includes Inventory:</strong> {formData.includesInventory ? 'Yes' : 'No'}</p>
            <p><strong>Includes Building:</strong> {formData.includesBuilding ? 'Yes' : 'No'}</p>
            <p><strong>Years in Business:</strong> {formData.years_in_business || 'Undisclosed'}</p>
            <p><strong>Owner Hours/Week:</strong> {formData.owner_hours_per_week || 'Undisclosed'}</p>
            <p><strong>Seller Financing Considered:</strong>
              {formData.seller_financing_considered
                ? formData.seller_financing_considered.charAt(0).toUpperCase() + formData.seller_financing_considered.slice(1)
                : 'Undisclosed'}
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold border-b pb-2 mb-3">Business Details</h3>
            <p><strong>Employees:</strong> {formData.employees}</p>
            <p><strong>Monthly Lease:</strong> {formatCurrency(formData.monthly_lease)}</p>
            <p><strong>Home-Based:</strong> {formData.home_based ? 'Yes' : 'No'}</p>
            <p><strong>Relocatable:</strong> {formData.relocatable ? 'Yes' : 'No'}</p>
            <p><strong>Financing Type:</strong> {formData.financingType?.replace('-', ' ')}</p>
            <p><strong>Customer Type:</strong> {formData.customerType}</p>
            <p><strong>Owner Involvement:</strong> {formData.ownerInvolvement}</p>
            <p><strong>Reason for Selling:</strong> {formData.reasonForSelling}</p>
            <p><strong>Training Offered:</strong> {formData.trainingOffered}</p>
          </div>
        </div>

        {/* Seller Financing Snapshot (UI-only) */}
        {(['yes','maybe'].includes(String(formData.seller_financing_considered || '').toLowerCase())
          && Number(formData.askingPrice) > 0) && (
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded p-4">
            <h4 className="font-semibold text-emerald-800 mb-2">Seller Financing Snapshot</h4>
            {(() => {
              const price = Number(formData.askingPrice) || 0;
              const dpPct = Number(formData.down_payment) || 0;
              const rate = Number(formData.interest_rate) || 0;
              const years = Number(formData.term_length) || 0;

              const down = Math.max(0, price * (dpPct / 100));
              const financed = Math.max(0, price - down);
              const n = Math.max(0, years * 12);
              const r = rate > 0 ? rate / 100 / 12 : 0;
              const monthly = n > 0
                ? (r > 0 ? financed * (r / (1 - Math.pow(1 + r, -n))) : financed / n)
                : 0;

              return (
                <div className="grid sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white rounded border p-3">
                    <div className="text-gray-500">Asking Price</div>
                    <div className="font-semibold">{fmtMoney(price)}</div>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <div className="text-gray-500">Down Payment</div>
                    <div className="font-semibold">{fmtMoney(down)} ({dpPct || 0}%)</div>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <div className="text-gray-500">Amount Financed</div>
                    <div className="font-semibold">{fmtMoney(financed)}</div>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <div className="text-gray-500">Est. Monthly Payment</div>
                    <div className="font-semibold">{fmtMoney(monthly, 0)}</div>
                    <div className="text-gray-500 mt-1">
                      {rate || 0}% • {years || 0} yrs
                    </div>
                  </div>
                </div>
              );
            })()}
            <p className="text-xs text-emerald-800 mt-2">
              This is an estimate based on your entries. Actual terms are negotiated with the buyer.
            </p>
          </div>
        )}

        {/* Description Section */}
        {(formData.aiDescription || formData.businessDescription) && (
          <div>
            <h3 className="text-xl font-semibold border-b pb-2 mb-3">Business Description</h3>
            <div className="mb-4">
              <label className="block font-medium mb-1">Choose which description to publish:</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="descriptionChoice"
                    value="manual"
                    checked={formData.descriptionChoice === 'manual'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Written by Seller
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="descriptionChoice"
                    value="ai"
                    checked={formData.descriptionChoice === 'ai'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  AI-Enhanced Version
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-1 flex justify-between items-center">
                  Written by Seller:
                  <button
                    type="button"
                    onClick={() => openModal('manual')}
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
                  >
                    ✏️ Edit
                  </button>
                </h4>
                <p className="text-gray-800 whitespace-pre-wrap border p-3 rounded bg-gray-50">
                  {formData.businessDescription || 'No description provided.'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-1 flex justify-between items-center">
                  AI-Enhanced Version:
                  <button
                    type="button"
                    onClick={() => openModal('ai')}
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
                  >
                    ✏️ Edit
                  </button>
                </h4>
                <p className="text-gray-800 whitespace-pre-wrap border p-3 rounded bg-gray-50">
                  {formData.aiDescription || 'AI description not yet generated.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => setPreviewMode(false)}
              className="bg-gray-300 hover:bg-gray-400 text-black px-5 py-2 rounded"
            >
              Edit
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
            >
              {isSubmitting ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Listing' : 'Submit Listing')}
            </button>
          </div>
          {isSubmitting && <p className="text-sm text-gray-600">⏳ Please wait…</p>}
          {submitSuccess && <p className="text-sm text-green-600">✅ Done!</p>}
          {submitError && <p className="text-sm text-red-600">❌ {submitError}</p>}
        </div>

        {/* ✨ Edit Description Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4">
                Edit {currentEditType === 'manual' ? 'Seller-Written' : 'AI-Enhanced'} Description
              </h3>
              <textarea
                className="w-full border p-3 rounded mb-4 min-h-[150px]"
                value={currentEditType === 'manual' ? tempDescription : tempAIDescription}
                onChange={(e) =>
                  currentEditType === 'manual'
                    ? setTempDescription(e.target.value)
                    : setTempAIDescription(e.target.value)
                }
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={saveModalChanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  // --------------- Render ---------------

  if (loadingAuth || loadingExisting) {
    return <main className="bg-white min-h-screen p-6 font-sans"><div className="max-w-2xl mx-auto">Loading…</div></main>;
  }

  // ⛔ If not verified, show the email gate instead of the wizard
  if (!authUser) {
    return (
      <main className="bg-white min-h-screen p-6 font-sans">
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        </Head>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Seller Onboarding</h1>
          <EmailVerifyGate />
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen p-6 font-sans">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {previewMode ? (isEditing ? 'Edit Listing Preview' : 'Listing Preview') : (isEditing ? 'Edit Listing' : 'Seller Onboarding')}
        </h1>
        {previewMode ? renderPreview() : (
          step === 1 ? (
            <div className="space-y-4">
              <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full border p-3 rounded" />
              {/* Email is verified via Supabase; show but disable editing */}
              <input
                name="email"
                placeholder="Email (verified)"
                value={formData.email}
                onChange={handleChange}
                className="w-full border p-3 rounded bg-gray-50"
                disabled
              />
              <label htmlFor="businessName" className="block mb-1 font-semibold">
                Business Name
              </label>
              <input
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="flex items-center"><input name="hideBusinessName" type="checkbox" checked={formData.hideBusinessName} onChange={handleChange} className="mr-2" />Hide Business Name</label>
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-3 rounded">{isEditing ? 'Continue Editing' : 'Next'}</button>
                {isEditing && (
                  <button onClick={() => setPreviewMode(true)} className="w-full bg-gray-200 text-gray-900 py-3 rounded">Preview</button>
                )}
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              {/* Step 2 inputs */}
              <input
                name="industry"
                placeholder="Industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />

              <input
                name="location_city"
                placeholder="City"
                value={formData.location_city}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />

              <select
                name="location_state"
                value={formData.location_state}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              >
                <option value="">Select State/Province</option>

                {/* Canadian Provinces */}
                <option value="Alberta">Alberta</option>
                <option value="British Columbia">British Columbia</option>
                <option value="Manitoba">Manitoba</option>
                <option value="New Brunswick">New Brunswick</option>
                <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                <option value="Nova Scotia">Nova Scotia</option>
                <option value="Ontario">Ontario</option>
                <option value="Prince Edward Island">Prince Edward Island</option>
                <option value="Quebec">Quebec</option>
                <option value="Saskatchewan">Saskatchewan</option>
                <option value="Northwest Territories">Northwest Territories</option>
                <option value="Nunavut">Nunavut</option>
                <option value="Yukon">Yukon</option>

                {/* US States */}
                <option value="Alabama">Alabama</option>
                <option value="Alaska">Alaska</option>
                <option value="Arizona">Arizona</option>
                <option value="Arkansas">Arkansas</option>
                <option value="California">California</option>
                <option value="Colorado">Colorado</option>
                <option value="Connecticut">Connecticut</option>
                <option value="Delaware">Delaware</option>
                <option value="Florida">Florida</option>
                <option value="Georgia">Georgia</option>
                <option value="Hawaii">Hawaii</option>
                <option value="Idaho">Idaho</option>
                <option value="Illinois">Illinois</option>
                <option value="Indiana">Indiana</option>
                <option value="Iowa">Iowa</option>
                <option value="Kansas">Kansas</option>
                <option value="Kentucky">Kentucky</option>
                <option value="Louisiana">Louisiana</option>
                <option value="Maine">Maine</option>
                <option value="Maryland">Maryland</option>
                <option value="Massachusetts">Massachusetts</option>
                <option value="Michigan">Michigan</option>
                <option value="Minnesota">Minnesota</option>
                <option value="Mississippi">Mississippi</option>
                <option value="Missouri">Missouri</option>
                <option value="Montana">Montana</option>
                <option value="Nebraska">Nebraska</option>
                <option value="Nevada">Nevada</option>
                <option value="New Hampshire">New Hampshire</option>
                <option value="New Jersey">New Jersey</option>
                <option value="New Mexico">New Mexico</option>
                <option value="New York">New York</option>
                <option value="North Carolina">North Carolina</option>
                <option value="North Dakota">North Dakota</option>
                <option value="Ohio">Ohio</option>
                <option value="Oklahoma">Oklahoma</option>
                <option value="Oregon">Oregon</option>
                <option value="Pennsylvania">Pennsylvania</option>
                <option value="Rhode Island">Rhode Island</option>
                <option value="South Carolina">South Carolina</option>
                <option value="South Dakota">South Dakota</option>
                <option value="Tennessee">Tennessee</option>
                <option value="Texas">Texas</option>
                <option value="Utah">Utah</option>
                <option value="Vermont">Vermont</option>
                <option value="Virginia">Virginia</option>
                <option value="Washington">Washington</option>
                <option value="West Virginia">West Virginia</option>
                <option value="Wisconsin">Wisconsin</option>
                <option value="Wyoming">Wyoming</option>
              </select>

              {/* Currency selector (UI only) */}
              <label className="block font-semibold">Currency (display only)</label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full border p-3 rounded mb-2"
              >
                <option value="$">USD ($)</option>
                <option value="C$">CAD (C$)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
              </select>

              <input
                type="text"
                name="website"
                placeholder="Website"
                value={formData.website}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your website URL helps buyers learn more about your business. For privacy and security, it will only be visible to logged-in users on SuccessionBridge. This helps protect your contact details and ensures only serious buyers can reach you.
              </p>

              <input
                type="number"
                name="annualRevenue"
                placeholder="Annual Revenue"
                value={formData.annualRevenue}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />

              <input
                type="number"
                name="annualProfit"
                placeholder="Annual Profit"
                value={formData.annualProfit}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />

              <input
                type="number"
                name="sde"
                placeholder="SDE"
                value={formData.sde}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
              <p className="text-sm text-gray-500 mt-1">
                Seller’s Discretionary Earnings (SDE) is the total financial benefit to a single owner-operator in a year.
                Includes net profit <strong>before taxes</strong>, owner’s salary, discretionary expenses, interest, depreciation,
                and one-time expenses. Commonly used to value small businesses.
              </p>

              <input
                type="number"
                name="askingPrice"
                placeholder="Asking Price"
                value={formData.askingPrice}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />

              <input
                type="number"
                name="employees"
                placeholder="Number of Employees"
                value={formData.employees}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />

              <input
                type="number"
                name="monthly_lease"
                placeholder="Monthly Lease Amount"
                value={formData.monthly_lease}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                For leased premises only. Please enter how much rent you pay monthly for your business location.
                (Exclude equipment or vehicle leases.)
              </p>

              <input
                type="number"
                name="inventory_value"
                placeholder="Inventory Value"
                value={formData.inventory_value}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />

              <input
                type="number"
                name="equipment_value"
                placeholder="Equipment Value"
                value={formData.equipment_value}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />

              <label className="flex items-center">
                <input
                  name="includesInventory"
                  type="checkbox"
                  checked={formData.includesInventory}
                  onChange={handleChange}
                  className="mr-2"
                />
                Includes Inventory
              </label>

              {/* 🔧 Fix name to match payload key so it's actually saved */}
              <label className="flex items-center">
                <input
                  name="includesBuilding"
                  type="checkbox"
                  checked={formData.includesBuilding}
                  onChange={handleChange}
                  className="mr-2"
                />
                Real Estate Included
              </label>

              <label className="flex items-center">
                <input
                  name="relocatable"
                  type="checkbox"
                  checked={formData.relocatable}
                  onChange={handleChange}
                  className="mr-2"
                />
                Relocatable
              </label>

              <label className="flex items-center">
                <input
                  name="home_based"
                  type="checkbox"
                  checked={formData.home_based}
                  onChange={handleChange}
                  className="mr-2"
                />
                Home-Based
              </label>

              <label htmlFor="financingType" className="block font-semibold mb-1">
                Financing Preference
              </label>
              <select
                id="financingType"
                name="financingType"
                value={formData.financingType}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              >
                <option value="buyer-financed">Buyer Financed</option>
                <option value="seller-financed">Seller Financed</option>
                <option value="rent-to-own">Rent to Own</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select your preferred financing option for the buyer.
                This helps match your listing with buyers interested in these terms.
              </p>

              {/* 🔹 Seller Financing Encouragement Box */}
              <div id="financing" className="bg-gray-50 p-4 rounded border mt-4">
                <h3 className="font-semibold mb-2">Seller Financing Option</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Offering seller financing can help you sell faster and attract more qualified buyers.
                  You set the terms, including down payment and interest rate. Even selecting “Maybe” increases your exposure.
                </p>
                <select
                  name="seller_financing_considered"
                  value={formData.seller_financing_considered}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="maybe">Maybe</option>
                  <option value="no">No</option>
                </select>

                {(formData.seller_financing_considered === 'yes' || formData.seller_financing_considered === 'maybe') && (
                  <div className="mt-3 space-y-2">
                    <input
                      name="down_payment"
                      type="number"
                      placeholder="Typical Down Payment (%)"
                      value={formData.down_payment || ''}
                      onChange={handleChange}
                      className="w-full border p-2 rounded"
                      min={0}
                      max={100}
                    />
                    <input
                      name="interest_rate"
                      type="number"
                      placeholder="Interest Rate (%)"
                      value={formData.interest_rate || ''}
                      onChange={handleChange}
                      className="w-full border p-2 rounded"
                      min={0}
                      max={100}
                      step="0.01"
                    />
                    <input
                      name="term_length"
                      type="number"
                      placeholder="Term Length (Years)"
                      value={formData.term_length || ''}
                      onChange={handleChange}
                      className="w-full border p-2 rounded"
                      min={0}
                    />
                  </div>
                )}
              </div>

              {renderImages()}

              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="w-full bg-blue-600 text-white py-3 rounded">Next</button>
                {isEditing && (
                  <button onClick={() => setPreviewMode(true)} className="w-full bg-gray-200 text-gray-900 py-3 rounded">Preview</button>
                )}
              </div>
              {renderBackButton()}
            </div>
          ) : (
            <div className="space-y-4">
              <textarea name="businessDescription" placeholder="Brief business description" value={formData.businessDescription} onChange={handleChange} className="w-full border p-3 rounded" />

              <input name="ownerInvolvement" placeholder="Owner Involvement" value={formData.ownerInvolvement} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="growthPotential" placeholder="Growth Potential" value={formData.growthPotential} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="reasonForSelling" placeholder="Reason for Selling" value={formData.reasonForSelling} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="trainingOffered" placeholder="Training Offered" value={formData.trainingOffered} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="sentenceSummary" placeholder="1-sentence summary of business" value={formData.sentenceSummary} onChange={handleChange} className="w-full border p-3 rounded" />
              <textarea
                name="customerProfile"
                placeholder="Describe your typical customers (type, demographics, preferences)"
                value={formData.customerProfile}
                onChange={handleChange}
                className="w-full border p-3 rounded"
                rows={3}
              />

              <input name="bestSellers" placeholder="What are your best-selling products/services?" value={formData.bestSellers} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="customerLove" placeholder="What do customers love most?" value={formData.customerLove} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="repeatCustomers" placeholder="How many are repeat buyers?" value={formData.repeatCustomers} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="keepsThemComing" placeholder="Why do they return?" value={formData.keepsThemComing} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="proudOf" placeholder="Something you're proud of?" value={formData.proudOf} onChange={handleChange} className="w-full border p-3 rounded" />
              <input name="adviceToBuyer" placeholder="Advice for future owner?" value={formData.adviceToBuyer} onChange={handleChange} className="w-full border p-3 rounded" />

              {/* AI generate + Preview controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={generateAIFromAnswers}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded disabled:opacity-60"
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating…' : 'Generate AI Description'}
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                >
                  Preview My Listing
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
                >
                  {isSubmitting ? (isEditing ? 'Updating…' : 'Submitting…') : (isEditing ? 'Update Listing' : 'Submit Listing')}
                </button>
                {renderBackButton()}
              </div>
              {isSubmitting && <p className="text-sm text-gray-600">⏳ Please wait while we submit your listing...</p>}
              {submitSuccess && <p className="text-sm text-green-600">✅ Your listing has been submitted successfully!</p>}
              {submitError && <p className="text-sm text-red-600">❌ {submitError}</p>}
            </div>
          )
        )}
      </div>
    </main>
  );
}
