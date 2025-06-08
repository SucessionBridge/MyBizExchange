import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import React, { useState } from "react";

export default function BuyerOnboarding() {
  const router = useRouter();
  const redirectPath = router.query.redirect || null;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    financingType: "self-financing",
    experience: 3,
    industryPreference: "",
    capitalInvestment: "",
    shortIntroduction: "",
    priorIndustryExperience: "No",
    willingToRelocate: "No",
    city: "",
    stateOrProvince: "",
    video: null,
    budgetForPurchase: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value ?? "" }));
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
    const requiredFields = ["name", "email", "city", "stateOrProvince"];
    for (let field of requiredFields) {
      if (!formData[field]) {
        setErrorMessage("Please fill in all the required fields.");
        return false;
      }
    }
    setErrorMessage("");
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
        console.error("❌ Error uploading video:", uploadError);
        alert("There was a problem uploading your video.");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('buyers-videos')
        .getPublicUrl(videoName);

      videoUrl = publicUrlData?.publicUrl;
    }

    const { error: insertError } = await supabase.from('buyers').insert([
      {
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
      },
    ]);

    if (insertError) {
      console.error("❌ Error submitting form:", insertError);
      alert("There was a problem submitting your form.");
    } else {
      alert("Your buyer profile was submitted successfully!");

      // If redirect path exists, go there
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        // Reset form and stay on page
        setFormData({
          name: "",
          email: "",
          financingType: "self-financing",
          experience: 3,
          industryPreference: "",
          capitalInvestment: "",
          shortIntroduction: "",
          priorIndustryExperience: "No",
          willingToRelocate: "No",
          city: "",
          stateOrProvince: "",
          video: null,
          budgetForPurchase: "",
        });
        setVideoPreview(null);
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

          {/* Form fields remain unchanged */}
          {/* ... */}

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 text-lg font-semibold">
            Submit Buyer Profile
          </button>
        </form>
      </div>
    </main>
  );
}
