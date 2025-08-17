// pages/listings/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import supabase from '../../lib/supabaseClient'; // ✅ Fixed path
import GrowthSimulator from '../../components/GrowthSimulator';

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [listing, setListing] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [attachment, setAttachment] = useState(null); // Add attachment state

  // ✅ NEW: saved state + guard against double-clicks
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toTitleCase = (str) =>
    str
      ? str
          .toLowerCase()
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : '';

  useEffect(() => {
    if (!id) return;
    fetchListing();
    fetchBuyerProfile();
  }, [id]);

  async function fetchListing() {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading listing:', error);
    } else {
      setListing(data);
    }
  }

  async function fetchBuyerProfile() {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setLoading(false);
      return;
    }

    let { data: buyerData } = await supabase
      .from('buyers')
      .select('*')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (!buyerData) {
      const { data: emailMatch } = await supabase
        .from('buyers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();
      buyerData = emailMatch;
    }

    if (buyerData) setBuyer(buyerData);
    setLoading(false);
  }

  // ✅ NEW: once we know buyer + id, check if already saved
  useEffect(() => {
    if (!id || !buyer) return;

    const listingId = Number(id);
    const listingFilter = Number.isFinite(listingId) ? listingId : id;

    (async () => {
      const { data, error } = await supabase
        .from('saved_listings')
        .select('id')
        .eq('listing_id', listingFilter)
        .or(`buyer_auth_id.eq.${buyer.auth_id},buyer_email.eq.${buyer.email}`)
        .maybeSingle();

      if (error) {
        // Not fatal; just means we can’t pre-mark it
        console.debug('Check saved failed:', error.message);
        setIsSaved(false);
      } else {
        setIsSaved(!!data);
      }
    })();
  }, [id, buyer]);

  // Parse AI description into titled sections
  function parseDescriptionSections(description) {
    if (!description) return [];

    const lines = description
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const sections = [];
    let currentSection = { title: '', content: '' };

    lines.forEach((line) => {
      if (line.endsWith(':')) {
        if (currentSection.title) sections.push(currentSection);
        currentSection = { title: line.slice(0, -1), content: '' };
      } else {
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    });

    if (currentSection.title) sections.push(currentSection);

    return sections;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message || !buyer || !listing) return;

    const formData = new FormData();
    formData.append('message', message);

    // ✅ Do NOT send seller_id; let API resolve by email if you have it
    if (listing.email) formData.append('seller_email', listing.email);

    formData.append('listing_id', listing.id);
    formData.append('buyer_name', buyer.name || buyer.full_name || buyer.email);
    formData.append('buyer_email', buyer.email);
    formData.append('topic', 'business-inquiry');
    formData.append('extension', 'successionbridge');

    if (attachment) formData.append('attachment', attachment);

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ send-message failed:', result);
        alert(result?.error || 'Message failed to send.');
      } else {
        alert('✅ Message sent to the seller!');
        setMessage('');
        setAttachment(null);
        setSuccess(true);
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      alert('Something went wrong.');
    }
  }

  // ✅ REPLACED: toggle save/unsave with upsert + delete (legacy-safe)
  async function toggleSave() {
    if (saving) return;
    setSaving(true);

    // Need current auth to set buyer_auth_id or allow delete via RLS
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user || null;

    if (!authUser || !buyer) {
      alert('You must be logged in as a buyer to save listings.');
      setSaving(false);
      return;
    }

    const listingId = Number(id);
    const listingValue = Number.isFinite(listingId) ? listingId : id;

    try {
      if (isSaved) {
        // Unsave: allow delete by auth_id OR (legacy) email
        const { error } = await supabase
          .from('saved_listings')
          .delete()
          .eq('listing_id', listingValue)
          .or(`buyer_auth_id.eq.${authUser.id},buyer_email.eq.${buyer.email}`);

        if (error) throw error;
        setIsSaved(false);
        alert('✅ Listing removed from your saved items.');
      } else {
        // Save: upsert + onConflict to dedupe
        const payload = {
          listing_id: listingValue,
          buyer_email: buyer.email,
          buyer_auth_id: authUser.id,
        };

        const { error } = await supabase
          .from('saved_listings')
          .upsert([payload], { onConflict: 'buyer_auth_id,listing_id' });

        if (error) throw error;
        setIsSaved(true);
        alert('✅ Listing saved to your profile.');
      }
    } catch (error) {
      console.error(isSaved ? 'Unsave failed:' : 'Save failed:', error);
      alert(isSaved ? "Couldn't remove this listing." : "Couldn't save this listing.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailMe() {
    if (!buyer || !buyer.email) {
      alert('You must be logged in to receive listings by email.');
      return;
    }

    const { error } = await supabase.from('email_requests').insert([
      { buyer_email: buyer.email, listing_id: id }
    ]);

    if (error) {
      console.error('Email request failed:', error);
      alert('There was a problem sending this listing by email.');
    } else {
      alert('✅ This listing will be emailed to you.');
    }
  }

  if (!id || loading) return <div className="p-8 text-center text-gray-600">Loading...</div>;
  if (!listing) return <div className="p-8 text-center text-gray-600">Listing not found.</div>;

  const mainImage =
    listing.image_urls?.length > 0 ? listing.image_urls[0] : '/placeholder-listing.jpg';
  const otherImages = listing.image_urls?.slice(1) || [];

  // 🔢 Helper to sanitize numbers coming from DB (handles "267,630" or "$267,630")
  const toNum = (v) => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v.replace(/[^0-9.-]/g, ''));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  return (
    <main className="bg-gray-50 min-h-screen pb-16 font-sans">
      <div className="max-w-5xl mx-auto px-4">
        <a
          href="/listings"
          className="inline-block mt-6 mb-8 text-sm text-blue-600 hover:underline"
        >
          ← Back to Marketplace
        </a>

        {/* Hero */}
        <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden shadow-lg">
          <img src={mainImage} alt="Business" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-8">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-lg">
              {toTitleCase(
                listing.hide_business_name
                  ? 'Confidential Business Listing'
                  : listing.business_name || `${listing.industry} Business`
              )}
            </h1>
            <p className="bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm font-mono inline-block mt-2">
              Ad ID: {listing.ad_id}
            </p>
            <p className="text-gray-100 text-lg mt-1">{toTitleCase(listing.location)}</p>

            {/* ✅ Save toggle in hero (optional, keeps your old button too) */}
            {buyer && (
              <div className="mt-3">
                <button
                  onClick={toggleSave}
                  disabled={saving}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
                    isSaved ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                  }`}
                >
                  {isSaved ? '★ Saved — Click to Unsave' : '☆ Save Listing'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Financial Highlights */}
        <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
          <h2 className="text-3xl font-serif font-semibold text-[#1E3A8A] mb-6 border-b-2 border-[#F59E0B] pb-2">
            Financial Highlights
          </h2>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="text-3xl md:text-4xl font-bold text-emerald-700">
              Asking Price: {listing.asking_price ? `$${toNum(listing.asking_price).toLocaleString()}` : 'Inquire'}
            </div>

            {(listing.seller_financing_considered === 'yes' || listing.seller_financing_considered === 'maybe') && (
              <span className="mt-4 md:mt-0 inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded border border-green-200">
                💰 Seller Financing Terms Available on Request
              </span>
            )}
            {listing.seller_financing_considered &&
              ['yes', 'maybe'].includes(String(listing.seller_financing_considered).toLowerCase()) && (
                <span className="mt-4 md:mt-0 inline-block bg-green-50 text-green-800 text-sm font-semibold px-3 py-1 rounded border border-green-200">
                  Seller Financing Possible
                </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-gray-800">
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">Annual Revenue</p>
              <p className="text-lg font-bold">{listing.annual_revenue ? `$${toNum(listing.annual_revenue).toLocaleString()}` : 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">Annual Profit</p>
              <p className="text-lg font-bold">{listing.annual_profit ? `$${toNum(listing.annual_profit).toLocaleString()}` : 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">SDE</p>
              <p className="text-lg font-bold">{listing.sde ? `$${toNum(listing.sde).toLocaleString()}` : 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">Inventory Value</p>
              <p className="text-lg font-bold">{listing.inventory_value ? `$${toNum(listing.inventory_value).toLocaleString()}` : 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">Equipment Value</p>
              <p className="text-lg font-bold">{listing.equipment_value ? `$${toNum(listing.equipment_value).toLocaleString()}` : 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">Employees</p>
              <p className="text-lg font-bold">{listing.employees || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* 📈 Growth & Value Simulator */}
        <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
          <h2 className="text-3xl font-serif font-semibold text-[#1E3A8A] mb-4">
            Growth & Value Simulator
          </h2>
          <p className="text-gray-700 mb-4">
            See how modest revenue growth can increase SDE and potential exit value over time.
            Buyers often price on earnings × a multiple.
          </p>
          <GrowthSimulator
            baseRevenue={toNum(listing.annual_revenue)}
            baseSDE={toNum(listing.sde ?? listing.annual_profit)}
            defaultGrowthPct={5}
            defaultYears={3}
            defaultMultiple={2.5}
          />
        </section>

        {/* Business Description */}
        <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
          <h2 className="text-3xl font-serif font-semibold text-[#1E3A8A] mb-4 border-b-2 border-[#F59E0B] pb-2">
            Business Description
          </h2>
          {listing.description_choice === 'ai' && listing.ai_description ? (
            parseDescriptionSections(listing.ai_description).map(({ title, content }, i) => (
              <section key={i} className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="whitespace-pre-line text-gray-800 leading-relaxed">{content}</p>
              </section>
            ))
          ) : (
            <p className="text-gray-800 leading-relaxed text-lg">
              {listing.business_description || 'No description available.'}
            </p>
          )}
        </section>

        {/* Business Details */}
        <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
          <h2 className="text-3xl font-serif font-semibold text-[#1E3A8A] mb-4 border-b-2 border-[#F59E0B] pb-2">
            Business Details
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-800">
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">Monthly Lease</p>
              <p className="text-lg font-bold">{listing.monthly_lease ? `$${toNum(listing.monthly_lease).toLocaleString()}` : 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">Home-Based</p>
              <p className="text-lg font-bold">{listing.home_based ? 'Yes' : 'No'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">Relocatable</p>
              <p className="text-lg font-bold">{listing.relocatable ? 'Yes' : 'No'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">Years in Business</p>
              <p className="text-lg font-bold">{listing.years_in_business || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs uppercase text-gray-500 font-semibold">Financing Type</p>
              <p className="text-lg font-bold">{listing.financing_type?.replace(/-/g, ' ') || 'N/A'}</p>
            </div>

            {/* Website - show only if logged-in buyer */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm md:col-span-2">
              <p className="text-xs uppercase text-gray-500 font-semibold">Website</p>
              {buyer ? (
                listing.website ? (
                  <p className="text-lg font-bold">
                    <a
                      href={listing.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {listing.website}
                    </a>
                  </p>
                ) : (
                  <p className="text-lg font-bold italic text-gray-500">Website not provided</p>
                )
              ) : (
                <p className="text-lg font-bold italic text-red-600">
                  Login to view website details
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Additional Photos */}
        {otherImages.length > 0 && (
          <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
            <h2 className="text-3xl font-serif font-semibold text-[#1E3A8A] mb-4 border-b-2 border-[#F59E0B] pb-2">
              Additional Photos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {otherImages.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Business ${idx + 2}`}
                  className="w-full h-44 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = '/placeholder-listing.jpg';
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* AI Enhanced Deal Maker */}
        {buyer && (
          <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
            <h2 className="text-3xl font-serif font-semibold text-[#1E3A8A] mb-4">
              AI Enhanced Deal Maker
            </h2>
            <p className="text-gray-700 mb-4">
              Use AI to structure a creative offer (seller financing, rent-to-own, profit share, etc.)
              based on this business’s details.
            </p>
            <button
              onClick={() => router.push(`/deal-maker?listingId=${id}`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Launch Deal Builder
            </button>
          </section>
        )}

        {/* Buyer Actions */}
        {buyer ? (
          <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
            <h2 className="text-3xl font-serif font-semibold text-[#1E3A8A] mb-4">Contact Seller</h2>
            {success ? (
              <p className="text-green-600">✅ Your message was sent!</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                  rows="5"
                  placeholder="Write your message to the seller..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                  onChange={(e) => setAttachment(e.target.files[0])}
                  className="block mt-2"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                  >
                    Send Message
                  </button>
                  <button
                    onClick={toggleSave}
                    type="button"
                    disabled={saving}
                    className="bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg border"
                  >
                    {isSaved ? 'Unsave' : 'Save Listing'}
                  </button>
                  <button
                    onClick={handleEmailMe}
                    type="button"
                    className="bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg border"
                  >
                    Email Me This Listing
                  </button>
                </div>
              </form>
            )}
          </section>
        ) : (
          <section className="bg-white rounded-2xl shadow-md p-8 mt-10">
            <p className="text-red-600">
              You must{' '}
              <a
                href={`/buyer-onboarding?redirect=/listings/${id}`}
                className="underline font-semibold"
              >
                complete your buyer profile
              </a>{' '}
              before contacting the seller.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
