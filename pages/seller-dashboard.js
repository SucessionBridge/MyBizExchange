// pages/seller-dashboard.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

/* ------------ helper: who/colour for SELLER view (original core) ------------ */
function whoAndColorForSeller(msg, sellerAuthId) {
  if (msg.from_seller === true)  return { who: "You",   color: "bg-green-100 text-green-900" };
  if (msg.from_seller === false) return { who: "Buyer", color: "bg-blue-100 text-blue-900" };

  const fromMe =
    msg?.seller_id && sellerAuthId &&
    String(msg.seller_id).toLowerCase() === String(sellerAuthId).toLowerCase();

  return fromMe
    ? { who: "You",   color: "bg-green-100 text-green-900" }
    : { who: "Buyer", color: "bg-blue-100 text-blue-900" };
}

const convKey = (listingId, buyerEmail) =>
  `${listingId}__${(buyerEmail || 'unknown').toLowerCase()}`;

const ATTACH_BUCKET = 'message-attachments';

const QUICK_TEMPLATES = [
  "Thanks for your interest! When would you like to chat?",
  "Happy to share more details. What questions do you have?",
  "We’re considering seller financing. Tell me a bit about your experience and timeline.",
  "Can you share your background and what attracts you to this business?"
];

/* --------------------- localStorage: 'last seen' timestamps ------------------ */
const seenStorage = {
  key: 'seller_seen_v1',
  getAll() {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(this.key) || '{}'); }
    catch { return {}; }
  },
  setAll(map) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(this.key, JSON.stringify(map)); } catch {}
  },
  markNow(key) {
    const all = this.getAll();
    all[key] = new Date().toISOString();
    this.setAll(all);
    return all[key];
  },
  get(key) {
    return this.getAll()[key];
  }
};

/* ------------------------- localStorage: archive flags ----------------------- */
const archiveStorage = {
  key: 'seller_archived_v1',
  getAll() {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(this.key) || '{}'); }
    catch { return {}; }
  },
  setAll(map) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(this.key, JSON.stringify(map)); } catch {}
  },
  isArchived(key) {
    return !!this.getAll()[key];
  },
  toggle(key) {
    const all = this.getAll();
    all[key] = !all[key];
    this.setAll(all);
    return all[key];
  }
};

