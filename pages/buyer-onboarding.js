// pages/buyer-onboarding.js
import { useRouter } from 'next/router';
import supabase from "../lib/supabaseClient";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const INDUSTRY_OPTIONS = [
  'Home Services','Retail','E-Commerce','Professional Services','Food & Beverage',
  'Manufacturing','Automotive','Health & Beauty','Construction','Software & SaaS',
  'Logistics','Education','Hospitality',
];

const PRIORITY_OPTIONS = [
  { value: 'price', label: 'Price' },
  { value: 'location', label: 'Location' },
  { value: 'industry', label: 'Industry' },
  { value: 'financing', label: 'Financing' },
];

function parseCSV(str) {
  return String(str || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export default function BuyerOnboarding() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // DB-compatible
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    financingType: 'self-financing',
    experience: '3',
    industryPreference: '',        // CSV
    capitalInvestment: '',
    shortIntroduction: '',
    priorIndustryExperience: 'No',
    willingToRelocate: 'No',
    city: '',
    stateOrProvince: '',
    video: null,
    budgetForPurchase: '',
    priority_one: '',
    priority_two: '',
    priority_three: ''
  });

  // UI helpers
  const [industriesSelected, setIndustriesSelected] = useState([]);
  const [otherIndustry, setOtherIndustry] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingId, setExistingId] = useState(null);

  // 1) Load auth + profile (prefill if logged in)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingUser(true);
      const { data } = await supabase.auth.getUser();
      const currUser = data?.user || null;
      if (!mounted) return;

      if (!currUser) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      setUser(currUser);
      setFormData(prev => ({ ...prev, email: currUser.email || '' }));

      const { data: existingProfile, error: selErr } = await supabase
        .from('buyers')
        .select('*')
        .or(`auth_id.eq.${currUser.id},email.eq.${currUser.email}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selErr) console.warn('Buyer profile lookup error:', selErr.message);

      if (mounted && existingProfile) {
        setExistingId(existingProfile.id);

        const tokens = parseCSV(existingProfile.industry_preference);
        const lower = INDUSTRY_OPTIONS.map(s => s.toLowerCase());
        const core = tokens.filter(t => lower.includes(t.toLowerCase()));
        const extras = tokens.filter(t => !core.map(c => c.toLowerCase()).includes(t.toLowerCase()));
        setIndustriesSelected(core);
        setOtherIndustry(extras.join(', '));

        setFormData(prev => ({
          ...prev,
          name: existingProfile.name ?? '',
          email: currUser.email ?? '',
          financingType: existingProfile.financing_type ?? 'self-financing',
          experience: existingProfile.experience != null ? String(existingProfile.experience) : '3',
          industryPreference: existingProfile.industry_preference ?? '',
          capitalInvestment: existingProfile.capital_investment != null ? String(existingProfile.capital_investment) : '',
          shortIntroduction: existingProfile.short_introduction ?? '',
          priorIndustryExperience: existingProfile.prior_industry_experience ?? 'No',
          willingToRelocate: existingProfile.willing_to_relocate ?? 'No',
          city: existingProfile.city ?? '',
          stateOrProvince: existingProfile.state_or_province ?? '',
          budgetForPurchase: existingProfile.budget_for_purchase != null ? String(existingProfile.budget_for_purchase) : '',
          priority_one: existingProfile.priority_one ?? '',
          priority_two: existingProfile.priority_two ?? '',
          priority_three: existingProfile.priority_three ?? ''
        }));
      }

      setLoadingUser(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ?? '' }));
  };

  const toggleIndustry = (label) => {
    setIndustriesSelected(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMB = 50;
    if (file.size > maxMB * 1024 * 1024) {
      setErrorMessage(`File too large. Max ${maxMB}MB.`);
      return;
    }

    setErrorMessage('');
    setFormData(prev => ({ ...prev, video: file }));
    setVideoPreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    const required = ['name','email','city','stateOrProvince'];
    for (let f of required) {
      if ((formData[f] ?? '') === '') {
        setErrorMessage('Please fill in all required fields.');
        return false;
      }
    }
    const picks = [formData.priority_one, formData.priority_two, formData.priority_three].filter(Boolean);
    if (picks.length < 3) { setErrorMessage('Please pick all three priorities.'); return false; }
    if (new Set(picks).size !== 3) { setErrorMessage('Please choose three different priorities.'); return false; }
    setErrorMessage('');
    return true;
  };

  // Upload media; works when logged-out by using email in the path
  const uploadIntroMedia = async (authIdOrNull, email) => {
    if (!formData.video) return { url: null, type: null };

    try {
      setIsUploading(true);
      const file = formData.video;
      const kind = file.type?.startsWith('image') ? 'image' : 'video';
      const extFromName = file.name?.split('.').pop()?.toLowerCase();
      const fallbackExt = kind === 'image' ? 'jpg' : 'mp4';
      const ext = extFromName || fallbackExt;

      const safeEmail = String(email || 'unknown').toLowerCase().replace(/[^a-z0-9._-]/g, '_');
      const folder = authIdOrNull ? `buyers/${authIdOrNull}` : `pending/${safeEmail}`;
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('buyers-videos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || (kind === 'image' ? 'image/jpeg' : 'video/mp4')
        });

      if (upErr) {
        console.error('Upload error:', upErr);
        // Don’t block the profile—just continue without media
        toast.error('Intro upload failed. You can add it later after login.');
        return { url: null, type: null };
      }

      const { data: pub } = supabase.storage.from('buyers-videos').getPublicUrl(path);
      return { url: pub?.publicUrl || null, type: kind };
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // We allow submission whether logged in or not
    const currUser = user; // may be null
    const { url: introUrl } = await uploadIntroMedia(currUser?.id ?? null, formData.email);

    // Build industry CSV from chips + "other"
    const otherTokens = parseCSV(otherIndustry);
    const industryCSV = [...industriesSelected, ...otherTokens].join(', ');

    const payload = {
      auth_id: currUser?.id ?? null,
      name: formData.name,
      email: formData.email,
      financing_type: formData.financingType,
      experience: formData.experience === '' ? null : Number(formData.experience),
      industry_preference: industryCSV,
      capital_investment: formData.capitalInvestment === '' ? null : Number(formData.capitalInvestment),
      short_introduction: formData.shortIntroduction,
      prior_industry_experience: formData.priorIndustryExperience,
      willing_to_relocate: formData.willingToRelocate,
      city: formData.city,
      state_or_province: formData.stateOrProvince,
      budget_for_purchase: formData.budgetForPurchase === '' ? null : Number(formData.budgetForPurchase),
      priority_one: formData.priority_one,
      priority_two: formData.priority_two,
      priority_three: formData.priority_three,
      intro_video_url: introUrl || null,
    };

    // Upsert by email when logged out; by id when logged in & we found a row
    try {
      if (existingId) {
        const { error } = await supabase.from('buyers').update(payload).eq('id', existingId);
        if (error) throw error;
      } else {
        // Try update-by-email first to avoid duplicates, else insert
        const { data: existingByEmail, error: findErr } = await supabase
          .from('buyers').select('id').eq('email', formData.email).maybeSingle();
        if (!findErr && existingByEmail?.id) {
          const { error } = await supabase.from('buyers').update(payload).eq('id', existingByEmail.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('buyers').insert([payload]);
          if (error) throw error;
        }
      }
    } catch (err) {
      console.error('Buyer upsert failed:', err);
      setErrorMessage('Could not save your profile right now.');
      return;
    }

    // Hard OK prompt, then send to login
    alert('✅ Your buyer profile has been submitted.\n\nPlease log in with your email to access your dashboard and messages.');
    const next = router.query.next ? String(router.query.next) : '/buyer-dashboard';
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  };

  const emailDisabled = !!user;

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
          <p className="text-gray-600">Loading your profile…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blue-50 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
          {existingId ? 'Edit Buyer Profile' : 'Buyer Onboarding'}
        </h1>

        {/* Trust banner */}
        <div className="mt-3 mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
          <p className="text-sm text-amber-900">
            <strong>Optional but recommended:</strong> add a short video or photo introduction.
            This is <em>only shared with sellers you contact</em>. It’s especially important if you’re requesting <strong>seller financing</strong>.
          </p>
        </div>

        {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border p-3 rounded text-black"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={emailDisabled}
                required
                className={`w-full border p-3 rounded text-black ${emailDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="you@example.com"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                {emailDisabled ? 'Email is set from your account.' : 'We’ll save your profile to this email.'}
              </p>
            </div>
          </div>

          {/* Experience 1–5 (filled highlight) */}
          <div>
            <label className="block text-sm font-medium mb-1">Experience in Business Ownership (1–5)</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => {
                const active = Number(formData.experience) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, experience: String(n) }))}
                    className={[
                      'w-10 h-10 rounded-full border transition',
                      active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-blue-50'
                    ].join(' ')}
                    aria-label={`Set experience to ${n}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Financing */}
          <div>
            <label className="block text-sm font-medium mb-1">Financing Type</label>
            <select
              name="financingType"
              value={formData.financingType}
              onChange={handleChange}
              className="w-full border p-3 rounded text-black"
            >
              <option value="self-financing">Self Financing</option>
              <option value="seller-financing">Seller Financing</option>
              <option value="rent-to-own">Rent-to-Own</option>
              <option value="third-party">3rd-Party Financing</option>
            </select>
          </div>

          {/* Budget + Capital */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Available Capital</label>
              <input
                type="number"
                name="capitalInvestment"
                value={formData.capitalInvestment}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
                placeholder="e.g., 50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget for Purchase</label>
              <input
                type="number"
                name="budgetForPurchase"
                value={formData.budgetForPurchase}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
                placeholder="e.g., 200000"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full border p-3 rounded text-black"
                placeholder="Where are you based?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State / Province</label>
              <input
                name="stateOrProvince"
                value={formData.stateOrProvince}
                onChange={handleChange}
                required
                className="w-full border p-3 rounded text-black"
                placeholder="e.g., NY, ON"
              />
            </div>
          </div>

          {/* Industry multi-select + other */}
          <div>
            <label className="block text-sm font-medium mb-1">Industry Preference (choose all that fit)</label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_OPTIONS.map(label => {
                const active = industriesSelected.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleIndustry(label)}
                    className={[
                      'px-3 py-1.5 rounded-full border text-sm transition',
                      active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-blue-50'
                    ].join(' ')}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium mb-1 text-gray-600">Other (comma separated)</label>
              <input
                value={otherIndustry}
                onChange={e => setOtherIndustry(e.target.value)}
                className="w-full border p-3 rounded text-black"
                placeholder="e.g., Wine shop, Pet care"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Not sure? A wine shop fits under <strong>Retail</strong>. A restaurant fits under <strong>Food &amp; Beverage</strong>.
              </p>
            </div>
          </div>

          {/* Short intro */}
          <div>
            <label className="block text-sm font-medium mb-1">Short Introduction</label>
            <textarea
              name="shortIntroduction"
              value={formData.shortIntroduction}
              onChange={handleChange}
              rows="3"
              className="w-full border p-3 rounded text-black"
              placeholder="2–3 sentences about you and the type of business you want to buy."
            />
            <p className="text-xs text-gray-500 mt-1">Sellers see this first. Build trust and show your goals.</p>
          </div>

          {/* Experience / Relocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prior Industry Experience</label>
              <select
                name="priorIndustryExperience"
                value={formData.priorIndustryExperience}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Willing to Relocate?</label>
              <select
                name="willingToRelocate"
                value={formData.willingToRelocate}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          {/* Priorities with helper text */}
          <div>
            <label className="block text-sm font-medium mb-2">Match Priorities (pick top 3)</label>
            <p className="text-[12px] text-gray-600 mb-3">
              We use your top three priorities to surface suggested matches on your dashboard.
              For example, if you choose <strong>Industry</strong> and <strong>Price</strong>, we’ll prefer businesses in your target industries that are within your budget.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <PrioritySelect label="Priority #1" value={formData.priority_one}   onChange={(v) => setFormData(p => ({ ...p, priority_one: v }))} />
              <PrioritySelect label="Priority #2" value={formData.priority_two}   onChange={(v) => setFormData(p => ({ ...p, priority_two: v }))} />
              <PrioritySelect label="Priority #3" value={formData.priority_three} onChange={(v) => setFormData(p => ({ ...p, priority_three: v }))} />
            </div>
          </div>

          {/* Media upload */}
          <div>
            <label className="block text-sm font-medium">Upload Intro Video or Photo</label>
            <div className="mt-1 space-y-1">
              <input
                type="file"
                accept="video/*,image/*"
                onChange={handleVideoUpload}
                className="w-full border p-3 rounded"
              />
              <p className="text-[11px] leading-4 text-gray-600 -mt-1">
                Record a 30–60s video or upload a clear photo. <strong>Only shown to sellers you contact.</strong>
              </p>
            </div>

            {videoPreview && (
              <div className="mt-3">
                {formData.video?.type?.startsWith('image') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={videoPreview} alt="Preview" className="w-48 rounded border" />
                ) : (
                  <video width="240" controls className="rounded border">
                    <source src={videoPreview} />
                  </video>
                )}

                <button
                  type="button"
                  onClick={() => { setFormData(p => ({ ...p, video: null })); setVideoPreview(null); }}
                  className="mt-2 text-sm text-red-600 hover:underline block"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 text-lg font-semibold disabled:opacity-60"
          >
            {isUploading ? 'Uploading…' : existingId ? 'Update Buyer Profile' : 'Submit Buyer Profile'}
          </button>
        </form>
      </div>
    </main>
  );
}

/* ---------- Small components ---------- */

function PrioritySelect({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-gray-600">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border p-3 rounded text-black"
      >
        <option value="">— Select —</option>
        {PRIORITY_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}


