// pages/buyer-onboarding.js
import { useRouter } from 'next/router';
import supabase from "../lib/supabaseClient";
import React, { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';

export default function BuyerOnboarding() {
  const router = useRouter();
  const session = useSession();
  const user = session?.user || null;

  // Prevent SSR/client hydration mismatches
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    financingType: 'self-financing',
    experience: 3,
    industryPreference: '',
    capitalInvestment: '',
    shortIntroduction: '',
    priorIndustryExperience: 'No',
    willingToRelocate: 'No',
    city: '',
    stateOrProvince: '',
    video: null, // can be video OR image file
    budgetForPurchase: '',
    priority_one: '',
    priority_two: '',
    priority_three: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingId, setExistingId] = useState(null);

  // Prefill from session + fetch existing profile when user is present
  useEffect(() => {
    let mounted = true;
    const hydrateFromUser = async () => {
      if (!user || !mounted) return;

      // seed email from auth (keeps input controlled even while disabled)
      setFormData(prev => ({ ...prev, email: user.email || prev.email || '' }));

      const { data: existingProfile, error } = await supabase
        .from('buyers')
        .select('*')
        .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (error) {
        console.error('buyers select error', error);
        return;
      }

      if (existingProfile && mounted) {
        setAlreadySubmitted(true);
        setExistingId(existingProfile.id);
        setFormData(prev => ({
          ...prev,
          name: existingProfile.name || '',
          email: user.email || existingProfile.email || '',
          financingType: existingProfile.financing_type || 'self-financing',
          experience: existingProfile.experience ?? 3,
          industryPreference: existingProfile.industry_preference || '',
          capitalInvestment: existingProfile.capital_investment ?? '',
          shortIntroduction: existingProfile.short_introduction || '',
          priorIndustryExperience: existingProfile.prior_industry_experience || 'No',
          willingToRelocate: existingProfile.willing_to_relocate || 'No',
          city: existingProfile.city || '',
          stateOrProvince: existingProfile.state_or_province || '',
          budgetForPurchase: existingProfile.budget_for_purchase ?? '',
          priority_one: existingProfile.priority_one || '',
          priority_two: existingProfile.priority_two || '',
          priority_three: existingProfile.priority_three || ''
        }));
      }
    };
    hydrateFromUser();
    return () => { mounted = false; };
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'willingToRelocate' && type === 'checkbox') {
      setFormData(prev => ({ ...prev, willingToRelocate: checked ? 'Yes' : 'No' }));
      return;
    }
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

  // Require fields that are actually rendered: name, email, and State/Province for location matching
  const validateForm = () => {
    const emailValue = String(formData.email || user?.email || '').trim();
    const nameValue = String(formData.name ?? '').trim();
    const stateValue = String(formData.stateOrProvince ?? '').trim();

    if (!nameValue || !emailValue || !stateValue) {
      setErrorMessage('Please fill in all required fields.');
      return false;
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
      const ext = file.name?.split('.').pop()?.toLowerCase() || (file.type.startsWith('image') ? 'jpg' : 'mp4');
      const kind = file.type.startsWith('image') ? 'image' : 'video';
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
      return { url: pub.publicUrl || null, type: kind };
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Gate on session user (avoid flaky getUser())
    if (!user) {
      setErrorMessage('Please sign in to submit your profile.');
      return;
    }
    if (!validateForm()) return;

    const emailValue = (formData.email || user.email || '').trim();

    // 1) Upload media if provided
    const { url: introUrl } = await uploadIntroMedia(user.id);

    // 2) Build payload
    const payload = {
      auth_id: user.id,
      name: formData.name,
      email: emailValue,
      financing_type: formData.financingType,
      experience: formData.experience,
      industry_preference: formData.industryPreference,
      capital_investment: formData.capitalInvestment,
      short_introduction: formData.shortIntroduction,
      prior_industry_experience: formData.priorIndustryExperience,
      willing_to_relocate: formData.willingToRelocate,
      city: formData.city,
      state_or_province: formData.stateOrProvince,
      budget_for_purchase: formData.budgetForPurchase,
      priority_one: formData.priority_one,
      priority_two: formData.priority_two,
      priority_three: formData.priority_three,
      intro_video_url: introUrl || null,
    };

    // 3) Save/update profile
    if (existingId) {
      const { error } = await supabase.from('buyers').update(payload).eq('id', existingId);
      if (error) {
        console.error(error);
        setErrorMessage('Could not update your profile right now.');
        return;
      }
    } else {
      const { error } = await supabase.from('buyers').insert([payload]);
      if (error) {
        console.error(error);
        setErrorMessage('Could not create your profile right now.');
        return;
      }
    }

    router.push('/buyer-dashboard');
  };

  // Avoid hydration mismatch: render a stable shell until mounted
  if (!isClient) {
    return <main className="min-h-screen bg-blue-50 p-6 sm:p-8" />;
  }

  // If no session, show a friendly prompt (prevents confusing submit attempts)
  const showLoginNotice = !user;

  return (
    <main className="min-h-screen bg-blue-50 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
          {existingId ? 'Edit Buyer Profile' : 'Buyer Onboarding'}
        </h1>

        {/* Trust banner – emphasize for seller financing */}
        <div className="mt-3 mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
          <p className="text-sm text-amber-900">
            <strong>Optional but recommended:</strong> add a short video or photo introduction.
            This is <em>only shared with sellers you contact</em>. It’s especially important if you’re requesting <strong>seller financing</strong>—sellers want to know who they’re trusting with their business.
          </p>
        </div>

        {showLoginNotice && (
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            Please sign in before submitting your buyer profile.
          </div>
        )}

        {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border p-3 rounded text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={user?.email || formData.email}
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              disabled={!!user}
              className={`w-full border p-3 rounded text-black ${
                user ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="you@example.com"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {user
                ? 'Email is set from your account.'
                : 'No account detected — you can type your email.'}
            </p>
          </div>

          {/* Preferred Location */}
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Location</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border p-3 rounded text-black"
                  placeholder="City (optional)"
                />
              </div>
              <div>
                <input
                  name="stateOrProvince"
                  value={formData.stateOrProvince}
                  onChange={handleChange}
                  className="w-full border p-3 rounded text-black"
                  placeholder="State/Province (required)"
                />
              </div>
            </div>

            {/* Willing to Relocate checkbox */}
            <div className="mt-3 flex items-center gap-2">
              <input
                id="wtr"
                type="checkbox"
                name="willingToRelocate"
                checked={formData.willingToRelocate === 'Yes'}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <label htmlFor="wtr" className="text-sm">I’m willing to relocate</label>
            </div>

            <p className="text-xs text-gray-500 mt-1">We use this to match you with nearby listings (or relocation-friendly opportunities).</p>
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
              placeholder="Write 2–3 sentences about yourself and the type of business you want to buy."
            />
            <p className="text-xs text-gray-500 mt-1">Sellers see this first. Build trust and show your goals.</p>
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
                <em className="block">Tip: If you’re pursuing seller financing, this really helps.</em>
              </p>
            </div>

            {videoPreview && (
              <div className="mt-3">
                {formData.video?.type?.startsWith('image') ? (
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
            {isUploading
              ? 'Uploading...'
              : existingId ? 'Update Buyer Profile' : 'Submit Buyer Profile'}
          </button>
        </form>
      </div>
    </main>
  );
}


