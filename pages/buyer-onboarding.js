// pages/buyer-onboarding.js

import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import React, { useState, useEffect } from 'react';

export default function BuyerOnboarding() {
  const router = useRouter();
  const redirectPath = router.query.redirect || null;

  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
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
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setAuthUser(user);
        setFormData((prev) => ({ ...prev, email: user.email }));
      }
      setAuthChecked(true);
    };
    getUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value ?? '' }));
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, video: file }));
      const videoURL = URL.createObjectURL(file);
      setVideoPreview(videoURL);
    }
  };

  const validateForm = () => {
    const requiredFields = ['name', 'email', 'city', 'stateOrProvince'];
    for (let field of requiredFields) {
      if (!formData[field]) {
        setErrorMessage('Please fill in all the required fields.');
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const {
      name,
      email,
      financingType,
      experience,
      industryPreference,
      capitalInvestment,
      shortIntroduction,
      priorIndustryExperience,
      willingToRelocate,
      city,
      stateOrProvince,
      video,
      budgetForPurchase,
    } = formData;

    let videoUrl = null;
    if (video) {
      setIsUploading(true);
      const videoName = `buyer-video-${Date.now()}-${video.name}`;
      const { error: uploadError } = await supabase.storage
        .from('buyers-videos')
        .upload(videoName, video);

      setIsUploading(false);

      if (uploadError) {
        console.error('❌ Error uploading video:', uploadError);
        alert('There was a problem uploading your video.');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('buyers-videos')
        .getPublicUrl(videoName);

      videoUrl = publicUrlData?.publicUrl;
    }

    const { error: insertError } = await supabase.from('buyers').insert([{
      name,
      email,
      financing_type: financingType,
      experience,
      industry_preference: industryPreference,
      capital_investment: capitalInvestment,
      short_introduction: shortIntroduction,
      prior_industry_experience: priorIndustryExperience,
      willing_to_relocate: willingToRelocate,
      city,
      state_or_province: stateOrProvince,
      video_introduction: videoUrl,
      budget_for_purchase: budgetForPurchase,
    }]);

    if (insertError) {
      console.error('❌ Error submitting form:', insertError);
      alert('There was a problem submitting your form.');
    } else {
      alert('Your buyer profile was submitted successfully!');
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push('/listings');
      }
    }
  };

  return (
    <main className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Buyer Onboarding</h1>

        {isUploading && (
          <div className="text-center text-blue-600 font-medium mb-4">
            ⏳ Uploading video, please keep this browser window open…
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && <p className="text-red-500 font-semibold">{errorMessage}</p>}

          <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full border p-3 rounded text-black" />

          {/* Email shown as read-only from Supabase Auth */}
          <p className="bg-gray-100 p-3 rounded text-sm text-gray-700">
            Your email (from login): <strong>
              {authChecked ? authUser?.email || 'Not logged in' : 'Loading...'}
            </strong>
          </p>

          <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full border p-3 rounded text-black">
            <option value="self-financing">Self Financing</option>
            <option value="seller-financing">Seller Financing</option>
            <option value="rent-to-own">Rent-to-Own</option>
            <option value="third-party">3rd-Party Financing</option>
          </select>

          <input type="number" name="experience" min="1" max="5" value={formData.experience} onChange={handleChange} className="w-full border p-3 rounded text-black" />
          <input name="industryPreference" placeholder="Industry Preference" value={formData.industryPreference} onChange={handleChange} className="w-full border p-3 rounded text-black" />
          <input type="number" name="capitalInvestment" placeholder="Available Capital" value={formData.capitalInvestment} onChange={handleChange} className="w-full border p-3 rounded text-black" />
          <input type="number" name="budgetForPurchase" placeholder="Budget for Purchase" value={formData.budgetForPurchase} onChange={handleChange} className="w-full border p-3 rounded text-black" />
          <textarea name="shortIntroduction" value={formData.shortIntroduction} onChange={handleChange} placeholder="Short Introduction" rows="4" className="w-full border p-3 rounded text-black" />

          <select name="priorIndustryExperience" value={formData.priorIndustryExperience} onChange={handleChange} className="w-full border p-3 rounded text-black">
            <option value="No">Prior Industry Experience? No</option>
            <option value="Yes">Yes</option>
          </select>

          <select name="willingToRelocate" value={formData.willingToRelocate} onChange={handleChange} className="w-full border p-3 rounded text-black">
            <option value="No">Willing to Relocate? No</option>
            <option value="Yes">Yes</option>
          </select>

          <input name="city" placeholder="City" value={formData.city} onChange={handleChange} className="w-full border p-3 rounded text-black" />
          <input name="stateOrProvince" placeholder="State/Province" value={formData.stateOrProvince} onChange={handleChange} className="w-full border p-3 rounded text-black" />

          <label>Upload a short intro video (.mp4/.mov/.webm)</label>
          <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoUpload} className="w-full border p-3 rounded" />

          {isClient && videoPreview && (
            <video width="200" controls className="mt-4">
              <source src={videoPreview} type={formData.video?.type || 'video/mp4'} />
            </video>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 text-lg font-semibold">
            Submit Buyer Profile
          </button>
        </form>
      </div>
    </main>
  );
}
