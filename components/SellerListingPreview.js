import React from 'react';

export default function SellerListingPreview({ formData, onBack, onSubmit }) {
  if (!formData) return null;

  const {
    businessName,
    industry,
    location,
    description,
    askingPrice,
    annualRevenue,
    annualProfit,
    images,
  } = formData;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6 mt-8">
      <h1 className="text-2xl font-bold mb-4">{businessName}</h1>
      <p className="text-sm text-gray-600 mb-2">{industry} • {location}</p>

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Business Description</h2>
          <p className="text-gray-700">{description}</p>

          <div className="mt-4">
            <p><strong>Asking Price:</strong> ${askingPrice}</p>
            <p><strong>Annual Revenue:</strong> ${annualRevenue}</p>
            <p><strong>Annual Profit:</strong> ${annualProfit}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Photos</h2>
          <div className="grid grid-cols-2 gap-2">
            {images?.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Business image ${i + 1}`}
                className="rounded-md border"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
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
