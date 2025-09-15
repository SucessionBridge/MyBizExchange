// pages/broker-dashboard.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseBrowserClient';

export default function BrokerDashboard() {
  const router = useRouter();

  const [broker, setBroker] = useState(null);
  const [threads, setThreads] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) Require auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login?role=broker&next=/broker-dashboard');
          return;
        }

        // 2) Load broker row (redirect to onboarding if none)
        const { data: br, error: brErr } = await supabase
          .from('brokers')
          .select('id, verified, verification_status, email, first_name, last_name, phone, company_name, website, license_number, license_state, license_expiry')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (brErr) {
          console.error('❌ Broker fetch error:', brErr.message || brErr);
        }

        if (!br || !br.id) {
          router.replace('/broker-onboarding?next=/broker-dashboard');
          return;
        }

        // 🔒 Guard: force onboarding if profile is incomplete
        if (!br.first_name || !br.last_name) {
          router.replace('/broker-onboarding?next=/broker-dashboard');
          return;
        }

        if (cancelled) return;
        setBroker(br);

        // 3) Load conversations + listings in parallel, but don't blow up if a table is missing
        const [thRes, lsRes] = await Promise.allSettled([
          supabase
            .from('broker_conversations')
            .select('*')
            .eq('broker_id', br.id)
            .order('last_message_at', { ascending: false })
            .limit(50),
          supabase
            .from('sellers')
            .select('id,business_name,location_city,location_state,location,asking_price,created_at,financing_type,status')
            .eq('broker_id', br.id)
            .order('created_at', { ascending: false })
        ]);

        if (!cancelled) {
          // ---- Conversations (robust missing-table guard) ----
          if (thRes.status === 'fulfilled') {
            const { data, error } = thRes.value || {};
            if (error) {
              const msg = String(error?.message || '');
              const missing =
                /relation .* does not exist/i.test(msg) ||
                /does not exist/i.test(msg) ||
                error?.code === '42P01'; // undefined_table

              if (missing) {
                console.warn('Conversations table missing; continuing without it.');
                setThreads([]);
              } else {
                console.warn('⚠️ Conversations query error:', msg);
                setThreads([]);
              }
            } else {
              setThreads(Array.isArray(data) ? data : []);
            }
          } else {
            console.warn('⚠️ Conversations load failed:', thRes.reason);
            setThreads([]);
          }

          // ---- Listings ----
          if (lsRes.status === 'fulfilled') {
            if (lsRes.value.error) {
              console.warn('⚠️ Listings query error:', lsRes.value.error.message);
              setListings([]);
            } else {
              setListings(lsRes.value.data || []);
            }
          } else {
            console.warn('⚠️ Listings load failed:', lsRes.reason);
            setListings([]);
          }

          setLoading(false);
        }
      } catch (e) {
        console.error('❌ Broker dashboard fatal:', e);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const fmtMoney = (n) =>
    typeof n === 'number' && Number.isFinite(n) ? `$${n.toLocaleString()}` : 'Inquire';

  const listingLocation = (l) => {
    const city = l?.location_city?.trim();
    const state = l?.location_state?.trim();
    if (city || state) return `${city || ''}${city && state ? ', ' : ''}${state || ''}`.trim();
    return l?.location || 'Location undisclosed';
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="h-32 bg-gray-50 animate-pulse rounded" />
        <div className="h-64 bg-gray-50 animate-pulse rounded" />
      </div>
    );
  }

  // ✅ Unified verified flag (checks either column)
  const isVerified =
    (broker?.verification_status?.toLowerCase?.() === 'verified') ||
    !!broker?.verified;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {broker?.first_name ? `Welcome back, ${broker.first_name}` : 'Broker Dashboard'}
        </h1>
        {!isVerified && (
          <span className="px-3 py-1 rounded bg-yellow-100 text-yellow-800">
            Pending verification
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/broker/profile"
            className="px-3 py-2 rounded border border-gray-300 text-gray-800"
          >
            Edit Profile
          </Link>
          <Link
            href="/broker/listings/new"
            className="px-3 py-2 rounded bg-black text-white"
          >
            + New Listing
          </Link>
        </div>
      </header>

      {/* My Profile */}
      <section className="border rounded p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold mb-1">My Profile</h2>
           <div className="text-sm text-gray-600 mb-3">
  { (broker?.verification_status?.toLowerCase?.() === 'verified') || broker?.verified
      ? 'Status: verified'
      : (broker?.verification_status?.toLowerCase?.() === 'rejected'
          ? 'Status: rejected'
          : 'Status: pending')
  }
</div>


            <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><span className="text-gray-500">Name:</span> {`${broker?.first_name || ''} ${broker?.last_name || ''}`.trim() || '—'}</div>
              <div><span className="text-gray-500">Email:</span> {broker?.email || '—'}</div>
              <div><span className="text-gray-500">Phone:</span> {broker?.phone || '—'}</div>
              <div><span className="text-gray-500">Company:</span> {broker?.company_name || '—'}</div>
              <div className="truncate">
                <span className="text-gray-500">Website:</span>{' '}
                {broker?.website ? <a href={broker.website} target="_blank" rel="noreferrer" className="underline">{broker.website}</a> : '—'}
              </div>
              <div><span className="text-gray-500">License #:</span> {broker?.license_number || '—'}</div>
              <div><span className="text-gray-500">License State/Prov:</span> {broker?.license_state || '—'}</div>
              <div><span className="text-gray-500">License Expiry:</span> {broker?.license_expiry ? new Date(broker.license_expiry).toLocaleDateString() : '—'}</div>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              href="/broker/profile"
              className="inline-flex items-center px-3 py-2 rounded border border-gray-300 text-gray-800 text-sm hover:bg-gray-50"
              title="Edit profile"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </section>

      {/* Conversations */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Conversations</h2>
        <div className="grid gap-3">
          {(threads || []).map((t) => (
            <Link
              key={`${t.listing_id}-${t.buyer_id}-${t.last_message_at || ''}`}
              href={`/messages?listingId=${t.listing_id}&buyerId=${t.buyer_id}`}
              className="flex items-center justify-between border rounded p-3 hover:bg-gray-50"
            >
              <div>
                <div className="text-sm text-gray-600">
                  Listing #{t.listing_id} • Buyer #{t.buyer_id}
                </div>
                <div className="text-xs text-gray-500">
                  Last: {t.last_message_at ? new Date(t.last_message_at).toLocaleString() : '—'}
                </div>
              </div>
              {t.unread_count > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-black text-white">
                  {t.unread_count}
                </span>
              )}
            </Link>
          ))}
          {threads?.length === 0 && (
            <div className="text-sm text-gray-500">Conversations are unavailable right now.</div>
          )}
        </div>
      </section>

      {/* Listings */}
      <section>
        <h2 className="text-lg font-semibold mb-3">My Listings</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {(listings || []).map((l) => (
            <div key={l.id} className="border rounded p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/listings/${l.id}`} className="font-medium hover:underline block truncate">
                    {l.business_name || `Listing #${l.id}`}
                  </Link>
                  <div className="text-sm text-gray-600">
                    {listingLocation(l)}
                  </div>
                  <div className="text-sm mt-1">
                    Asking: {fmtMoney(Number(l.asking_price || 0))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Created {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
                  </div>

                  {/* Financing + status badges */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {l.financing_type && (
                      <span
                        className={
                          "text-xs px-2 py-1 rounded border " +
                          (l.financing_type === 'seller-financing-available'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : l.financing_type === 'seller-financing-considered'
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-50 text-gray-700 border-gray-200")
                        }
                        title="Financing"
                      >
                        {l.financing_type === 'seller-financing-available' && 'Seller financing available'}
                        {l.financing_type === 'seller-financing-considered' && 'Seller financing considered'}
                        {l.financing_type === 'buyer-financed' && 'Buyer financed'}
                      </span>
                    )}
                    {l.status && (
                      <span className="text-xs px-2 py-1 rounded border bg-gray-50 text-gray-700 border-gray-200">
                        {l.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit button */}
                <div className="shrink-0">
                  <Link
                    href={`/broker/listings/${l.id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 rounded bg-black text-white text-sm hover:opacity-90"
                    title="Edit listing"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {listings?.length === 0 && (
            <div className="text-sm text-gray-500">No listings assigned.</div>
          )}
        </div>
      </section>
    </div>
  );
}
