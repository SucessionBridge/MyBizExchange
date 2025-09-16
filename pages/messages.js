// pages/messages.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

export default function MessagesPage() {
  const router = useRouter();
  const { listingId: qListingId, buyerEmail: qBuyerEmail } = router.query;

  const [authUser, setAuthUser] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [buyerEmail, setBuyerEmail] = useState(null);
  const [buyerName, setBuyerName] = useState('');
  const [listingTitle, setListingTitle] = useState(''); // ✅ nice header

  const [resolving, setResolving] = useState(true);
  const [resolveError, setResolveError] = useState('');

  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  // 1) auth
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setAuthUser(data?.user || null);
    })();
  }, []);

  // 2) resolve listing id
  useEffect(() => {
    const lid =
      typeof qListingId === 'string' && qListingId.trim() !== ''
        ? Number.isFinite(Number(qListingId))
          ? Number(qListingId)
          : qListingId
        : null;
    setListingId(lid || null);
  }, [qListingId]);

  // 2a) fetch listing title (for header polish)
  useEffect(() => {
    if (!listingId) return;
    (async () => {
      const { data } = await supabase
        .from('sellers')
        .select('business_name, industry, hide_business_name')
        .eq('id', listingId)
        .maybeSingle();
      const name = data?.hide_business_name
        ? 'Confidential Business Listing'
        : (data?.business_name || (data?.industry ? `${data.industry} Business` : 'Listing'));
      setListingTitle(name);
    })();
  }, [listingId]);

  // 2b) resolve buyer (email + name)
  useEffect(() => {
    if (!listingId) return;
    (async () => {
      setResolving(true);
      setResolveError('');
      try {
        if (qBuyerEmail && String(qBuyerEmail).trim()) {
          const email = String(qBuyerEmail).trim();
          setBuyerEmail(email);

          // try to find a name from prior messages for this listing/email
          const { data: nameMsg } = await supabase
            .from('messages')
            .select('buyer_name')
            .eq('listing_id', listingId)
            .eq('buyer_email', email)
            .not('buyer_name', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);
          if (nameMsg && nameMsg.length && nameMsg[0].buyer_name) {
            setBuyerName(nameMsg[0].buyer_name);
          } else {
            const { data: b } = await supabase
              .from('buyers')
              .select('full_name,name')
              .eq('email', email)
              .maybeSingle();
            setBuyerName(b?.full_name || b?.name || '');
          }
          setResolving(false);
          return;
        }

        // Otherwise: pick the most recent buyer_email for this listing (and its name)
        const { data, error } = await supabase
          .from('messages')
          .select('buyer_email, buyer_name, created_at')
          .eq('listing_id', listingId)
          .not('buyer_email', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) throw error;

        if (data && data.length) {
          setBuyerEmail(data[0].buyer_email);
          setBuyerName(data[0].buyer_name || '');
        } else {
          setResolveError('No conversation found yet for this listing.');
        }
      } catch (e) {
        setResolveError(e?.message || 'Failed to resolve conversation.');
      } finally {
        setResolving(false);
      }
    })();
  }, [listingId, qBuyerEmail]);

  // 3) fetch messages
  useEffect(() => {
    if (!listingId || !buyerEmail) return;
    let cancelled = false;

    (async () => {
      setLoadingMsgs(true);
      setLoadError('');
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, message, created_at, from_seller, buyer_email, buyer_name, attachments')
          .eq('listing_id', listingId)
          .eq('buyer_email', buyerEmail)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (!cancelled) {
          setMessages(data || []);
          const named = (data || []).find(m => m.buyer_name);
          if (named && !buyerName) setBuyerName(named.buyer_name);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || 'Could not load messages.');
      } finally {
        if (!cancelled) setLoadingMsgs(false);
      }
    })();

    return () => { cancelled = true; };
  }, [listingId, buyerEmail]); // keep deps tight

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const headerSubtitle = useMemo(() => {
    if (resolving) return 'Resolving…';
    if (resolveError) return resolveError;
    if (!buyerEmail) return '';
    const label = buyerName ? `${buyerName} · ${buyerEmail}` : buyerEmail;
    return `Buyer: ${label}`;
  }, [resolving, resolveError, buyerEmail, buyerName]);

  async function sendReply(e) {
    e.preventDefault();
    if (!text.trim() || !listingId || !buyerEmail || !authUser) return;

    try {
      setSending(true);

      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          buyer_email: buyerEmail,
          buyer_name: buyerName || buyerEmail, // ✅ never null
          message: text.trim(),
          topic: 'business-inquiry',
          from_seller: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Send failed.');
      }

      setMessages((m) => [
        ...m,
        {
          id: data.message?.id || `local-${Date.now()}`,
          message: text.trim(),
          created_at: new Date().toISOString(),
          from_seller: true,
          buyer_email: buyerEmail,
          buyer_name: buyerName || buyerEmail,
          attachments: [],
        },
      ]);
      setText('');
    } catch (e) {
      alert(e?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  }

  // --- small UI helpers ---
  const initials = (full) =>
    String(full || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase())
      .join('') || 'B';

  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold text-gray-900">
              {listingTitle || (listingId ? `Listing #${listingId}` : 'Conversation')}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{headerSubtitle}</div>
          </div>
          {listingId && (
            <a
              href={`/listings/${listingId}`}
              className="text-sm text-blue-600 hover:underline"
            >
              View listing →
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Errors */}
        {loadError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}
          </div>
        )}
        {resolveError && (
          <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            {resolveError}
          </div>
        )}

        {/* Chat card */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Chat stream */}
          <div className="max-h-[65vh] min-h-[40vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            {loadingMsgs ? (
              <div className="text-gray-500">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-500">No messages yet.</div>
            ) : (
              messages.map((m) => {
                const mine = m.from_seller === true;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[80%] ${mine ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div
                        className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold
                          ${mine ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        title={mine ? 'You (Broker/Seller)' : (buyerName || buyerEmail || 'Buyer')}
                      >
                        {mine ? 'SB' : initials(buyerName || buyerEmail)}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm
                          ${mine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}
                      >
                        <div className="whitespace-pre-wrap">{m.message}</div>
                        <div className={`mt-1 text-[10px] ${mine ? 'text-blue-100' : 'text-gray-500'}`}>
                          {formatTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer (sticky footer of card) */}
          <div className="border-t bg-white px-4 py-3 sm:px-6">
            <form onSubmit={sendReply} className="flex items-end gap-3">
              <textarea
                className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] max-h-40"
                placeholder="Write a professional reply…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!buyerEmail || !listingId}
              />
              <button
                type="submit"
                disabled={sending || !text.trim() || !buyerEmail || !listingId}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
            {!buyerEmail && (
              <div className="text-[11px] text-gray-500 mt-1">
                Select a conversation from your dashboard or include <code>?listingId=&lt;id&gt;&amp;buyerEmail=&lt;email&gt;</code> in the URL.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
