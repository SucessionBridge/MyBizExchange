// pages/buyer-onboarding.js
import { useRouter } from 'next/router';
import supabase from "../lib/supabaseClient";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const STATE_OPTIONS = [
  // US
  'AL','AK','AZ','AR','CA','CO','CT','DC','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  // Canada
  'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'
];

const INDUSTRY_OPTIONS = [
  'Home services',
  'E-commerce',
  'Manufacturing',
  'Logistics',
  'Professional services',
  'Automotive',
  'Food & beverage',
  'Retail',
  'Healthcare',
  'Construction',
  'SaaS / Software',
  'Cleaning & maintenance',
  'Hospitality',
];

// Canonical mapping: add common synonyms/phrases here (all lowercase)
const INDUSTRY_CANON = {
  'retail': [
    'retail','shop','store','boutique',
    'wine store','wine shop','liquor store','bottle shop',
    'convenience store','c-store'
  ],
  'food & beverage': [
    'food & beverage','restaurant','bar','pub','cafe','coffee','coffee shop',
    'bakery','brewery','distillery','food truck','catering'
  ],
  'home services': [
    'home services','hvac','heating','air','plumbing','plumber','electrical',
    'electrician','landscaping','lawn care','painting','roofing',
    'cleaning','maid service','garage door','pest control'
  ],
  'automotive': [
    'automotive','auto','car wash','detailing','mechanic','auto repair',
    'tire','oil change','body shop'
  ],
  'professional services': [
    'professional services','accounting','bookkeeping','legal','consulting','marketing agency'
  ],
  'construction': ['construction','contractor','general contractor','gc','remodeling'],
  'e-commerce': ['ecommerce','e-commerce','amazon fba','shopify','online store'],
  'manufacturing': ['manufacturing','fabrication','machining','factory','plant'],
  'healthcare': ['healthcare','clinic','dental','dentist','optometry','chiropractic','home health'],
  'logistics': ['logistics','trucking','last mile','delivery','3pl','freight','courier'],
  'saas / software': ['saas','software','it services','managed services','msp','dev shop'],
  'cleaning & maintenance': ['cleaning & maintenance','janitorial','commercial cleaning','window cleaning'],
  'hospitality': ['hospitality','hotel','motel','bnb','vacation rental'],
};

const PRIORITY_OPTIONS = [
  { value: '',          label: '— Select —' },
  { value: 'location',  label: 'Location' },
  { value: 'price',     label: 'Price/Budget' },
  { value: 'industry',  label: 'Industry' },
  { value: 'financing', label: 'Financing' },
];

function normalizeIndustries(list) {
  // Returns a deduped list including canonical buckets + the user's exact phrase (when different)
  const out = new Set();
  for (const raw of list) {
    const term = String(raw || '').trim();
    if (!term) continue;
    const lc = term.toLowerCase();

    let canonical = null;
    for (const [canon, aliases] of Object.entries(INDUSTRY_CANON)) {
      if (aliases.includes(lc)) { canonical = canon; break; }
      // also match exact canonical name (case-insensitive)
      if (canon.toLowerCase() === lc) { canonical = canon; break; }
    }
    if (canonical) out.add(canonical);
    if (!canonical || canonical.toLowerCase() !== lc) out.add(term); // keep user's wording too
  }
  return Array.from(out);
}

function suggestCanonicals(term) {
  const t = String(term || '').trim().toLowerCase();
  if (!t) return [];
  const suggestions = [];
  for (const [canon, aliases] of Object.entries(INDUSTRY_CANON)) {
    if (aliases.includes(t) || canon.toLowerCase() === t) suggestions.push(canon);
  }
  return suggestions;
}

