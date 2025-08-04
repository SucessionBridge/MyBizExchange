
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

export default function SellerWizard() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    business_name: '',
    hide_business_name: false,
    industry: '',
    location: '',
    years_in_business: '',
    number_of_employees: '',
    annual_gross_revenue: '',
    annual_expenses: '',
    owner_salary: '',
    discretionary_expenses: '',
    sde: '',
    asking_price: '',
    asking_price_includes_property: false,
    monthly_lease: '',
    home_based: false,
    relocatable: false,
    seller_financing_considered: false,
    financing_preference: '',
    down_payment: '',
    interest_rate: '',
    term_length: '',
    customers: '',
    competition: '',
    growth_opportunity: '',
    support_training: '',
    reason_for_sale: '',
    business_description: '',
    use_ai_description: true,
    ai_description: '',
    image_urls: [],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    setUploading(true);
    const files = e.target.files;
    const urls = [...formData.image_urls];

    for (let i = 0; i < files.length && urls.length < 8; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('seller-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('seller-images').getPublicUrl(filePath);
      urls.push(data.publicUrl);
    }

    setFormData((prev) => ({ ...prev, image_urls: urls }));
    setUploading(false);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    const sde = calculateSDE();
    const payload = {
      ...formData,
      sde,
    };

    const response = await fetch('/api/submit-seller-listing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setUploading(false);

    if (response.ok) {
      router.push('/thank-you');
    } else {
      setError(data.error || 'An unexpected error occurred.');
    }
  };

  const calculateSDE = () => {
    const revenue = parseFloat(formData.annual_gross_revenue) || 0;
    const expenses = parseFloat(formData.annual_expenses) || 0;
    const ownerSalary = parseFloat(formData.owner_salary) || 0;
    const discretionary = parseFloat(formData.discretionary_expenses) || 0;
    return revenue - expenses + ownerSalary + discretionary;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Contact & Business Basics</h2>
            <label className="block mb-2">Your Name
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Your Email
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Business Name
              <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-4">
              <input type="checkbox" name="hide_business_name" checked={formData.hide_business_name} onChange={handleChange} />
              Hide Business Name from Public Listing
            </label>
            <label className="block mb-2">Industry
              <input type="text" name="industry" value={formData.industry} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Location (City, State or Region)
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Years in Business
              <input type="number" name="years_in_business" value={formData.years_in_business} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-4">Number of Employees
              <input type="number" name="number_of_employees" value={formData.number_of_employees} onChange={handleChange} className="input" />
            </label>
          </>
        );
      case 2:
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Financials</h2>
            <label className="block mb-2">Annual Gross Revenue
              <input type="number" name="annual_gross_revenue" value={formData.annual_gross_revenue} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Annual Expenses
              <input type="number" name="annual_expenses" value={formData.annual_expenses} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Owner Salary
              <input type="number" name="owner_salary" value={formData.owner_salary} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Discretionary Expenses
              <input type="number" name="discretionary_expenses" value={formData.discretionary_expenses} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Asking Price
              <input type="number" name="asking_price" value={formData.asking_price} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-4">
              <input type="checkbox" name="asking_price_includes_property" checked={formData.asking_price_includes_property} onChange={handleChange} />
              Asking Price Includes Real Estate
            </label>
            <label className="block mb-2">Monthly Lease Amount
              <input type="number" name="monthly_lease" value={formData.monthly_lease} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-4">
              <input type="checkbox" name="home_based" checked={formData.home_based} onChange={handleChange} />
              This is a Home-Based Business
            </label>
            <label className="block mb-4">
              <input type="checkbox" name="relocatable" checked={formData.relocatable} onChange={handleChange} />
              This Business is Relocatable
            </label>
          </>
        );
    }
  };
      case 3:
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Financing & Sale Terms</h2>
            <label className="block mb-4">
              <input type="checkbox" name="seller_financing_considered" checked={formData.seller_financing_considered} onChange={handleChange} />
              Seller Financing Considered
            </label>
            <label className="block mb-2">Financing Preference
              <select name="financing_preference" value={formData.financing_preference} onChange={handleChange} className="input">
                <option value="">Select</option>
                <option value="buyer financed">Buyer Financed</option>
                <option value="seller financed">Seller Financed</option>
                <option value="rent to own">Rent to Own</option>
              </select>
            </label>
            <label className="block mb-2">Down Payment Amount
              <input type="number" name="down_payment" value={formData.down_payment} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Interest Rate (%)
              <input type="number" name="interest_rate" value={formData.interest_rate} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-4">Term Length (months)
              <input type="number" name="term_length" value={formData.term_length} onChange={handleChange} className="input" />
            </label>
          </>
        );
      case 4:
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Operations & Opportunity</h2>
            <label className="block mb-2">Customer Base
              <textarea name="customers" value={formData.customers} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Competition
              <textarea name="competition" value={formData.competition} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Growth Opportunities
              <textarea name="growth_opportunity" value={formData.growth_opportunity} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Support & Training You’ll Provide
              <textarea name="support_training" value={formData.support_training} onChange={handleChange} className="input" />
            </label>
            <label className="block mb-2">Reason for Sale
              <textarea name="reason_for_sale" value={formData.reason_for_sale} onChange={handleChange} className="input" />
            </label>

            <label className="block mb-4">
              <input type="checkbox" name="use_ai_description" checked={formData.use_ai_description} onChange={handleChange} />
              Use AI to Generate Business Description
            </label>

            {!formData.use_ai_description && (
              <label className="block mb-4">Business Description (Manual)
                <textarea name="business_description" value={formData.business_description} onChange={handleChange} className="input" />
              </label>
            )}

            {formData.use_ai_description && (
              <label className="block mb-4">AI Description (Auto-Generated)
                <textarea name="ai_description" value={formData.ai_description} onChange={handleChange} className="input" readOnly />
              </label>
            )}

            <label className="block mb-2">Upload Business Photos (max 8)
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.image_urls.map((url, i) => (
                <img key={i} src={url} alt={`upload-${i}`} className="w-24 h-24 object-cover border rounded" />
              ))}
            </div>
          </>
        );
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };
  const renderPreview = () => (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">{formData.industry || 'Business'} for Sale</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p><strong>Location:</strong> {formData.location}</p>
          <p><strong>Years in Business:</strong> {formData.years_in_business}</p>
          <p><strong>Employees:</strong> {formData.number_of_employees}</p>
          <p><strong>Home-Based:</strong> {formData.home_based ? 'Yes' : 'No'}</p>
          <p><strong>Relocatable:</strong> {formData.relocatable ? 'Yes' : 'No'}</p>
          <p><strong>Monthly Lease:</strong> {formData.monthly_lease || 'N/A'}</p>
        </div>
        <div>
          <p><strong>Gross Revenue:</strong> ${formData.annual_gross_revenue}</p>
          <p><strong>Expenses:</strong> ${formData.annual_expenses}</p>
          <p><strong>Owner Salary:</strong> ${formData.owner_salary}</p>
          <p><strong>Discretionary:</strong> ${formData.discretionary_expenses}</p>
          <p><strong>SDE:</strong> ${formData.sde}</p>
          <p><strong>Asking Price:</strong> ${formData.asking_price}</p>
          <p><strong>Includes Property:</strong> {formData.asking_price_includes_property ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Customer Base</h3>
        <p>{formData.customers}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Competition</h3>
        <p>{formData.competition}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Growth Opportunity</h3>
        <p>{formData.growth_opportunity}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Support & Training</h3>
        <p>{formData.support_training}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Reason for Sale</h3>
        <p>{formData.reason_for_sale}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Business Description</h3>
        {formData.use_ai_description ? (
          <p>{formData.ai_description}</p>
        ) : (
          <p>{formData.business_description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {formData.image_urls.map((url, i) => (
          <img key={i} src={url} alt={`business-${i}`} className="w-full h-32 object-cover rounded" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      {showPreview ? (
        <div>
          {renderPreview()}
          <button
            onClick={() => setShowPreview(false)}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Back to Edit
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-white p-6 rounded shadow mb-6">{renderStep()}</div>

          <div className="flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Back
              </button>
            )}
            {currentStep < 4 && (
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Next
              </button>
            )}
          </div>

          {currentStep === 4 && (
            <div className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded"
              >
                Preview My Listing
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded"
                disabled={uploading}
              >
                {uploading ? 'Submitting...' : 'Submit Listing'}
              </button>
            </div>
          )}

          {error && <p className="text-red-500 mt-4">{error}</p>}
        </form>
      )}
    </div>
  );
}
