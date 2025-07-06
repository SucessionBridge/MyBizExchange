import React from 'react';

export default function SellerListingPreview({ formData, imagePreviews, onBack, onSubmit }) {
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
    businessDescription
  } = formData;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6 mt-8">
      <h1 className="text-2xl font-bold mb-4">{businessName}</h1>
      <p className="text-sm text-gray-600 mb-2">{industry} • {location}</p>

      <div className="mt-4">
        <p><strong>Owner Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Revenue:</strong> ${annualRevenue}</p>
        <p><strong>Profit:</strong> ${annualProfit}</p>
        <p><strong>Asking Price:</strong> ${askingPrice}</p>
        <p><strong>Includes Inventory:</strong> {includesInventory}</p>
        <p><strong>Includes Building:</strong> {includesBuilding}</p>
        <p><strong>Financing Option:</strong> {financingType}</p>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold">Business Description</h2>
        <p className="text-gray-700 mt-2 whitespace-pre-line">{businessDescription}</p>
      </div>

      {/* New AI Enhancement Link */}
      <div className="mt-4 text-center">
        <a
          href="/seller-wizard"
          className="inline-block text-sm bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          ✨ Enhance this listing with AI
        </a>
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
          onClick={onSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit Listing
        </button>
      </div>
    </div>
  );
}

