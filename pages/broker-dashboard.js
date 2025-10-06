// pages/broker-dashboard.js
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseBrowserClient';

export default function BrokerDashboard() {
  const router = useRouter();

  const [broker, setBroker] = useState(null);
  const [threads, setThreads] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state (MLS-style)
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' or specific status
  const [financingFilter, setFinancingFilter] = useState('all'); // 'all' or specific type
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('mls'); // 'mls' | 'newest' | 'priceHigh' | 'priceLow' | 'name'

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

  // helpers
  const fmtMoney = (n) =>
    typeof n === 'number' && Number.isFinite(n) ? `$${n.toLocaleString()}` : 'Inquire';

  const listingLocation = (l) => {
    const city = l?.location_city?.trim();
    const state = l?.location_state?.trim();
    if (city || state) return `${city || ''}${city && state ? ', ' : ''}${state || ''}`.trim();
    return l?.location || 'Location undisclosed';
  };

  const isVerified =
    (broker?.verification_status?.toLowerCase?.() === 'verified') ||
    !!broker?.verified;

  const statusBadgeClasses = (statusRaw) => {
    const status = (statusRaw || '').toString().toLowerCase();
    // MLS-style colors: active=green, pending=amber, sold=slate, withdrawn=rose, off-market=gray, draft=gray
    if (status.includes('active')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status.includes('pending') || status.includes('offer')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status.includes('sold') || status.includes('closed')) return 'bg-slate-50 text-slate-700 border-slate-200';
    if (status.includes('withdraw') || status.includes('canceled') || status.includes('cancelled')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (status.includes('off')) return 'bg-gray-50 text-gray-700 border-gray-200';
    if (status.includes('draft')) return 'bg-gray-50 text-gray-700 border-gray-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const financingBadgeClasses = (type) => {
    switch (type) {
      case 'seller-financing-available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'seller-financing-considered':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'buyer-financed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // derive facets & stats
  const distinctStatuses = useMemo(() => {
    const set = new Set((listings || []).map(l => (l.status || '').toString()).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [listings]);

  const distinctFinancing = useMemo(() => {
    const set = new Set((listings || []).map(l => (l.financing_type || '').toString()).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [listings]);

  const quickStats = useMemo(() => {
    const total = listings.length;
    const byStatus = listings.reduce((acc, l) => {
      const k = (l.status || 'Unspecified').toString();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const activeCount = Object.entries(byStatus).reduce((sum, [k, v]) => {
      return sum + (k.toLowerCase().includes('active') ? v : 0);
    }, 0);
    const pendingCount = Object.entries(byStatus).reduce((sum, [k, v]) => {
      return sum + (k.toLowerCase().includes('pending') || k.toLowerCase().includes('offer') ? v : 0);
    }, 0);
    const soldCount = Object.entries(byStatus).reduce((sum, [k, v]) => {
      return sum + (k.toLowerCase().includes('sold') || k.toLowerCase().includes('closed') ? v : 0);
    }, 0);

    const unread = (threads || []).reduce((sum, t) => sum + (Number(t.unread_count) || 0), 0);

    return { total, activeCount, pendingCount, soldCount, unread, byStatus };
  }, [listings, threads]);

  // filtered + sorted listings (client-side only, preserving Supabase logic unchanged)
  const filteredSortedListings = useMemo(() => {
    let arr = [...(listings || [])];

    // filter: status
    if (statusFilter !== 'all') {
      arr = arr.filter(l => (l.status || '').toString() === statusFilter);
    }

    // filter: financing
    if (financingFilter !== 'all') {
      arr = arr.filter(l => (l.financing_type || '').toString() === financingFilter);
    }

    // filter: search (business name or location)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(l => {
        const name = (l.business_name || '').toLowerCase();
        const loc = (listingLocation(l) || '').toLowerCase();
        const idStr = String(l.id || '');
        return name.includes(q) || loc.includes(q) || idStr.includes(q);
      });
    }

    // sort
    const numeric = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : -Infinity;
    };

    if (sortBy === 'mls') {
      // MLS-style: Active first, then Pending/Offer, then the rest,
      // each bucket sorted by newest created_at
      const bucketScore = (s) => {
        const st = (s || '').toLowerCase();
        if (st.includes('active')) return 0;
        if (st.includes('pending') || st.includes('offer')) return 1;
        if (st.includes('sold') || st.includes('closed')) return 3; // sold later
        return 2; // everything else between pending and sold
      };
      arr.sort((a, b) => {
        const score = bucketScore(a.status) - bucketScore(b.status);
        if (score !== 0) return score;
        const at = new Date(a.created_at || 0).getTime();
        const bt = new Date(b.created_at || 0).getTime();
        return bt - at; // newest first
      });
    } else if (sortBy === 'newest') {
      arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortBy === 'priceHigh') {
      arr.sort((a, b) => numeric(b.asking_price) - numeric(a.asking_price));
    } else if (sortBy === 'priceLow') {
      arr.sort((a, b) => numeric(a.asking_price) - numeric(b.asking_price));
    } else if (sortBy === 'name') {
      arr.sort((a, b) => (a.business_name || '').localeCompare(b.business_name || ''));
    }

    return arr;
  }, [listings, statusFilter, financingFilter, search, sortBy]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="h-24 bg-gray-50 animate-pulse rounded" />
        <div className="h-64 bg-gray-50 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-3">
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

      {/* Quick Stats (MLS-style cards) */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Listings" value={quickStats.total} />
        <StatCard label="Active" value={quickStats.activeCount} tone="emerald" />
        <StatCard label="Pending/Offers" value={quickStats.pendingCount} tone="amber" />
        <StatCard label="Sold/Closed" value={quickStats.soldCount} tone="slate" />
        <StatCard label="Unread Messages" value={quickStats.unread} tone="black" />
      </section>

      {/* My Profile */}
      <section className="border rounded p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold mb-1">My Profile</h2>
            <div className="text-sm text-gray-600 mb-3">
              {(broker?.verification_status?.toLowerCase?.() === 'verified') || broker?.verified
                ? 'Status: verified'
                : (broker?.verification_status?.toLowerCase?.() === 'rejected'
                    ? 'Status: rejected'
                    : 'Status: pending')}
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <span className="text-xs text-gray-500">
            Showing latest {Math.min((threads || []).length, 50)} threads
          </span>
        </div>
        <div className="grid gap-3">
          {(threads || []).map((t) => (
            <Link
              key={`${t.listing_id}-${t.buyer_id}-${t.last_message_at || ''}`}
              href={`/messages?listingId=${t.listing_id}&buyerId=${t.buyer_id}`}
              className="flex items-center justify-between border rounded p-3 hover:bg-gray-50"
            >
              <div>
                <div className="text-sm text-gray-700 font-medium">
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
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold mr-2">My Listings</h2>

          {/* Status filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            {distinctStatuses.map((s) => (
              <button
                key={`status-${s}`}
                onClick={() => setStatusFilter(s)}
                className={
                  'text-xs px-2 py-1 rounded-full border transition ' +
                  (statusFilter === s
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
                }
                title={s === 'all' ? 'All statuses' : s}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* Financing filter pills */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {distinctFinancing.map((f) => (
              <button
                key={`fin-${f}`}
                onClick={() => setFinancingFilter(f)}
                className={
                  'text-xs px-2 py-1 rounded-full border transition ' +
                  (financingFilter === f
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
                }
                title={f === 'all' ? 'All financing' : f}
              >
                {f === 'all' ? 'All financing' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business, location, or ID…"
            className="w-full md:w-72 px-3 py-2 border rounded outline-none focus:ring-2 focus:ring-black/10"
          />
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-600">Sort</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded text-sm"
            >
              <option value="mls">MLS order (status → newest)</option>
              <option value="newest">Newest</option>
              <option value="priceHigh">Price: High → Low</option>
              <option value="priceLow">Price: Low → High</option>
              <option value="name">Name A → Z</option>
            </select>
          </div>
          {/* Clear filters */}
          {(statusFilter !== 'all' || financingFilter !== 'all' || search) && (
            <button
              onClick={() => { setStatusFilter('all'); setFinancingFilter('all'); setSearch(''); setSortBy('mls'); }}
              className="ml-auto text-sm px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
              title="Clear all filters"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="text-xs text-gray-600 mb-2">
          Showing {filteredSortedListings.length} of {listings.length} listing{listings.length === 1 ? '' : 's'}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(filteredSortedListings || []).map((l) => (
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

                  {/* Financing + status badges (MLS colors) */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {l.financing_type && (
                      <span
                        className={`text-xs px-2 py-1 rounded border ${financingBadgeClasses(l.financing_type)}`}
                        title="Financing"
                      >
                        {l.financing_type === 'seller-financing-available' && 'Seller financing available'}
                        {l.financing_type === 'seller-financing-considered' && 'Seller financing considered'}
                        {l.financing_type === 'buyer-financed' && 'Buyer financed'}
                      </span>
                    )}
                    {l.status && (
                      <span
                        className={`text-xs px-2 py-1 rounded border ${statusBadgeClasses(l.status)}`}
                        title="Status"
                      >
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
          {filteredSortedListings?.length === 0 && (
            <div className="text-sm text-gray-500">No listings match your filters.</div>
          )}
        </div>
      </section>
    </div>
  );
}

/** ---- Small UI helper for quick stats cards ---- **/
function StatCard({ label, value, tone }) {
  const pill =
    tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
    tone === 'amber' ? 'bg-amber-50 text-amber-700' :
    tone === 'slate' ? 'bg-slate-50 text-slate-700' :
    tone === 'black' ? 'bg-black text-white' :
    'bg-gray-50 text-gray-700';

  return (
    <div className="border rounded p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value ?? 0}</div>
      <div className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${pill}`}>
        {label}
      </div>
    </div>
  );
}
