pages/buyer-dashboard.js

// pages/buyer-onboarding.js
import { useRouter } from 'next/router';
import supabase from "../lib/supabaseClient";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function BuyerOnboarding() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    financingType: 'self-financing',
    experience: '3',              // keep as string for controlled <input type="number">
    industryPreference: '',
    capitalInvestment: '',        // string so empty is allowed
    shortIntroduction: '',
    priorIndustryExperience: 'No',
    willingToRelocate: 'No',
    city: '',
    stateOrProvince: '',
    video: null,                  // File or null
    budgetForPurchase: '',
    priority_one: '',
    priority_two: '',
    priority_three: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingId, setExistingId] = useState(null);

  // 1) Load auth user and existing buyer profile (prefill)
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getUser();
      const currUser = data?.user || null;

      if (!mounted) return;

      if (!currUser) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      setUser(currUser);

      // lock email to auth email
      setFormData(prev => ({ ...prev, email: currUser.email || '' }));

      // fetch existing buyer profile by auth_id OR email (legacy)
      const { data: existingProfile, error: selErr } = await supabase
        .from('buyers')
        .select('*')
        .or(`auth_id.eq.${currUser.id},email.eq.${currUser.email}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selErr) {
        console.warn('Buyer profile lookup error:', selErr.message);
      }

      if (mounted && existingProfile) {
        setExistingId(existingProfile.id);
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
    };

    load();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // keep everything controlled; allow empty string
    setFormData(prev => ({ ...prev, [name]: value ?? '' }));
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
    // validate required fields as non-empty strings
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

  // Upload media to Supabase Storage (if provided)
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

    // Require login to submit (but do NOT crash the page)
    const { data } = await supabase.auth.getUser();
    const currUser = data?.user || null;
    if (!currUser) {
      setErrorMessage('Please sign in to submit your profile.');
      return;
    }

    const { url: introUrl } = await uploadIntroMedia(currUser.id);

    // Build payload (strings stay strings; server can cast as needed)
    const payload = {
      auth_id: currUser.id,
      name: formData.name,
      email: formData.email || currUser.email,
      financing_type: formData.financingType,
      experience: formData.experience === '' ? null : Number(formData.experience),
      industry_preference: formData.industryPreference,
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

    // Route back to dashboard after a short tick (so toast can flash)
    setTimeout(() => router.replace('/buyer-dashboard'), 200);
  };

  // Simple unauth state: allow reading but indicate sign-in needed on submit
  const emailDisabled = !!user; // lock to auth email when logged in

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
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
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

          <div>
            <label className="block text-sm font-medium mb-1">Industry Preference</label>
            <input
              name="industryPreference"
              value={formData.industryPreference}
              onChange={handleChange}
              className="w-full border p-3 rounded text-black"
              placeholder="e.g., Home services, e-commerce"
            />
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
              <input
                name="stateOrProvince"
                value={formData.stateOrProvince}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
                placeholder="e.g., NY, ON"
              />
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Top Priority #1</label>
              <input
                name="priority_one"
                value={formData.priority_one}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
                placeholder="e.g., Cash flow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Top Priority #2</label>
              <input
                name="priority_two"
                value={formData.priority_two}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
                placeholder="e.g., Location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Top Priority #3</label>
              <input
                name="priority_three"
                value={formData.priority_three}
                onChange={handleChange}
                className="w-full border p-3 rounded text-black"
                placeholder="e.g., Hours"
              />
            </div>
          </div>

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
