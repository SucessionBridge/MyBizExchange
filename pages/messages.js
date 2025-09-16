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

  // 2) resolve listing + buyer
  useEffect(() => {
    const lid =
      typeof qListingId === 'string' && qListingId.trim() !== ''
        ? Number.isFinite(Number(qListingId))
          ? Number(qListingId)
          : qListingId
        : null;

    setListingId(lid || null);
  }, [qListingId]);

  useEffect(() => {
    if (!listingId) return;
    (async () => {
      setResolving(true);
      setResolveError('');

      try {
        // If buyerEmail already provided, use it
        if (qBuyerEmail && String(qBuyerEmail).trim()) {
          setBuyerEmail(String(qBuyerEmail).trim());
          setResolving(false);
          return;
        }

        // Otherwise: pick the most recent buyer_email for this listing
        const { data, error } = await supabase
          .from('messages')
          .select('buyer_email, created_at')
          .eq('listing_id', listingId)
          .not('buyer_email', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length) {
          setBuyerEmail(data[0].buyer_email);
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
        if (!cancelled) setMessages(data || []);
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || 'Could not load messages.');
      } finally {
        if (!cancelled) setLoadingMsgs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listingId, buyerEmail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const title = useMemo(() => {
    if (!listingId) return 'Conversation';
    return `Conversation · Listing #${listingId}`;
    // (Optional: you could look up listing name here if you want)
  }, [listingId]);

  async function sendReply(e) {
    e.preventDefault();
    if (!text.trim() || !listingId || !buyerEmail || !authUser) return;

    try {
      setSending(true);

      // We call your existing API with JSON (no files here)
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          buyer_email: buyerEmail,
          buyer_name: null,
          message: text.trim(),
          topic: 'business-inquiry',
          from_seller: true,          // ✅ this marks it as broker/seller side
          // seller_id will be resolved server-side from listing_id
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Send failed.');
      }

      // append optimistically
      setMessages((m) => [
        ...m,
        {
          id: data.message?.id || `local-${Date.now()}`,
          message: text.trim(),
          created_at: new Date().toISOString(),
          from_seller: true,
          buyer_email: buyerEmail,
          buyer_name: null,
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>

        {/* Status line */}
        <div className="text-xs text-gray-500 mb-4">
          {resolving ? 'Resolving…' : resolveError ? resolveError : buyerEmail ? `Buyer: ${buyerEmail}` : ''}
        </div>

        {/* Errors */}
        {resolveError && (
          <div className="p-3 mb-4 rounded border border-red-200 bg-red-50 text-red-700">
            {resolveError}
          </div>
        )}
        {loadError && (
          <div className="p-3 mb-4 rounded border border-red-200 bg-red-50 text-red-700">
            {loadError}
          </div>
        )}

        {/* Messages list */}
        <div className="bg-white rounded-lg border shadow-sm p-4 min-h-[320px]">
          {loadingMsgs ? (
            <div className="text-gray-500">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-gray-500">No messages yet.</div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`flex ${m.from_seller ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded px-3 py-2 text-sm ${
                      m.from_seller ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.message}</div>
                    <div className={`mt-1 text-[10px] ${m.from_seller ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
              <div ref={bottomRef} />
            </ul>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={sendReply} className="mt-4 flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Write a reply…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!buyerEmail || !listingId}
          />
          <button
            type="submit"
            disabled={sending || !text.trim() || !buyerEmail || !listingId}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </main>
  );
}
