import { supabase } from '../lib/supabaseClient';
import React, { useState } from 'react';

export default function BuyerOnboarding() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    financingType: 'rent-to-own',
    location: '',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || '',
    }));
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        video: file,
      }));
      const videoURL = URL.createObjectURL(file);
      setVideoPreview(videoURL);
    }
  };

  const validateForm = () => {
    const required = ['name', 'email', 'location', 'city', 'stateOrProvince'];
    for (let field of required) {
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
    console.log('🔁 Submit clicked');

    if (!validateForm()) return;

    const {
      name,
      email,
      financingType,
      location,
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
      const fileName = `buyer-video-${Date.now()}-${video.name}`;
      const { error: uploadError } = await supabase.storage
        .from('buyer-videos')
        .upload(fileName, video);

      if (uploadError) {
        console.error('❌ Video upload failed:', uploadError);
        alert('Error uploading video.');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('buyer-videos')
        .getPublicUrl(fileName);

      videoUrl = publicUrlData?.publicUrl || null;
    }

    const { error: insertError } = await supabase.from('buyers').insert([
      {
        name,
        email,
        financing_type: financingType,
        location,
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
      },
    ]);

    if (insertError) {
      console.error('❌ Error submitting buyer:', insertError);
      alert('Something went wrong submitting your form.');
    } else {
      alert('✅ Buyer profile submitted successfully!');
      setFormData({
        name: '',
        email: '',
        financingType: 'rent-to-own',
        location: '',
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
      setVideoPreview(null);
    }
  };

  return (
    <main className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Buyer Onboarding</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && <p className="text-red-600">{errorMessage}</p>}

          <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required className="w-full border p-3 rounded" />
          <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" type="email" required className="w-full border p-3 rounded" />
          <input name="location" value={formData.location} onChange={handleChange} placeholder="General Location" required className="w-full border p-3 rounded" />

          <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full border p-3 rounded" />
          <input name="stateOrProvince" value={formData.stateOrProvince} onChange={handleChange} placeholder="State/Province" className="w-full border p-3 rounded" />

          <input type="number" name="experience" value={formData.experience} min="1" max="5" onChange={handleChange} placeholder="Business Experience (1-5)" className="w-full border p-3 rounded" />

          <input name="industryPreference" value={formData.industryPreference} onChange={handleChange} placeholder="Industry Preference" className="w-full border p-3 rounded" />
          <input type="number" name="capitalInvestment" value={formData.capitalInvestment} onChange={handleChange} placeholder="Available Capital" className="w-full border p-3 rounded" />
          <input type="number" name="budgetForPurchase" value={formData.budgetForPurchase} onChange={handleChange} placeholder="Budget for Purchase" className="w-full border p-3 rounded" />

          <textarea name="shortIntroduction" value={formData.shortIntroduction} onChange={handleChange} placeholder="Short Introduction" rows={4} className="w-full border p-3 rounded" />

          <select name="financingType" value={formData.financingType} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="rent-to-own">Rent-to-Own</option>
            <option value="seller-financing">Seller Financing</option>
            <option value="third-party">Third Party</option>
          </select>

          <select name="priorIndustryExperience" value={formData.priorIndustryExperience} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="No">Prior Industry Experience: No</option>
            <option value="Yes">Yes</option>
          </select>

          <select name="willingToRelocate" value={formData.willingToRelocate} onChange={handleChange} className="w-full border p-3 rounded">
            <option value="No">Willing to Relocate: No</option>
            <option value="Yes">Yes</option>
          </select>

          <label className="block font-medium">Video Introduction (optional):</label>
          <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoUpload} className="w-full border p-3 rounded" />
          {videoPreview && (
            <video controls width="300" className="mt-2">
              <source src={videoPreview} type="video/mp4" />
            </video>
          )}

          <button type="submit" className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700">Submit Buyer Profile</button>
        </form>
      </div>
    </main>
  );
}


