// pages/listings/[id].js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import supabase from '../../lib/supabaseClient';
import GrowthSimulator from '../../components/GrowthSimulator';

const currency = (n) =>
  typeof n === 'number'
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
    : n;

const toNum = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

const ts = (iso) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [buyerLoading, setBuyerLoading] = useState(true);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasThread, setHasThread] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const lastMessage = useMemo(() => (messages && messages.length ? messages[0] : null), [messages]);

  const [composerMsg, setComposerMsg] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [sending, setSending] = useState(false);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [emailing, setEmailing] = useState(false);

  // Fetch listing
  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('sellers').select('*').eq('id', id).single();
      if (active) {
        if (error) {
          console.error('Error loading listing', error);
          setListing(null);
        } else {
          setListing(data);
        }
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  // Fetch user & buyer row
  useEffect(() => {
    let active = true;
    (async () => {
      setBuyerLoading(true);
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) console.error('auth.getUser error', userErr);
      const authUser = userData?.user || null;
      if (!active) return;

      setUser(authUser);

      if (!authUser) {
        setBuyer(null);
        setBuyerLoading(false);
        return;
      }

      // Try by auth_id then fallback by email
      let buyerRow = null;
      if (authUser?.id) {
        const { data: byAuth, error: buyerErr1 } = await supabase
          .from('buyers')
          .select('*')
          .eq('auth_id', authUser.id)
          .maybeSingle();
        if (buyerErr1) console.error('buyers by auth_id error', buyerErr1);
        if (byAuth) buyerRow = byAuth;
      }
      if (!buyerRow && authUser?.email) {
        const { data: byEmail, error: buyerErr2 } = await supabase
          .from('buyers')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();
        if (buyerErr2) console.error('buyers by email error', buyerErr2);
        if (byEmail) buyerRow = byEmail;
      }
      setBuyer(buyerRow || null);
      setBuyerLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Fetch thread messages for this buyer+listing
  const fetchMessages = async (b, listingId) => {
    if (!b?.email || !listingId) {
      setMessages([]);
      setHasThread(false);
      setMessageCount(0);
      return;
    }
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('buyer_email', b.email)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('load messages error', error);
        setMessages([]);
        setHasThread(false);
        setMessageCount(0);
      } else {
        setMessages(data || []);
        setHasThread((data || []).length > 0);
        setMessageCount((data || []).length);
      }
    } catch (e) {
      console.error('load messages exception', e);
      setMessages([]);
      setHasThread(false);
      setMessageCount(0);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (!buyerLoading && !loading) {
      fetchMessages(buyer, id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerLoading, loading, id]);

  // Saved listing state
  const checkSaved = async () => {
    if (!listing || (!user && !buyer)) return;
    setSaving(true);
    try {
      const q = supabase.from('saved_listings').select('*').eq('listing_id', listing.id);
      let resp;
      if (user?.id) {
        resp = await q.eq('buyer_auth_id', user.id).maybeSingle();
      } else if (buyer?.email) {
        resp = await q.eq('buyer_email', buyer.email).maybeSingle();
      } else {
        setSaved(false);
        setSaving(false);
        return;
      }
      const { data, error } = resp;
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = No rows found
        console.error('checkSaved error', error);
      }
      setSaved(!!data);
    } catch (e) {
      console.error('checkSaved exception', e);
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!loading && !buyerLoading) {
      checkSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, buyerLoading]);

  const toggleSave = async () => {
    if (!listing) return;
    if (!user && !buyer) {
      alert('Please log in and complete your buyer profile to save listings.');
      return;
    }
    setSaving(true);
    try {
      if (!saved) {
        // Insert
        const payload = { listing_id: listing.id };
        if (user?.id) payload.buyer_auth_id = user.id;
        if (buyer?.email) payload.buyer_email = buyer.email;
        const { error } = await supabase.from('saved_listings').insert(payload);
        if (error) throw error;
        setSaved(true);
      } else {
        // Delete by composite
        let del = supabase.from('saved_listings').delete().eq('listing_id', listing.id);
        if (user?.id) del = del.eq('buyer_auth_id', user.id);
        else if (buyer?.email) del = del.eq('buyer_email', buyer.email);
        const { error } = await del;
        if (error) throw error;
        setSaved(false);
      }
    } catch (e) {
      console.error('toggleSave error', e);
      alert('Sorry, there was a problem updating your saved listings.');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailMe = async () => {
    if (!listing) return;
    if (!buyer?.email) {
      alert('Please log in and complete your buyer profile so we can email this listing to you.');
      return;
    }
    setEmailing(true);
    try {
      const { error } = await supabase.from('email_requests').insert({
        buyer_email: buyer.email,
        listing_id: listing.id,
      });
      if (error) throw error;
      alert('We will email this listing to you shortly!');
    } catch (e) {
      console.error('email_me error', e);
      alert('Sorry, could not queue the email. Please try again.');
    } finally {
      setEmailing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!buyer || !buyer.email) {
      alert('Please complete your buyer profile before contacting the seller.');
      return;
    }
    if (!composerMsg.trim()) {
      alert('Please enter a message.');
      return;
    }
    setSending(true);
    try {
      // Seller email heuristic
      const sellerEmail =
        listing?.seller_email ||
        listing?.contact_email ||
        listing?.email ||
        null;

      const fd = new FormData();
      fd.append('message', composerMsg);
      fd.append('topic', 'business-inquiry');
      fd.append('extension', 'successionbridge');
      fd.append('listing_id', String(listing.id));
      fd.append('buyer_name', buyer?.name || '');
      fd.append('buyer_email', buyer?.email || '');
      if (sellerEmail) fd.append('seller_email', sellerEmail);

      // Include first file if any (support multi by appending all)
      if (files && files.length > 0) {
        // append all, but at least first works with existing API
        Array.from(files).forEach((file, idx) => {
          fd.append(idx === 0 ? 'file' : `file_${idx + 1}`, file);
        });
      }

      const res = await fetch('/api/send-message', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const t = await res.text();
        console.error('send-message failed', t);
        throw new Error('Failed to send message');
      }

      alert('Message sent!');
      setComposerMsg('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh thread state
      await fetchMessages(buyer, id);
    } catch (err) {
      console.error('handleSendMessage error', err);
      alert('Sorry, there was a problem sending your message.');
    } finally {
      setSending(false);
    }
  };

  const heroImage = useMemo(() => {
    const arr = listing?.image_urls || [];
    return Array.isArray(arr) && arr.length ? arr[0] : null;
  }, [listing]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6" />
        <div className="h-64 w-full bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link href="/listings" className="text-blue-600 hover:underline">
          ← Back to listings
        </Link>
        <h1 className="text-2xl font-semibold mt-6">Listing not found.</h1>
      </div>
    );
  }

  const locationText =
    listing?.location ||
    [listing?.city, listing?.state_or_province].filter(Boolean).join(', ') ||
    '';

  const aiDescription = listing?.ai_description || '';
  const businessDescription = listing?.business_description || '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/listings" className="text-blue-600 hover:underline">
        ← Back to listings
      </Link>

      {/* Hero */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {heroImage ? (
            <img
              src={heroImage}
              alt={listing.business_name || 'Business'}
              className="w-full h-72 object-cover rounded-xl border"
            />
          ) : (
            <div className="w-full h-72 bg-gray-100 rounded-xl border flex items-center justify-center text-gray-500">
              No image available
            </div>
          )}
        </div>
        <div className="md:col-span-1">
          <div className="p-5 border rounded-xl shadow-sm bg-white">
            <h1 className="text-xl font-semibold">{listing.business_name || 'Business for Sale'}</h1>
            {locationText ? <p className="text-gray-600 mt-1">{locationText}</p> : null}
            <div className="mt-4 space-y-2">
              {listing.asking_price != null ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">Asking Price</span>
                  <span className="font-medium">{currency(toNum(listing.asking_price))}</span>
                </div>
              ) : null}
              {listing.annual_revenue != null ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">Annual Revenue</span>
                  <span className="font-medium">{currency(toNum(listing.annual_revenue))}</span>
                </div>
              ) : null}
              {listing.annual_profit != null || listing.sde != null ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">{listing.sde != null ? 'SDE' : 'Annual Profit'}</span>
                  <span className="font-medium">
                    {currency(toNum(listing.sde != null ? listing.sde : listing.annual_profit))}
                  </span>
                </div>
              ) : null}
              {listing.financing_type ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">Financing</span>
                  <span className="font-medium">{listing.financing_type}</span>
                </div>
              ) : null}
              {listing.seller_financing_considered ? (
                <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1 inline-block">
                  Seller financing considered
                </div>
              ) : null}
            </div>
          </div>

          {/* Broker Card (if present) */}
          {listing.broker_id ? (
            <div className="p-5 border rounded-xl shadow-sm bg-white mt-4">
              <h3 className="font-semibold">Listed by Broker</h3>
              <p className="text-sm text-gray-600 mt-1">Broker ID: {listing.broker_id}</p>
              {listing.website ? (
                <a href={listing.website} target="_blank" rel="noreferrer" className="text-blue-600 text-sm mt-2 inline-block">
                  Visit Website →
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Contact Seller */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="p-5 border rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contact Seller</h2>
              <button
                onClick={() => router.push(`/deal-maker?listingId=${encodeURIComponent(id)}`)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                title="AI Enhanced Deal Maker"
              >
                🤝 Propose Deal
              </button>
            </div>

            {/* Access / Profile Gate — UPDATED */}
            {buyerLoading ? (
              <div className="mt-4 p-4 border border-gray-200 bg-gray-50 text-gray-700 rounded">
                Checking your access…
              </div>
            ) : !user ? (
              <div className="mt-4 p-4 border border-red-200 bg-red-50 text-red-800 rounded">
                Please log in to contact the seller.
                <div className="mt-3">
                  <a
                    href="/login"
                    className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Login
                  </a>
                </div>
              </div>
            ) : !buyer ? (
              <div className="mt-4 p-4 border border-amber-200 bg-amber-50 text-amber-900 rounded">
                You’re logged in, but you still need to complete your buyer profile to message the seller.
                <div className="mt-3">
                  <a
                    href="/buyer-onboarding"
                    className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Complete Buyer Profile
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Banner */}
                <div
                  className={`mt-4 p-4 rounded border ${
                    hasThread
                      ? 'bg-blue-50 border-blue-100 text-blue-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {hasThread ? (
                    <div>
                      <p className="font-medium">
                        You already have a conversation on this listing. Messages you send here will be added to that thread.
                      </p>
                      {lastMessage ? (
                        <div className="mt-2 text-sm flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/70 border text-gray-700">
                            {lastMessage.from_seller ? 'Seller' : 'You'}
                          </span>
                          <span className="truncate flex-1">
                            {String(lastMessage.message || '').replace(/\s+/g, ' ').slice(0, 120)}
                            {String(lastMessage.message || '').length > 120 ? '…' : ''}
                          </span>
                          <span className="text-gray-600 shrink-0">{ts(lastMessage.created_at)}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="font-medium">This will start a new conversation with the seller.</p>
                  )}
                </div>

                {/* Composer */}
                <form onSubmit={handleSendMessage} className="mt-4">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Your message
                  </label>
                  <textarea
                    id="message"
                    className="mt-1 w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={4}
                    placeholder="Introduce yourself and share why you're interested…"
                    value={composerMsg}
                    onChange={(e) => setComposerMsg(e.target.value)}
                    disabled={sending}
                  />
                  {/* Attachments toggle */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setAttachOpen((v) => !v)}
                      className="text-blue-700 hover:text-blue-900 text-sm"
                    >
                      {attachOpen ? 'Hide attachments' : 'Attach files (optional)'}
                    </button>
                    {attachOpen ? (
                      <div className="mt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                          onChange={(e) => setFiles(e.target.files)}
                          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                          disabled={sending}
                        />
                        {files && files.length ? (
                          <div className="mt-2 text-xs text-gray-600">
                            {Array.from(files).map((f, i) => (
                              <div key={i} className="truncate">
                                • {f.name}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Buttons Row */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sending ? 'Sending…' : 'Send Message'}
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/deal-maker?listingId=${encodeURIComponent(id)}`)}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                    >
                      🤝 Propose Deal
                    </button>

                    <button
                      type="button"
                      onClick={toggleSave}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {saving ? (saved ? 'Unsaving…' : 'Saving…') : saved ? 'Unsave Listing' : 'Save Listing'}
                    </button>

                    <button
                      type="button"
                      onClick={handleEmailMe}
                      disabled={emailing}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {emailing ? 'Emailing…' : 'Email Me This Listing'}
                    </button>

                    <Link
                      href={`/messages?listingId=${encodeURIComponent(id)}&buyerEmail=${encodeURIComponent(buyer?.email || '')}`}
                      className="text-blue-700 hover:text-blue-900 text-sm inline-flex items-center gap-2 ml-auto"
                    >
                      💬 View Full Conversation
                      <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] text-xs px-2 rounded-full bg-gray-200 text-gray-800">
                        {messagesLoading ? '…' : messageCount}
                      </span>
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="md:col-span-1">
          <div className="p-5 border rounded-xl bg-white shadow-sm">
            <h3 className="font-semibold">Financial Highlights</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Asking</dt>
                <dd className="font-medium">{currency(toNum(listing.asking_price)) || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Revenue</dt>
                <dd className="font-medium">{currency(toNum(listing.annual_revenue)) || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">{listing.sde != null ? 'SDE' : 'Profit'}</dt>
                <dd className="font-medium">
                  {listing.sde != null
                    ? currency(toNum(listing.sde))
                    : currency(toNum(listing.annual_profit)) || '—'}
                </dd>
              </div>
              {listing.monthly_lease != null ? (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Monthly Lease</dt>
                  <dd className="font-medium">{currency(toNum(listing.monthly_lease))}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </div>

      {/* Growth & Value Simulator */}
      <div className="mt-8 p-5 border rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Growth & Value Simulator</h2>
          <button
            onClick={() => router.push(`/deal-maker?listingId=${encodeURIComponent(id)}`)}
            className="text-green-700 hover:text-green-900"
            title="AI Enhanced Deal Maker"
          >
            Launch AI Enhanced Deal Maker →
          </button>
        </div>
        <div className="mt-4">
          <GrowthSimulator
            askingPrice={toNum(listing.asking_price)}
            annualRevenue={toNum(listing.annual_revenue)}
            sde={toNum(listing.sde ?? listing.annual_profit)}
          />
        </div>
      </div>

      {/* Description */}
      {(aiDescription || businessDescription) && (
        <div className="mt-8 p-5 border rounded-xl bg-white shadow-sm">
          <h2 className="text-lg font-semibold">Business Description</h2>
          {aiDescription ? (
            <div className="mt-2 whitespace-pre-line leading-relaxed text-gray-800">{aiDescription}</div>
          ) : null}
          {!aiDescription && businessDescription ? (
            <div className="mt-2 whitespace-pre-line leading-relaxed text-gray-800">{businessDescription}</div>
          ) : null}
        </div>
      )}

      {/* Details */}
      <div className="mt-8 p-5 border rounded-xl bg-white shadow-sm">
        <h2 className="text-lg font-semibold">Business Details</h2>
        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {locationText ? (
            <div className="flex justify-between">
              <dt className="text-gray-500">Location</dt>
              <dd className="font-medium">{locationText}</dd>
            </div>
          ) : null}
          {listing.website ? (
            <div className="flex justify-between">
              <dt className="text-gray-500">Website</dt>
              <dd className="font-medium truncate">
                <a href={listing.website} className="text-blue-700 hover:underline" target="_blank" rel="noreferrer">
                  {listing.website}
                </a>
              </dd>
            </div>
          ) : null}
          {listing.financing_type ? (
            <div className="flex justify-between">
              <dt className="text-gray-500">Financing Type</dt>
              <dd className="font-medium">{listing.financing_type}</dd>
            </div>
          ) : null}
          {listing.ad_id ? (
            <div className="flex justify-between">
              <dt className="text-gray-500">Ad #</dt>
              <dd className="font-medium">{listing.ad_id}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {/* Additional Photos */}
      {Array.isArray(listing.image_urls) && listing.image_urls.length > 1 ? (
        <div className="mt-8 p-5 border rounded-xl bg-white shadow-sm">
          <h2 className="text-lg font-semibold">Additional Photos</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {listing.image_urls.slice(1).map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Photo ${idx + 2}`}
                className="w-full h-40 object-cover rounded-lg border"
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Footer Actions */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button
          onClick={() => router.push(`/deal-maker?listingId=${encodeURIComponent(id)}`)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          🤝 Propose Deal
        </button>
        <button
          onClick={toggleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? (saved ? 'Unsaving…' : 'Saving…') : saved ? 'Unsave Listing' : 'Save Listing'}
        </button>
        <button
          onClick={handleEmailMe}
          disabled={emailing}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        >
          {emailing ? 'Emailing…' : 'Email Me This Listing'}
        </button>
      </div>
    </div>
  );
}

