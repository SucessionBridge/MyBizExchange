// pages/deal-maker.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

export default function DealMaker() {
  const router = useRouter();
  const { listingId } = router.query;

  const [listing, setListing] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Review & Send modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDealText, setReviewDealText] = useState('');
  const [ackConfirm, setAckConfirm] = useState(false);
  const [ackEquity, setAckEquity] = useState(false);

  useEffect(() => {
    if (!listingId) return;

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: listingData } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', listingId)
        .maybeSingle();
      setListing(listingData);

      const { data: buyerData } = await supabase
        .from('buyers')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();
      setBuyer(buyerData);
    };

    fetchData();
  }, [listingId, router]);

  const generateDeals = async () => {
    if (!listing || !buyer) return;

    setLoading(true);
    setError(null);
    setDeals([]);

    try {
      const res = await fetch('/api/generate-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // send your raw rows exactly as before
        body: JSON.stringify({ listing, buyer }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to generate deals.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      // Ensure we can split on "Deal N:" headings
      const rawDeals = (data.summary || '').split(/Deal \d:/).filter(Boolean);
      const formatted = rawDeals.map((d, i) => `Deal ${i + 1}:${d.trim()}`);
      setDeals(formatted);
    } catch (err) {
      console.error('❌ Deal generation error:', err);
      setError('Something went wrong while generating deals.');
    } finally {
      setLoading(false);
    }
  };

  // Open review modal instead of sending immediately
  const openReview = (dealText) => {
    setReviewDealText(dealText);
    setAckConfirm(false);
    setAckEquity(false);
    setReviewOpen(true);
  };

  const sendDealToSeller = async (dealText) => {
    if (!buyer || !listing) return;

    await supabase.from('messages').insert([
      {
        listing_id: listing.id,
        sender_id: buyer.auth_id,
        message: dealText,
        is_deal_proposal: true,
      },
    ]);

    alert('✅ Deal proposal sent to seller!');
    router.push(`/listings/${listing.id}`);
  };

  if (!listing || !buyer) {
    return <div className="p-8 text-center text-gray-600">Loading deal maker...</div>;
  }

  // Recap numbers so the buyer understands what they're sending
  const recap = computeRecap(listing, buyer);

  return (
    <main className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push(`/listings/${listing.id}`)}
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Back to Listing
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-8">
          AI Deal Maker
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Panel: Business Summary + Buyer Recap */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Creating proposals for:</h2>
            <p className="text-gray-700 mb-4">
              <strong>{listing.business_name || 'Business'}</strong><br />
              {(listing.city || listing.location_city) || '—'}, {(listing.state_or_province || listing.location_state) || '—'}
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
              <p><strong>Asking Price:</strong> {recap.money(recap.ask)}</p>
              <p><strong>Revenue:</strong> {listing.annual_revenue ? `$${Number(listing.annual_revenue).toLocaleString()}` : 'N/A'}</p>
              <p><strong>Profit:</strong> {listing.annual_profit ? `$${Number(listing.annual_profit).toLocaleString()}` : 'N/A'}</p>
              {listing.financing_type && (
                <p><strong>Financing:</strong> {listing.financing_type}</p>
              )}
            </div>

            {/* Buyer-side recap */}
            <div className="mt-4 bg-gray-50 border rounded-lg p-4 text-sm text-gray-700">
              <h3 className="font-semibold text-gray-900 mb-2">Your inputs</h3>
              <p><strong>Available Capital:</strong> {recap.money(recap.capital)}</p>
              <p><strong>Target Purchase Price:</strong> {recap.money(recap.offer)}</p>
              {recap.requiredDown !== null && (
                <>
                  <p><strong>Seller Required Down:</strong> {recap.money(recap.requiredDown)} {recap.downPct !== null ? `(${recap.downPct}%)` : ''}</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    {recap.downOk === true
                      ? 'Meets required down'
                      : recap.downOk === false
                      ? `Short by ~${recap.money(recap.downShort)}`
                      : 'Unknown'}
                  </p>
                </>
              )}
              {recap.gapPct !== null && (
                <p><strong>Gap vs Ask:</strong> ~{Math.abs(recap.gapPct)}% {recap.gapPct >= 0 ? 'under' : 'over'} ask</p>
              )}
              {recap.useBridge && (
                <p><strong>Suggested Structure:</strong> Bridge-to-bank ({recap.bridgeMonths} months interest-only, then balloon/refi)</p>
              )}
              {recap.equityCreditMonthly > 0 && (
                <p><strong>Down-Payment Credit:</strong> {recap.money(recap.equityCreditMonthly)}/mo up to {recap.money(recap.equityCreditCap)} (reduces balloon/principal; usually not counted as bank equity)</p>
              )}
            </div>
          </div>

          {/* Right Panel: AI Deal Builder */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col">
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {error}
              </div>
            )}

            <button
              onClick={generateDeals}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 mb-6"
            >
              {loading ? 'Generating Deals...' : 'Generate 3 Deal Options'}
            </button>

            {loading && (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
              </div>
            )}

            {deals.length > 0 && (
              <div className="space-y-6">
                {deals.map((deal, index) => (
                  <div key={index} className="bg-gray-50 p-5 rounded-lg shadow-inner">
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Deal Option {index + 1}</h3>
                    <pre className="whitespace-pre-wrap text-gray-800">{deal}</pre>
                    <button
                      onClick={() => openReview(deal)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full md:w-auto"
                    >
                      Review & Send to Seller
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review & Send Modal */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-5">
            <h3 className="text-xl font-semibold mb-3">Review what the seller will see</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3 bg-gray-50">
                <h4 className="font-semibold mb-2">Seller-facing message</h4>
                <div className="text-sm whitespace-pre-wrap">{reviewDealText}</div>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50 text-sm">
                <h4 className="font-semibold mb-2">Key terms (recap)</h4>
                <p><strong>Asking:</strong> {recap.money(recap.ask)}</p>
                <p><strong>Your target:</strong> {recap.money(recap.offer)}</p>
                <p><strong>Cash available now:</strong> {recap.money(recap.capital)}</p>
                {recap.requiredDown !== null && (
                  <>
                    <p><strong>Required down:</strong> {recap.money(recap.requiredDown)} {recap.downPct !== null ? `(${recap.downPct}%)` : ''}</p>
                    <p><strong>Shortfall:</strong> {recap.downOk === false ? `~${recap.money(recap.downShort)}` : (recap.downOk === true ? 'None' : 'Unknown')}</p>
                  </>
                )}
                {recap.useBridge && (
                  <>
                    <p><strong>Structure:</strong> Bridge-to-bank</p>
                    <p><strong>Interest-only period:</strong> {recap.bridgeMonths} months</p>
                    <p><strong>Balloon target:</strong> Month {recap.bridgeMonths}</p>
                  </>
                )}
                {recap.equityCreditMonthly > 0 && (
                  <>
                    <p><strong>Down-Payment Credit:</strong> {recap.money(recap.equityCreditMonthly)}/mo up to {recap.money(recap.equityCreditCap)}</p>
                    <p className="text-xs text-gray-600">Note: Credit reduces the balloon/principal; it usually does not count as bank equity.</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={ackConfirm}
                  onChange={(e) => setAckConfirm(e.target.checked)}
                  className="mt-0.5"
                />
                <span>I confirm this is what I intend to send to the seller.</span>
              </label>
              {recap.equityCreditMonthly > 0 && (
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={ackEquity}
                    onChange={(e) => setAckEquity(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I understand “payments credited toward down” reduce the balloon/principal and may not count as bank equity.
                  </span>
                </label>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setReviewOpen(false)}
                className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!ackConfirm) return;
                  if (recap.equityCreditMonthly > 0 && !ackEquity) return;
                  setReviewOpen(false);
                  sendDealToSeller(reviewDealText);
                }}
                className={`px-4 py-2 rounded text-white ${
                  ackConfirm && (recap.equityCreditMonthly > 0 ? ackEquity : true)
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-300 cursor-not-allowed'
                }`}
              >
                Send to Seller
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/** ------- helpers for recap (minimal, client-side) ------- */
function computeRecap(listing, buyer) {
  const num = (v) => (v === 0 || v) ? (Number.isFinite(Number(v)) ? Number(v) : null) : null;
  const money = (n) => (n == null ? 'N/A' : `$${Number(n).toLocaleString()}`);

  const ask = num(listing.asking_price);
  const offer =
    num(buyer.budget_for_purchase) ??
    num(buyer.target_purchase_price) ??
    num(buyer.offer_price);
  const capital =
    num(buyer.capital_investment) ??
    num(buyer.available_capital) ??
    num(buyer.capital);

  const downPct =
    num(listing.down_payment) ??
    num(listing.down_payment_pct) ??
    null;
  const requiredDown = (ask && downPct != null) ? Math.round((downPct / 100) * ask) : null;

  let downOk = null, downShort = null;
  if (requiredDown != null && capital != null) {
    downOk = capital >= requiredDown;
    downShort = downOk ? 0 : (requiredDown - capital);
  }

  let gapPct = null;
  if (ask && offer) {
    gapPct = Math.round(((ask - offer) / ask) * 100); // + = buyer under ask
  }

  const NEAR_GAP_PCT = 10, MOD_GAP_PCT = 25;
  let gapBucket = 'unknown';
  if (gapPct !== null) {
    const abs = Math.abs(gapPct);
    if (abs <= NEAR_GAP_PCT) gapBucket = 'near';
    else if (abs <= MOD_GAP_PCT) gapBucket = 'moderate';
    else gapBucket = 'far';
  }

  const useBridge = (downOk === false) || gapBucket === 'moderate' || gapBucket === 'far';
  let bridgeMonths = 18;
  if (useBridge && ask && downShort != null) {
    const shortPct = (downShort / ask) * 100;
    if (shortPct >= 10 || gapBucket === 'far') bridgeMonths = 24;
    else if (shortPct <= 5 && gapBucket === 'near') bridgeMonths = 12;
  }

  // Equity-credit suggestion if shortfall is modest (≤12% of price)
  let equityCreditMonthly = 0;
  let equityCreditCap = 0;
  if (useBridge && ask && requiredDown != null && capital != null) {
    const shortNow = Math.max(0, requiredDown - capital);
    const shortPctOfPrice = ask ? (shortNow / ask) * 100 : 0;
    if (shortNow > 0 && shortPctOfPrice <= 12) {
      equityCreditCap = shortNow; // cap to remaining shortfall
      equityCreditMonthly = bridgeMonths > 0 ? Math.ceil(shortNow / bridgeMonths) : 0;
    }
  }

  return {
    ask, offer, capital,
    downPct,
    requiredDown,
    downOk,
    downShort,
    gapPct,
    gapBucket,
    useBridge,
    bridgeMonths,
    equityCreditMonthly,
    equityCreditCap,
    money,
  };
}
