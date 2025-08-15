// pages/buyer-onboarding.js
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';
import supabase from '../lib/supabaseClient';

// US States + Canadian Provinces/Territories
const REGIONS = [
  // US
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  // Canada
  { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' }, { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' }, { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' }, { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' }, { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' }, { code: 'YT', name: 'Yukon' }
];

function BuyerOnboardingInner() {
  const router = useRouter();
  const session = useSession(); // may be null during first paint or if user not logged in
  const user = session?.user || null;

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
    video: null,
    budgetForPurchase: '',
    priority_one: '',
    priority_two: '',
    priority_three: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Prefill email if session appears
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => (prev.email ? prev : { ...prev, email: user.email }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'willingToRelocate') {
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
  const uploadIntroMedia = async (userIdOrAnon) => {
    if (!formData.video) return { url: null, type: null };

    try {
      setIsUploading(true);
      const file = formData.video;
      const ext = file.name?.split('.').pop()?.toLowerCase() || (file.type.startsWith('image') ? 'jpg' : 'mp4');
      const kind = file.type.startsWith('image') ? 'image' : 'video';
      const path = `buyers/${userIdOrAnon}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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
    if (!validateForm()) return;

    // Resolve user lazily; proceed even if not logged in
    let localUser = user;
    if (!localUser) {
      const { data } = await supabase.auth.getUser();
      localUser = data?.user || null;
    }

    const emailValue = (formData.email || localUser?.email || '').trim();

    // 1) Upload media if provided (use 'anon' folder if no auth)
    const { url: introUrl } = await uploadIntroMedia(localUser?.id || 'anon');

    // 2) Manual upsert by email (works with/without auth)
    const payload = {
      auth_id: localUser?.id || null,
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

    // Try update by email; if none, insert
    const { data: existing, error: findErr } = await supabase
      .from('buyers')
      .select('id')
      .eq('email', emailValue)
      .maybeSingle();

    if (findErr) {
      console.error('Find buyer error', findErr);
      setErrorMessage('Could not save your profile right now.');
      return;
    }

    if (existing?.id) {
      const { error } = await supabase.from('buyers').update(payload).eq('id', existing.id);
      if (error) {
        console.error('Update buyer error', error);
        setErrorMessage('Could not update your profile right now.');
        return;
      }
      setSuccessMessage('Your profile has been updated.');
    } else {
      const { error } = await supabase.from('buyers').insert([payload]);
      if (error) {
        console.error('Insert buyer error', error);
        setErrorMessage('Could not create your profile right now.');
        return;
      }
      setSuccessMessage('Your profile has been created.');
    }

    // Let user see success, then redirect
    setTimeout(() => router.push('/buyer-dashboard'), 900);
  };

  return (
    <main className="min-h-screen bg-blue-50 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
          Buyer Onboarding
        </h1>

        {/* Trust banner – emphasize for seller financing */}
        <div className="mt-3 mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
          <p className="text-sm text-amber-900">
            <strong>Optional but recommended:</strong> add a short video or photo introduction.
            This is <em>only shared with sellers you contact</em>. It’s especially important if you’re requesting <strong>seller financing</strong>.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

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
              className={`w-full border p-3 rounded text-black ${user ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="you@example.com"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {user ? 'Email is set from your account.' : 'No account detected — you can type your email.'}
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
                <select
                  name="stateOrProvince"
                  value={formData.stateOrProvince}
                  onChange={handleChange}
                  className="w-full border p-3 rounded text-black"
                >
                  <option value="">Select State/Province (required)</option>
                  {REGIONS.map(r => (
                    <option key={r.code} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Willing to Relocate */}
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

            <p className="text-xs text-gray-500 mt-1">
              We use your location to match you with nearby listings (or relocation-friendly opportunities).
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
            <label className="block text-sm font-medium mb-1">
              Experience in Business Ownership (1–5)
            </label>
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
            {isUploading ? 'Uploading...' : 'Submit Buyer Profile'}
          </button>
        </form>
      </div>
    </main>
  );
}

// Client-only export eliminates hydration mismatches (React #418/#423)
export default dynamic(() => Promise.resolve(BuyerOnboardingInner), { ssr: false });


