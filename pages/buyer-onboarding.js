// pages/buyer-onboarding.js
import { useRouter } from 'next/router';
import supabase from "../lib/supabaseClient";
import React, { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';

export default function BuyerOnboarding() {
  const router = useRouter();
  const session = useSession();

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
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingId, setExistingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const checkExistingProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      setFormData(prev => ({ ...prev, email: user.email }));

      const { data: existingProfile } = await supabase
        .from('buyers')
        .select('*')
        .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (existingProfile && mounted) {
        setAlreadySubmitted(true);
        setExistingId(existingProfile.id);
        setFormData(prev => ({
          ...prev,
          name: existingProfile.name || '',
          email: user.email,
          financingType: existingProfile.financing_type || 'self-financing',
          experience: existingProfile.experience || 3,
          industryPreference: existingProfile.industry_preference || '',
          capitalInvestment: existingProfile.capital_investment || '',
          shortIntroduction: existingProfile.short_introduction || '',
          priorIndustryExperience: existingProfile.prior_industry_experience || 'No',
          willingToRelocate: existingProfile.willing_to_relocate || 'No',
          city: existingProfile.city || '',
          stateOrProvince: existingProfile.state_or_province || '',
          budgetForPurchase: existingProfile.budget_for_purchase || '',
          priority_one: existingProfile.priority_one || '',
          priority_two: existingProfile.priority_two || '',
          priority_three: existingProfile.priority_three || ''
        }));
      }
    };
    checkExistingProfile();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ?? '' }));
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, video: file }));
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const requiredFields = ['name', 'email', 'city', 'stateOrProvince'];
    for (let field of requiredFields) {
      if (!formData[field]) {
        setErrorMessage('Please fill in all required fields.');
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('You must be logged in to submit.');

    const payload = {
      auth_id: user.id,
      name: formData.name,
      email: formData.email,
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
      priority_three: formData.priority_three
    };

    if (existingId) {
      await supabase.from('buyers').update(payload).eq('id', existingId);
    } else {
      await supabase.from('buyers').insert([payload]);
    }
    router.push('/buyer-dashboard');
  };

  return (
    <main className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {existingId ? 'Edit Buyer Profile' : 'Buyer Onboarding'}
        </h1>

        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input name="name" value={formData.name} onChange={handleChange}
              className="w-full border p-3 rounded text-black" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <p className="bg-gray-100 p-3 rounded text-sm text-gray-700">
              {formData.email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Financing Type</label>
            <select name="financingType" value={formData.financingType} onChange={handleChange}
              className="w-full border p-3 rounded text-black">
              <option value="self-financing">Self Financing</option>
              <option value="seller-financing">Seller Financing</option>
              <option value="rent-to-own">Rent-to-Own</option>
              <option value="third-party">3rd-Party Financing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Experience in Business Ownership (1–5)</label>
            <input type="number" name="experience" min="1" max="5" value={formData.experience}
              onChange={handleChange} className="w-full border p-3 rounded text-black" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Industry Preference</label>
            <input name="industryPreference" value={formData.industryPreference} onChange={handleChange}
              className="w-full border p-3 rounded text-black" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Available Capital</label>
              <input type="number" name="capitalInvestment" value={formData.capitalInvestment}
                onChange={handleChange} className="w-full border p-3 rounded text-black" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget for Purchase</label>
              <input type="number" name="budgetForPurchase" value={formData.budgetForPurchase}
                onChange={handleChange} className="w-full border p-3 rounded text-black" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Short Introduction</label>
            <textarea name="shortIntroduction" value={formData.shortIntroduction} onChange={handleChange}
              rows="3" className="w-full border p-3 rounded text-black"
              placeholder="Write 2–3 sentences about yourself and the type of business you want to buy." />
            <p className="text-xs text-gray-500 mt-1">Sellers see this first. Build trust and show your goals.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rank Your Top 3 Priorities</label>
            <p className="text-xs text-gray-500 mb-2">Select what matters most when buying a business. This helps us match you to listings.</p>
            <select name="priority_one" value={formData.priority_one} onChange={handleChange} className="w-full border p-3 rounded mb-2">
              <option value="">Select 1st Priority</option>
              <option value="price">Price</option>
              <option value="industry">Industry</option>
              <option value="location">Location</option>
            </select>
            <select name="priority_two" value={formData.priority_two} onChange={handleChange} className="w-full border p-3 rounded mb-2">
              <option value="">Select 2nd Priority</option>
              <option value="price">Price</option>
              <option value="industry">Industry</option>
              <option value="location">Location</option>
            </select>
            <select name="priority_three" value={formData.priority_three} onChange={handleChange} className="w-full border p-3 rounded">
              <option value="">Select 3rd Priority</option>
              <option value="price">Price</option>
              <option value="industry">Industry</option>
              <option value="location">Location</option>
            </select>
          </div>

         <div>
  <label className="block text-sm font-medium mb-1">Upload Intro Video or Photo</label>
  <input
    type="file"
    accept="video/*,image/*"
    onChange={handleVideoUpload}
    className="w-full border p-3 rounded"
  />
  <p className="text-xs text-gray-500 mt-1">
    Record a 30–60s video OR upload a clear photo. Sellers are more likely to trust buyers who show their face.
  </p>

  {videoPreview && (
    <div className="mt-3">
      {formData.video?.type?.startsWith('image') ? (
        <img src={videoPreview} alt="Preview" className="w-48 rounded border" />
      ) : (
        <video width="200" controls className="rounded border">
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


          <button type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 text-lg font-semibold">
            {existingId ? 'Update Buyer Profile' : 'Submit Buyer Profile'}
          </button>
        </form>
      </div>
    </main>
  );
}
 