/* ---------------------- calendar helpers (client-only) ----------------------- */
function pad(n){ return String(n).padStart(2,'0'); }
function fmtLocal(dt){
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    const date = new Date(dt);
    const dateStr = date.toLocaleString([], { dateStyle:'medium', timeStyle:'short' });
    return `${dateStr} (${tz})`;
  } catch { return new Date(dt).toString(); }
}
function toGCalDateRangeUTC(start, minutes=30) {
  const s = new Date(start);
  const e = new Date(s.getTime() + minutes*60000);
  const enc = (d) =>
    d.getUTCFullYear().toString()
    + pad(d.getUTCMonth()+1) + pad(d.getUTCDate())
    + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  return `${enc(s)}/${enc(e)}`;
}
function gcalLink({ title, start, minutes=30, details, location }) {
  const dates = toGCalDateRangeUTC(start, minutes);
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${encodeURIComponent(dates)}${details ? `&details=${encodeURIComponent(details)}`:''}${location ? `&location=${encodeURIComponent(location)}`:''}`;
  return url;
}

/* ------------------------------ main component ------------------------------ */
export default function SellerDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [sellerEmail, setSellerEmail] = useState(null);

  const [sellerListings, setSellerListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // One composer per (listing, buyer)
  const [replyText, setReplyText] = useState({});
  const [replyFiles, setReplyFiles] = useState({});
  const [openQuickReplyFor, setOpenQuickReplyFor] = useState(null);

  // Filters/search (added Archived tab)
  const [filterTab, setFilterTab] = useState('all'); // all | unreplied | hasfiles | archived
  const [search, setSearch] = useState('');

  // Calendar modal state
  const [calKey, setCalKey] = useState(null); // convKey or null
  const [calSlots, setCalSlots] = useState(() => defaultThreeSlots());
  const [calDuration, setCalDuration] = useState(30);
  const [calTitle, setCalTitle] = useState('Intro call');

  // Simple “AI” (smart template) draft
  const [draftingFor, setDraftingFor] = useState(null);

  // Realtime
  const channelsRef = useRef([]);

  /* ---------------------------- Auth & Listings ---------------------------- */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      setSellerEmail(data.user.email || null);
    })();
  }, [router]);

  useEffect(() => {
    if (!sellerEmail) return;

    (async () => {
      setLoadingListings(true);
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('email', sellerEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch seller listings:', error.message);
        setSellerListings([]);
      } else {
        setSellerListings(data || []);
      }
      setLoadingListings(false);
    })();
  }, [sellerEmail]);

  /* ------------------------------ Messages load ----------------------------- */
  useEffect(() => {
    const ids = (sellerListings || []).map((l) => l.id).filter(Boolean);
    if (ids.length === 0) {
      setMessages([]);
      setLoadingMessages(false);
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
      return;
    }

    (async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('listing_id', ids)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch messages:', error.message);
        setMessages([]);
      } else {
        setMessages(data || []);
      }
      setLoadingMessages(false);
    })();

    // Realtime (INSERT)
    channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    channelsRef.current = ids.map((lid) => {
      const ch = supabase
        .channel(`seller-messages-${lid}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `listing_id=eq.${lid}` },
          (payload) => {
            const m = payload.new;
            setMessages((prev) => (prev.some(x => x.id === m.id) ? prev : [...prev, m]));
          }
        )
        .subscribe();
      return ch;
    });

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [sellerListings]);

  /* ----------------------- Grouped threads & stats ------------------------- */
  const groupedByListingBuyer = useMemo(() => {
    const map = {};
    for (const msg of messages) {
      const lid = msg.listing_id;
      if (!lid) continue;
      const buyer = (msg.buyer_email || 'Unknown').toLowerCase();

      if (!map[lid]) map[lid] = {};
      if (!map[lid][buyer]) map[lid][buyer] = [];
      map[lid][buyer].push(msg);
    }
    Object.keys(map).forEach((lid) => {
      Object.keys(map[lid]).forEach((buyer) => {
        map[lid][buyer].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    });
    return map;
  }, [messages]);

  const listingIds = useMemo(() => Object.keys(groupedByListingBuyer), [groupedByListingBuyer]);

  const listingStats = useMemo(() => {
    const stats = {};
    for (const lid of listingIds) {
      const buyersMap = groupedByListingBuyer[lid] || {};
      const buyerKeys = Object.keys(buyersMap);
      const uniqueBuyers = buyerKeys.length;
      let awaiting = 0;
      buyerKeys.forEach((bk) => {
        const thread = buyersMap[bk];
        const last = thread[thread.length - 1];
        if (!last?.from_seller) awaiting += 1;
      });
      stats[lid] = { uniqueBuyers, awaiting };
    }
    return stats;
  }, [groupedByListingBuyer, listingIds]);

  /* --------------------------- Composer helpers ---------------------------- */
  function onPickFiles(listingId, buyerEmail, e) {
    const files = Array.from(e.target.files || []);
    const key = convKey(listingId, buyerEmail);
    setReplyFiles((prev) => ({ ...prev, [key]: files.slice(0, 5) }));
  }
  function handleDrop(listingId, buyerEmail, e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    const key = convKey(listingId, buyerEmail);
    setReplyFiles((prev) => ({ ...prev, [key]: files.slice(0, 5) }));
  }
  function allowDrop(e) { e.preventDefault(); }

  async function sendReply(listingId, buyerEmail) {
    try {
      if (!sellerEmail || !user) return;
      const key = convKey(listingId, buyerEmail);
      const text = (replyText[key] || '').trim();
      const files = replyFiles[key] || [];
      if (!text && files.length === 0) return;

      const buyerKey = (buyerEmail || 'Unknown').toLowerCase();
      const thread = groupedByListingBuyer[listingId]?.[buyerKey] || [];
      const knownBuyerMsg =
        [...thread].reverse().find(m => m.buyer_name && m.buyer_name.trim()) || thread[0];
      const buyerName = knownBuyerMsg?.buyer_name?.trim() || buyerEmail || 'Buyer';

      let attachments = [];
      if (files.length > 0) {
        for (const file of files) {
          const isImage = file.type?.startsWith('image/');
          const isVideo = file.type?.startsWith('video/');
          if (!isImage && !isVideo) continue;

          const safeName = file.name.replace(/[^\w.\-]+/g, '_');
          const path = `listing-${listingId}/seller-${sellerEmail}/${Date.now()}-${safeName}`;
          const { error: upErr } = await supabase.storage
            .from(ATTACH_BUCKET)
            .upload(path, file, { cacheControl: '3600', upsert: false });
          if (upErr) {
            console.error('Upload failed:', upErr);
            alert('Attachment upload failed. Please try again or remove the file(s).');
            return;
          }
          attachments.push({
            path,
            name: file.name,
            size: file.size,
            mime: file.type,
            kind: isImage ? 'image' : 'video',
          });
        }
      }

      const { error: insertErr } = await supabase.from('messages').insert([{
        listing_id: listingId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        seller_id: user.id,
        message: text,
        topic: 'business-inquiry',
        is_deal_proposal: false,
        attachments,
        from_seller: true,
      }]);

      if (insertErr) {
        console.error('Insert message failed:', insertErr);
        alert(insertErr.message || 'Sending failed. Please try again.');
        return;
      }

      setReplyText((prev) => ({ ...prev, [key]: '' }));
      setReplyFiles((prev) => ({ ...prev, [key]: [] }));
      seenStorage.markNow(key);
    } catch (err) {
      console.error('sendReply crashed:', err);
      alert('Something went wrong while sending. Please try again.');
    }
  }

  /* --------------------------- Filter / Search ----------------------------- */
  function threadMatchesFilters(thread, key) {
    const isArchived = archiveStorage.isArchived(key);
    if (filterTab === 'archived') return isArchived;
    if (isArchived) return false; // hide in other tabs

    const last = thread[thread.length - 1];
    if (filterTab === 'unreplied' && last?.from_seller) return false;
    if (filterTab === 'hasfiles' && !thread.some(m => (m.attachments || []).length > 0)) return false;
    if (search) {
      const q = search.toLowerCase();
      const textHit = thread.some(m =>
        (m.message || '').toLowerCase().includes(q) ||
        (m.buyer_name || '').toLowerCase().includes(q) ||
        (m.buyer_email || '').toLowerCase().includes(q)
      );
      if (!textHit) return false;
    }
    return true;
  }

  /* ------------------------------ CSV export ------------------------------- */
  function exportCSV(lid) {
    const buyersMap = groupedByListingBuyer[lid] || {};
    const rows = [["Buyer Name","Buyer Email","Messages","Last Message At","Awaiting Reply"]];
    Object.keys(buyersMap).forEach((bk) => {
      const thread = buyersMap[bk];
      const last = thread[thread.length - 1];
      const name = ( [...thread].reverse().find(m => m.buyer_name && m.buyer_name.trim())?.buyer_name ) || '';
      const email = thread.find(m => m.buyer_email)?.buyer_email || '';
      rows.push([
        name,
        email,
        String(thread.length),
        new Date(last.created_at).toLocaleString(),
        last?.from_seller ? "No" : "Yes"
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listing-${lid}-inquiries.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ------------------------- Smart “AI” local draft ------------------------ */
  function draftSmartReply(listing, thread) {
    const lastBuyerMsg = [...thread].reverse().find(m => !m.from_seller)?.message || '';
    const name = listing?.business_name || 'the business';
    const financing = listing?.seller_financing_considered;
    const hasTerms = (listing?.down_payment || listing?.interest_rate || listing?.term_length);
    const termsBits = [
      listing?.down_payment ? `down payment ~${listing.down_payment}%` : null,
      listing?.interest_rate ? `interest ~${listing.interest_rate}%` : null,
      listing?.term_length ? `term ~${listing.term_length} yrs` : null,
    ].filter(Boolean).join(', ');

    const lines = [];
    lines.push(`Hi there — thanks for reaching out about ${name}.`);
    if (lastBuyerMsg) {
      lines.push(`> You said: “${lastBuyerMsg.slice(0, 200)}${lastBuyerMsg.length > 200 ? '…' : ''}”`);
    }
    if (financing === 'yes' || financing === 'maybe') {
      lines.push(`We’re open to seller financing${hasTerms ? ` (${termsBits})` : ''}.`);
      lines.push(`To help me gauge fit, could you share a bit about your background, funding plan, and target timeline?`);
    } else {
      lines.push(`Happy to answer questions and share more details.`);
    }
    lines.push(`If helpful, I can propose a few quick call times — just say “offer times”.`);
    lines.push(`Best,`);
    return lines.join('\n\n');
  }

  /* --------------------------------- UI ----------------------------------- */
  if (!user) {
    return <div className="p-8 text-center text-gray-600">Loading dashboard…</div>;
  }

  const totalConvs = listingIds
    .map(lid => Object.keys(groupedByListingBuyer[lid] || {}).length)
    .reduce((a,b) => a+b, 0);
  const totalAwaiting = listingIds
    .map(lid => listingStats[lid]?.awaiting || 0)
    .reduce((a,b) => a+b, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-900">Seller Dashboard</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/sellers')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold shadow"
            >
              ✏️ Edit Listing
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <StatPill label="Listings" value={sellerListings.length} />
          <StatPill label="Conversations" value={totalConvs} />
          <StatPill label="Awaiting Reply" value={totalAwaiting} highlight />
          <StatPill label="Your Email" value={sellerEmail || '—'} />
          <StatPill label="Timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Listings + Conversations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Listings */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-amber-700 mb-4">Your Listings</h2>
            {loadingListings ? (
              <p>Loading listings…</p>
            ) : sellerListings.length === 0 ? (
              <p className="text-gray-600">No listings yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sellerListings.map((lst) => {
                  const stats = listingStats[lst.id] || { uniqueBuyers: 0, awaiting: 0 };
                  const listingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/listings/${lst.id}`;
                  const financingSet = (lst?.seller_financing_considered === 'yes' || lst?.seller_financing_considered === 'maybe');

                  return (
                    <div key={lst.id} className="bg-gray-50 border rounded-xl shadow-sm hover:shadow-md transition">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={lst.image_urls?.[0] || '/placeholder-listing.jpg'}
                        alt="Listing"
                        className="w-full h-32 object-cover rounded-t-xl"
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-bold">
                            {lst.business_name || 'Business Listing'}
                          </h3>
                          {financingSet ? (
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              💰 Seller Financing
                            </span>
                          ) : (
                            <button
                              onClick={() => router.push(`/sellers?edit=${lst.id}#financing`)}
                              className="text-[11px] text-emerald-700 underline"
                            >
                              Add financing terms
                            </button>
                          )}
                        </div>

                        <p className="text-gray-700"><strong>Industry:</strong> {lst.industry || '—'}</p>
                        <p className="text-gray-700"><strong>Asking Price:</strong> {lst.asking_price ? `$${Number(lst.asking_price).toLocaleString()}` : '—'}</p>
                        <p className="text-gray-700"><strong>Location:</strong> {lst.city || lst.location_city || '—'}, {lst.state_or_province || lst.location_state || '—'}</p>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <MiniStat label="Buyers" value={stats.uniqueBuyers} />
                          <MiniStat label="Awaiting" value={stats.awaiting} highlight={stats.awaiting > 0} />
                          <button
                            onClick={() => exportCSV(lst.id)}
                            className="border rounded px-2 py-1 hover:bg-gray-100"
                            title="Export CSV of inquiries"
                          >
                            ⬇️ Export CSV
                          </button>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => router.push(`/listings/${lst.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                          >
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/sellers?edit=${lst.id}`)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { navigator.clipboard?.writeText(listingUrl); }}
                            className="bg-white border hover:bg-gray-50 text-gray-800 px-3 py-1 rounded"
                            title="Copy public listing link"
                          >
                            🔗 Copy Link
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conversations */}
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-blue-800">Buyer Conversations</h2>
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search buyer or message…"
                  className="border rounded px-2 py-1 text-sm"
                />
                <Tabs value={filterTab} onChange={setFilterTab} />
              </div>
            </div>

            {loadingMessages ? (
              <p>Loading conversations…</p>
            ) : listingIds.length === 0 ? (
              <p className="text-gray-600">No conversations yet.</p>
            ) : (
              listingIds.map((lid) => {
                const buyersMap = groupedByListingBuyer[lid] || {};
                const buyerKeys = Object.keys(buyersMap);

                const listing = sellerListings.find((l) => String(l.id) === String(lid));
                const filteredKeys = buyerKeys.filter((bk) => {
                  const thread = buyersMap[bk];
                  const canonicalEmail = thread.find(m => m.buyer_email)?.buyer_email || 'Unknown';
                  return threadMatchesFilters(thread, convKey(lid, canonicalEmail));
                });

                if (filteredKeys.length === 0) return null;

                return (
                  <div key={lid} className="mb-6 border rounded-xl p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">
                        Listing #{lid} {listing?.business_name ? `• ${listing.business_name}` : ''}
                      </p>
                      <button
                        onClick={() => router.push(`/listings/${lid}`)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View Listing
                      </button>
                    </div>

                    <div className="space-y-4">
                      {filteredKeys.map((buyerKey) => {
                        const thread = buyersMap[buyerKey] || [];
                        const latestWithName =
                          [...thread].reverse().find(m => m.buyer_name && m.buyer_name.trim());
                        const buyerName = latestWithName?.buyer_name?.trim();
                        const canonicalEmail =
                          (thread.find(m => m.buyer_email)?.buyer_email) || 'Unknown';

                        const key = convKey(lid, canonicalEmail);
                        const lastSeen = seenStorage.get(key);
                        const newCount = lastSeen
                          ? thread.filter(m => new Date(m.created_at) > new Date(lastSeen) && !m.from_seller).length
                          : thread.filter(m => !m.from_seller).length;

                        const last = thread[thread.length - 1];
                        const awaitingReply = !last?.from_seller;
                        const isArchived = archiveStorage.isArchived(key);

                        return (
                          <div
                            key={`${lid}-${buyerKey}`}
                            className="bg-white border rounded-lg"
                            onDragOver={allowDrop}
                            onDrop={(e) => handleDrop(lid, canonicalEmail, e)}
                          >
                            {/* Sticky header with Back button + actions */}
                            <div className="sticky top-0 z-10 -m-px px-3 py-2 bg-white/90 backdrop-blur border-b rounded-t-lg flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="text-xs text-gray-600 hover:underline"
                              >
                                ← Back to dashboard
                              </button>
                              <div className="flex items-center gap-2">
                                {newCount > 0 && !isArchived && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                    {newCount} new
                                  </span>
                                )}
                                {awaitingReply && !isArchived && (
                                  <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                                    awaiting reply
                                  </span>
                                )}
                                {isArchived && (
                                  <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                    archived
                                  </span>
                                )}
                                <button
                                  className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                                  onClick={() => {
                                    const nowArchived = archiveStorage.toggle(key);
                                    if (!nowArchived) seenStorage.markNow(key);
                                    setReplyText(r => ({ ...r })); // force refresh
                                  }}
                                  title={isArchived ? 'Unarchive' : 'Archive'}
                                >
                                  {isArchived ? '📤 Unarchive' : '🗄️ Archive'}
                                </button>
                                <button
                                  className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                                  onClick={() => {
                                    setCalKey(key);
                                    setCalSlots(defaultThreeSlots());
                                  }}
                                  title="Offer 3 times to chat"
                                >
                                  📅 Offer times
                                </button>
                              </div>
                            </div>

                            {/* Buyer label */}
                            <div className="px-3 pt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-900 px-2 py-0.5 text-xs font-semibold">
                                  {buyerName || canonicalEmail || 'Unknown buyer'}
                                </span>
                                {canonicalEmail && canonicalEmail !== 'Unknown' && (
                                  <span className="text-[11px] text-gray-500">{canonicalEmail}</span>
                                )}
                              </div>
                            </div>

                            {/* Thread bubbles */}
                            <div className="px-3 pb-3 space-y-2">
                              {thread.map((msg) => {
                                const { who, color } = whoAndColorForSeller(msg, user?.id);
                                const isNew = !msg.from_seller && (!lastSeen || new Date(msg.created_at) > new Date(lastSeen));
                                return (
                                  <div key={msg.id}>
                                    <div className={`p-2 rounded-lg ${color} ${isNew ? 'ring-2 ring-amber-300' : ''}`}>
                                      <strong>{who}:</strong> {msg.message}
                                    </div>

                                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {msg.attachments.map((att, i) => (
                                          <AttachmentPreview key={`${msg.id}-${i}`} att={att} />
                                        ))}
                                      </div>
                                    )}

                                    <p className="text-[11px] text-gray-400 mt-1">
                                      {new Date(msg.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Composer */}
                            <div className="border-t px-3 py-3 rounded-b-lg bg-white">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  multiple
                                  onChange={(e) => onPickFiles(lid, canonicalEmail, e)}
                                  className="text-xs"
                                  onClick={() => seenStorage.markNow(key)}
                                />
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Reply to this buyer…"
                                    value={replyText[key] || ''}
                                    onChange={(e) => {
                                      setReplyText((prev) => ({ ...prev, [key]: e.target.value }));
                                    }}
                                    onFocus={() => seenStorage.markNow(key)}
                                    className="border p-1 rounded flex-1"
                                  />
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setOpenQuickReplyFor(openQuickReplyFor === key ? null : key)}
                                      className="border px-2 py-1 rounded bg-white hover:bg-gray-50 text-sm"
                                      title="Quick replies"
                                    >
                                      ✨ Quick Reply
                                    </button>
                                    {openQuickReplyFor === key && (
                                      <div className="absolute z-10 mt-1 w-64 bg-white border rounded shadow">
                                        {QUICK_TEMPLATES.map((t, i) => (
                                          <button
                                            key={i}
                                            onClick={() => {
                                              setReplyText((prev) => ({ ...prev, [key]: (prev[key] || '') ? `${prev[key]} ${t}` : t }));
                                              setOpenQuickReplyFor(null);
                                            }}
                                            className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                          >
                                            {t}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* AI-ish local draft */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDraftingFor(key);
                                      const drafted = draftSmartReply(
                                        sellerListings.find((l) => String(l.id) === String(lid)),
                                        thread
                                      );
                                      setReplyText(prev => ({ ...prev, [key]: (prev[key] || '').trim() ? `${prev[key]}\n\n${drafted}` : drafted }));
                                      setDraftingFor(null);
                                    }}
                                    className="border px-2 py-1 rounded bg-white hover:bg-gray-50 text-sm"
                                    title="Draft a suggested reply"
                                    disabled={draftingFor === key}
                                  >
                                    🤖 {draftingFor === key ? 'Drafting…' : 'AI Draft'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => sendReply(lid, canonicalEmail)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded"
                                  >
                                    Send
                                  </button>
                                </div>
                              </div>

                              {replyFiles[key]?.length > 0 && (
                                <div className="mt-1 text-xs text-gray-600">
                                  {replyFiles[key].map((f, idx) => (
                                    <span key={idx} className="inline-block mr-2 truncate max-w-[12rem] align-middle">
                                      📎 {f.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Seller meta */}
        <div className="bg-white p-6 rounded-xl shadow h-fit">
          <h2 className="text-xl font-semibold text-amber-800 mb-4">Account</h2>
          <p><strong>Email:</strong> {sellerEmail || '—'}</p>
          <p className="text-sm text-gray-600 mt-2">
            Threads are grouped by listing, then buyer. Use filters to find unreplied or archived conversations.
          </p>
        </div>
      </div>

      {/* Calendar modal */}
      {calKey && (
        <CalendarModal
          title={calTitle}
          onTitle={setCalTitle}
          slots={calSlots}
          onSlots={setCalSlots}
          duration={calDuration}
          onDuration={setCalDuration}
          onClose={() => setCalKey(null)}
          onInsert={(text) => {
            setReplyText(prev => ({ ...prev, [calKey]: (prev[calKey] || '').trim() ? `${prev[calKey]}\n\n${text}` : text }));
            setCalKey(null);
          }}
        />
      )}
    </div>
  );
}

/* ----------------------------- small components ---------------------------- */
function StatPill({ label, value, highlight }) {
  return (
    <div className={`rounded-lg px-3 py-2 border text-sm ${highlight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-white border-gray-200 text-gray-800'}`}>
      <div className="text-gray-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
function MiniStat({ label, value, highlight }) {
  return (
    <div className={`text-center border rounded px-2 py-1 ${highlight ? 'bg-rose-50 border-rose-200 text-rose-800' : ''}`}>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
function Tabs({ value, onChange }) {
  const Btn = ({ v, children }) => (
    <button
      onClick={() => onChange(v)}
      className={`text-xs px-2 py-1 rounded border ${value === v ? 'bg-blue-600 text-white border-blue-700' : 'bg-white hover:bg-gray-50'}`}
    >
      {children}
    </button>
  );
  return (
    <div className="flex gap-1">
      <Btn v="all">All</Btn>
      <Btn v="unreplied">Unreplied</Btn>
      <Btn v="hasfiles">Has files</Btn>
      <Btn v="archived">Archived</Btn>
    </div>
  );
}

/** Inline preview for message attachments (public bucket) */
function AttachmentPreview({ att }) {
  const { data } = supabase.storage.from('message-attachments').getPublicUrl(att.path);
  const url = data?.publicUrl;
  if (!url) return null;

  if (att.kind === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={att.name || 'attachment'}
        className="w-full h-32 object-cover rounded border"
      />
    );
  }
  if (att.kind === 'video') {
    return <video src={url} controls className="w-full h-32 object-cover rounded border" />;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
      Download {att.name || 'attachment'}
    </a>
  );
}

/* ------------------------------ Calendar modal ----------------------------- */
function defaultThreeSlots() {
  const now = new Date();
  const base = new Date(now.getTime() + 24*3600*1000); // tomorrow
  const set = (d, h=10, m=0) => {
    const x = new Date(d);
    x.setHours(h, m, 0, 0);
    return x.toISOString().slice(0,16); // yyyy-MM-ddTHH:mm for <input type="datetime-local">
  };
  return [ set(base,10,0), set(base,14,0), set(new Date(base.getTime()+24*3600*1000), 16, 0) ];
}
function CalendarModal({ title, onTitle, slots, onSlots, duration, onDuration, onClose, onInsert }) {
  const listingUrl = typeof window !== 'undefined' ? window.location.href : '';
  function insertText() {
    const lines = [];
    lines.push(`Here are a few times (all in my timezone) — let me know which works:`);
    slots.filter(Boolean).forEach((s, i) => {
      const pretty = fmtLocal(s);
      const link = gcalLink({ title, start: s, minutes: duration, details: `Intro call about the listing\n${listingUrl}` });
      lines.push(`• ${pretty} — Add to Calendar: ${link}`);
    });
    lines.push(`(If none work, tell me a few windows and I’ll send alternatives.)`);
    onInsert(lines.join('\n'));
  }
  const setSlot = (i, val) => {
    const next = [...slots];
    next[i] = val;
    onSlots(next);
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Offer times to chat</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input value={title} onChange={(e)=>onTitle(e.target.value)} className="w-full border rounded px-2 py-1 mb-3" />
        <div className="grid grid-cols-1 gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm w-10 text-gray-600">Slot {i+1}</span>
              <input type="datetime-local" value={slots[i] || ''} onChange={(e)=>setSlot(i, e.target.value)} className="border rounded px-2 py-1 flex-1" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-gray-600">Duration</label>
          <input type="number" min={10} max={180} step={5} value={duration} onChange={(e)=>onDuration(Number(e.target.value)||30)} className="w-20 border rounded px-2 py-1" />
          <span className="text-sm text-gray-600">minutes</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="border px-3 py-1 rounded hover:bg-gray-50">Cancel</button>
          <button onClick={insertText} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Insert into reply</button>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          We generate Google Calendar links for each proposed time. Times are shown in your current timezone.
        </p>
      </div>
    </div>
  );
}