export default function BuyerOnboarding() {
  const router = useRouter();
  const nextPath = typeof router.query.next === 'string' ? router.query.next : '/buyer-dashboard';

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    financingType: 'self-financing',
    experience: '3',
    industryPreference: '',     // comma-separated
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

  // Multi-select + custom input
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [customIndustry, setCustomIndustry] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingId, setExistingId] = useState(null);

  // 1) Load auth user + existing profile
  useEffect(() => {
    let mounted = true;

    const load = async () => {
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

        // Split any stored comma list into known options + first custom fallback
        const tokens = String(existingProfile.industry_preference || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

        const optionIndex = new Map(INDUSTRY_OPTIONS.map((o, i) => [o.toLowerCase(), i]));
        const chosen = [];
        let custom = '';

        for (const t of tokens) {
          const idx = optionIndex.get(t.toLowerCase());
          if (typeof idx === 'number') {
            chosen.push(INDUSTRY_OPTIONS[idx]);
          } else if (!custom) {
            custom = t; // keep the first unknown as custom text
          }
        }

        setSelectedIndustries(chosen);
        setCustomIndustry(custom);

        setFormData(prev => ({
          ...prev,
          name: existingProfile.name ?? '',
          email: currUser.email ?? '',
          financingType: existingProfile.financing_type ?? 'self-financing',
          experience: existingProfile.experience != null ? String(existingProfile.experience) : '3',
          industryPreference: (existingProfile.industry_preference || ''),
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
    };

    load();
    return () => { mounted = false; };
  }, []);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ?? '' }));
  };

  const handleIndustryMulti = (e) => {
    const opts = Array.from(e.target.selectedOptions).map(o => o.value);
    setSelectedIndustries(opts);
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
    const requiredFields = ['name', 'email', 'city', 'stateOrProvince'];
    for (let field of requiredFields) {
      if ((formData[field] ?? '') === '') {
        setErrorMessage('Please fill in all required fields.');
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  // Upload to storage (optional)
  const uploadIntroMedia = async (userId) => {
    if (!formData.video) return { url: null, type: null };
    try {
      setIsUploading(true);
      const file = formData.video;
      const kind = file.type?.startsWith('image') ? 'image' : 'video';
      const extFromName = file.name?.split('.').pop()?.toLowerCase();
      const fallbackExt = kind === 'image' ? 'jpg' : 'mp4';
      const ext = extFromName || fallbackExt;
      const path = `buyers/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('buyers-videos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || (kind === 'image' ? 'image/jpeg' : 'video/mp4')
        });

      if (upErr) {
        console.error('Upload error:', upErr);
        setErrorMessage('Upload failed. Please try a smaller file or a different format.');
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

    const { data } = await supabase.auth.getUser();
    const currUser = data?.user || null;
    if (!currUser) {
      setErrorMessage('Please sign in to submit your profile.');
      return;
    }

    const { url: introUrl } = await uploadIntroMedia(currUser.id);

    // Build the industry list: selected + (optional) custom, then normalize
    const rawIndustries = [...selectedIndustries];
    if (customIndustry && customIndustry.trim()) rawIndustries.push(customIndustry.trim());
    const normalized = normalizeIndustries(rawIndustries);

    const payload = {
      auth_id: currUser.id,
      name: formData.name,
      email: formData.email || currUser.email,
      financing_type: formData.financingType,
      experience: formData.experience === '' ? null : Number(formData.experience),
      industry_preference: normalized.join(', '), // store CSV (canonical + user term if different)
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

    if (existingId) {
      const { error } = await supabase.from('buyers').update(payload).eq('id', existingId);
      if (error) {
        console.error(error);
        setErrorMessage('Could not update your profile right now.');
        return;
      }
      toast.success('Your buyer profile was updated.');
    } else {
      const { error } = await supabase.from('buyers').insert([payload]);
      if (error) {
        console.error(error);
        setErrorMessage('Could not create your profile right now.');
        return;
      }
      toast.success('Your buyer profile was created.');
    }

    setTimeout(() => router.replace(nextPath), 150);
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

  const customSuggestions = suggestCanonicals(customIndustry);

  return (
    <main className="min-h-screen bg-blue-50 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
          {existingId ? 'Edit Buyer Profile' : 'Buyer Onboarding'}
        </h1>

        <div className="mt-3 mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
          <p className="text-sm text-amber-900">
            <strong>Optional but recommended:</strong> add a short video or photo introduction.
            This is <em>only shared with sellers you contact</em>. It’s especially important if you’re requesting <strong>seller financing</strong>.
          </p>
        </div>

        {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
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
              className={`w-full border p-3 rounded text-black ${emailDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="you@example.com"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {emailDisabled ? 'Email is set from your account.' : 'No account detected — you can type your email.'}
            </p>
          </div>

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

          <div>
            <label className="block text-sm font-medium mb-1">Experience in Business Ownership (1–5)</label>
            <input
              type="number"
              name="experience"
              min="1"
              max="5"
              value={formData.experience}
              onChange={handleChange}
              className="w-full border p-3 rounded text-black"
            />
          </div>

          {/* Industry multi-select */}
          <div>
            <label className="block text-sm font-medium mb-1">Industry Preferences (choose 1–5)</label>
            <select
              multiple
              size={Math.min(INDUSTRY_OPTIONS.length, 8)}
              value={selectedIndustries}
              onChange={handleIndustryMulti}
              className="w-full border p-3 rounded text-black"
            >
              {INDUSTRY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">
              Can’t find yours? Add a custom one below — we’ll still match it to the closest category.
            </p>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Custom industry (optional)</label>
              <input
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                className="w-full border p-3 rounded text-black"
                placeholder="e.g., Wine store, Pilates studio, Microbrewery"
              />
              {!!customIndustry && customSuggestions.length > 0 && (
                <p className="text-xs text-emerald-700 mt-1">
                  We’ll also match this as: <strong>{customSuggestions.join(', ')}</strong>
                </p>
              )}
            </div>
          </div>

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
                className="w-full border p-3 rounded text-black"
                placeholder="Where are you based?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State / Province</label>
              <select
                name="stateOrProvince"
                value={formData.stateOrProvince}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
              >
                <option value="">— Select —</option>
                {STATE_OPTIONS.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
          </div>

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

          {/* Priorities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Top Priority #1</label>
              <select
                name="priority_one"
                value={formData.priority_one}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
              >
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Top Priority #2</label>
              <select
                name="priority_two"
                value={formData.priority_two}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
              >
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Top Priority #3</label>
              <select
                name="priority_three"
                value={formData.priority_three}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
              >
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Intro media */}
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
                  onClick={() => {
                    setFormData(prev => ({ ...prev, video: null }));
                    setVideoPreview(null);
                  }}
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
