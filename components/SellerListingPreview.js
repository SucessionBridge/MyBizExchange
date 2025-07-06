import React, { useState } from 'react';

export default function SellerListingPreview({
  formData,
  imagePreviews,
  onBack,
  onSubmit
}) {
  const {
    name,
    email,
    businessName,
    industry,
    location,
    annualRevenue,
    annualProfit,
    askingPrice,
    includesInventory,
    includesBuilding,
    financingType,
    businessDescription,
    aiGeneratedDescription
  } = formData;

  const [selectedDescription, setSelectedDescription] = useState(
    aiGeneratedDescription || businessDescription
  );
  const [selectedVersion, setSelectedVersion] = useState(
    aiGeneratedDescription ? 'ai' : 'original'
  );

  const handleSelectDescription = (desc, version) => {
    setSelectedDescription(desc);
    setSelectedVersion(version);
  };

  const handleSubmit = () => {
    const submissionData = {
      ...formData,
      businessDescription: selectedDescription,
      original_description: businessDescription,
      ai_description: aiGeneratedDescription || ""
    };
    onSubmit(submissionData);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6 mt-8">
      <h1 className="text-2xl font-bold mb-4">{businessName}</h1>
      <p className="text-sm text-gray-600 mb-4">{industry} • {location}</p>

      <div className="space-y-2">
        <p><strong>Owner Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Annual Revenue:</strong> ${annualRevenue}</p>
        <p><strong>Annual Profit:</strong> ${annualProfit}</p>
        <p><strong>Asking Price:</strong> ${askingPrice}</p>
        <p><strong>Includes Inventory:</strong> {includesInventory}</p>
        <p><strong>Includes Building:</strong> {includesBuilding}</p>
        <p><strong>Financing Type:</strong> {financingType}</p>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Business Description</h2>

        <div className={`border rounded-xl p-4 mb-4 ${selectedVersion === 'original' ? 'border-blue-500 bg-blue-50' : 'bg-gray-50'}`}>
          <p className="text-gray-700 whitespace-pre-line">{businessDescription}</p>
          <button
            onClick={() => handleSelectDescription(businessDescription, 'original')}
            className="mt-2 text-sm text-blue-600 underline"
          >
            Use this version
          </button>
        </div>

        {aiGeneratedDescription && (
          <div className={`border rounded-xl p-4 ${selectedVersion === 'ai' ? 'border-blue-500 bg-blue-50' : 'bg-green-50'}`}>
            <p className="text-gray-800 whitespace-pre-line italic">{aiGeneratedDescription}</p>
            <button
              onClick={() => handleSelectDescription(aiGeneratedDescription, 'ai')}
              className="mt-2 text-sm text-blue-600 underline"
            >
              Use this version
            </button>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          <strong>Selected:</strong> {selectedVersion === 'ai' ? 'AI-Generated Description' : 'Original Description'}
        </p>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Uploaded Photos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {imagePreviews.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Image ${i + 1}`}
              className="rounded-md border h-40 w-full object-cover"
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
        >
          Back to Edit
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit Listing
        </button>
      </div>
    </div>
  );
}
