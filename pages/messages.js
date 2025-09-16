// pages/messages.js
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import supabase from '../lib/supabaseClient';

export default function Messages() {
  const router = useRouter();
  const { listingId, buyer, buyerId } = router.query;

  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [threadKey, setThreadKey] = useState(''); // buyer email OR buyer auth id
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // 1) Require login (seller or broker)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        const next = `/messages?listingId=${encodeURIComponent(listingId || '')}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      setAuthUser(data.user);
    })();
  }, [router, listingId]);

  // 2) Resolve the buyer “thread key”
  useEffect(() => {
    if (!listingId || !authUser) return;

    // If the URL already has buyer/buyerId and it's not "null", use it
    const paramKey = (buyer || buyerId || '').toString().trim();
    if (paramKey && paramKey.toLowerCase() !== 'null') {
      setThreadKey(paramKey);
      return;
    }

    // Fallback: look up the latest message for this listing to discover the buyer
    (async () => {
      // Try by most recent message that has either buyer_email or buyer_auth_id
      const { data, error } = await supabase
        .from('messages')
        .select('buyer_email,buyer_auth_id')
        .eq('listing_id', Number(listingId))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setLoadErr(error.message || 'Failed to resolve conversation.');
      } else if (data) {
        const k = data.buyer_email || data.buyer_auth_id || '';
        if (k) setThreadKey(k);
        else setLoadErr('No buyer identified for this listing yet.');
      } else {
        setLoadErr('No conversation found yet for this listing.');
      }
    })();
  }, [listingId, authUser, buyer, buyerId]);

  // 3) Load the thread
  useEffect(() => {
    if (!listingId || !threadKey) return;

    (async () => {
      setLoading(true);
      setLoadErr('');

      // Build an OR filter: match either buyer_email OR buyer_auth_id
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          threadKey
        );
      const orExpr = isUuid
        ? `buyer_auth_id.eq.${threadKey},buyer_email.is.null` // favor auth id
        : `buyer_email.eq.${threadKey}`;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('listing_id', Number(listingId))
        .or(orExpr)
        .order('created_at', { ascending: true });

      if (error) {
        setLoadErr(error.message || 'Failed to load messages.');
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    })();
  }, [listingId, threadKey]);

  const listingIdNum = useMemo(() => {
    const n = Number(listingId);
    return Number.isFinite(n) ? n : null;
  }, [listingId]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    if (!listingIdNum || !threadKey || !text.trim()) return;
    setSending(true);

    try {
      // We send as "from_seller" so brokers/sellers can reply.
      // API will resolve seller_id from listing_id.
      const body = {
        listing_id: listingIdNum,
        message: text.trim(),
        topic: 'business-inquiry',
        from_seller: true,
      };

      // If thread key looks like an email, include it so API can store buyer_email
      if (threadKey.includes('@')) body.buyer_email = threadKey;

      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Send failed');
      }

      setText('');
      // Optimistic append
      setMessages((prev) => [
        ...prev,
        {
          id: data.message?.id || `tmp_${Date.now()}`,
          listing_id: listingIdNum,
          message: text.trim(),
          created_at: new Date().toISOString(),
          from_seller: true,
          buyer_email: body.buyer_email || null,
          buyer_auth_id: null,
          attachments: [],
        },
      ]);
    } catch (err) {
      alert(err.message || 'Failed to send.');
    } finally {
      setSending(false);
    }
  }

  if (!listingId) return <div className="p-6">Missing listingId.</div>;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto p-6">
        <a href="/broker-dashboard" className="text-blue-600 text-sm hover:underline">
          ← Back
        </a>
        <h1 className="text-2xl font-bold mt-2">Conversation</h1>
        <p className="text-sm text-gray-600">
          Listing #{listingId} • {threadKey ? `Buyer: ${threadKey}` : 'resolving…'}
        </p>

        {loadErr && (
          <div className="mt-4 p-3 rounded border border-red-200 text-red-700 text-sm">
            {loadErr}
          </div>
        )}

        {loading ? (
          <div className="mt-6 text-gray-600">Loading messages…</div>
        ) : (
          <div className="mt-6 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded border ${
                  m.from_seller ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {m.from_seller ? 'Seller/Broker' : 'Buyer'} •{' '}
                  {new Date(m.created_at).toLocaleString()}
                </div>
                <div className="whitespace-pre-wrap">{m.message}</div>
              </div>
            ))}
            {!messages.length && (
              <div className="text-gray-500 border rounded p-3">No messages yet.</div>
            )}
          </div>
        )}

        {/* Composer */}
        <form onSubmit={sendMessage} className="mt-6 space-y-3">
          <textarea
            className="w-full border rounded p-3 min-h-[100px]"
            placeholder="Type your reply…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={sending || !text.trim() || !threadKey}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
            <a
              className="px-4 py-2 rounded border"
              href={`/listings/${encodeURIComponent(listingId)}`}
            >
              View Listing
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
