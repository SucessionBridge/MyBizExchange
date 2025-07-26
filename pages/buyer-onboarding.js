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
  const [existingId, setExistingId] = useState(null); // ✅ Track existing profile ID
useEffect(() => {
  const checkExistingProfile = async () => {
    // ✅ Use session immediately for instant email display
    if (session?.user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: session.user.email }));
    }

    const { data: { user } } = await supabase.auth.getUser();
    const currentUser = user || session?.user;

    console.log("DEBUG currentUser:", currentUser);

    if (!currentUser) return; // No user logged in

    const { data: existingProfile } = await supabase
      .from('buyers')
      .select('*')
      .eq('auth_id', currentUser.id)
      .maybeSingle();

    if (existingProfile) {
      setAlreadySubmitted(true);
      setExistingId(existingProfile.id);

      setFormData(prev => ({
        ...prev,
        name: existingProfile.name || '',
        email: currentUser.email || prev.email,
        financingType: existingProfile.financing_type || 'self-financing',
        experience: existingProfile.experience || 3,
        industryPreference: existingProfile.industry_preference || '',
        capitalInvestment: existingProfile.capital_investment || '',
        shortIntroduction: existingProfile.short_introduction || '',
        priorIndustryExperience: existingProfile.prior_industry_experience || 'No',
        willingToRelocate: existingProfile.willing_to_relocate || 'No',
        city: existingProfile.city || '',
        stateOrProvince: existingProfile.state_or_province || '',
        video: null,
        budgetForPurchase: existingProfile.budget_for_purchase || '',
        priority_one: existingProfile.priority_one || '',
        priority_two: existingProfile.priority_two || '',
        priority_three: existingProfile.priority_three || ''
      }));
    }
  };

  checkExistingProfile();
}, [session]);


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

    const { data: { user } } = await supabase.auth.getUser();

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
      priority_one,
      priority_two,
      priority_three
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

    const payload = {
      auth_id: user.id,
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
      priority_one,
      priority_two,
      priority_three
    };

    let dbError;
    if (existingId) {
      // ✅ Update existing profile
      const { error } = await supabase
        .from('buyers')
        .update(payload)
        .eq('id', existingId);
      dbError = error;
    } else {
      // ✅ Insert new profile
      const { error } = await supabase.from('buyers').insert([payload]);
      dbError = error;
    }

    if (dbError) {
      console.error('❌ Error submitting form:', dbError);
      alert('There was a problem saving your profile.');
    } else {
      alert('✅ Buyer profile saved successfully!');
      router.push('/buyer-dashboard');
    }
  };

  return (
    <main className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {existingId ? 'Edit Buyer Profile' : 'Buyer Onboarding'}
        </h1>

        {isUploading && (
          <div className="text-center text-blue-600 font-medium mb-4">
            ⏳ Uploading video, please keep this browser window open…
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && <p className="text-red-500 font-semibold">{errorMessage}</p>}

          <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="w-full border p-3 rounded text-black" />
          <p className="bg-gray-100 p-3 rounded text-sm text-gray-700">
            Your email: <strong>{formData.email || 'Loading...'}</strong>
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

          {/* ✅ Priority Selection */}
          <div className="space-y-4">
            <label className="block font-medium">Rank Your Top 3 Priorities</label>
            <select name="priority_one" value={formData.priority_one} onChange={handleChange} className="w-full border p-3 rounded text-black">
              <option value="">Select 1st Priority</option>
              <option value="price">Price</option>
              <option value="industry">Industry</option>
              <option value="location">Location</option>
            </select>

            <select name="priority_two" value={formData.priority_two} onChange={handleChange} className="w-full border p-3 rounded text-black">
              <option value="">Select 2nd Priority</option>
              <option value="price">Price</option>
              <option value="industry">Industry</option>
              <option value="location">Location</option>
            </select>

            <select name="priority_three" value={formData.priority_three} onChange={handleChange} className="w-full border p-3 rounded text-black">
              <option value="">Select 3rd Priority</option>
              <option value="price">Price</option>
              <option value="industry">Industry</option>
              <option value="location">Location</option>
            </select>
          </div>

          <label>Upload a short intro video (.mp4/.mov/.webm)</label>
          <input type="file" accept="video/*" onChange={handleVideoUpload} className="w-full border p-3 rounded" />

          {videoPreview && (
            <video width="200" controls className="mt-4">
              <source src={videoPreview} />
            </video>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 text-lg font-semibold">
            {existingId ? 'Update Buyer Profile' : 'Submit Buyer Profile'}
          </button>
        </form>
      </div>
    </main>
  );
}
