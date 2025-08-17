// pages/buyer-dashboard.js 
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import supabase from '../lib/supabaseClient';

export default function BuyerDashboard() {
  const router = useRouter();

  // Auth + profile
  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Saved listings
  const [savedListings, setSavedListings] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Recent messages
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Matches (NEW)
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // 1) Auth check
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const user = data?.user || null;
      setAuthUser(user);
      setLoadingAuth(false);
      if (!user) {
        router.replace('/login?next=/buyer-dashboard');
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  // 2) Load buyer profile; redirect to onboarding only if truly none exists
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    (async () => {
      setLoadingProfile(true);
      const { data: buyer, error } = await supabase
        .from('buyers')
        .select('*')
        .or(`auth_id.eq.${authUser.id},email.eq.${authUser.email}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn('Buyer profile fetch error:', error.message);
      }

      if (!buyer) {
        router.replace('/buyer-onboarding?next=/buyer-dashboard');
        return;
      }

      setProfile(buyer);
      setLoadingProfile(false);
    })();

    return () => { cancelled = true; };
  }, [authUser, router]);

  // 3) Load saved listings (robust across historical schemas)
  useEffect(() => {
    if (!authUser || !profile) return;
    let cancelled = false;

    const fetchSavedListings = async () => {
      setLoadingSaved(true);

      // We'll try several selectors because older rows may have different columns populated.
      // Order of precedence:
      //   A) buyer_auth_id == authUser.id  OR  buyer_email == profile.email
      //   B) buyer_id == buyers.id (legacy)
      //   C) user_id == authUser.id (very old)
      let rows = [];
      let lastErr = null;

      // A) auth id or email (preferred)
      {
        const { data, error } = await supabase
          .from('saved_listings')
          .select('*')
          .or(`buyer_auth_id.eq.${authUser.id},buyer_email.eq.${profile.email}`)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          rows = data;
        } else if (error) {
          lastErr = error;
          console.warn('Saved listings (auth/email) error:', error.message);
        }
      }

      // B) by buyers.id (legacy)
      if (rows.length === 0) {
        const { data, error } = await supabase
          .from('saved_listings')
          .select('*')
          .eq('buyer_id', profile.id)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          rows = data;
        } else if (error && !/column .*buyer_id.* does not exist/i.test(error.message || '')) {
          // Only log if it's not just a "column doesn't exist" case
          lastErr = error;
          console.warn('Saved listings (buyer_id) error:', error.message);
        }
      }

      // C) by user_id (very old)
      if (rows.length === 0) {
        const { data, error } = await supabase
          .from('saved_listings')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          rows = data;
        } else if (error && !/column .*user_id.* does not exist/i.test(error.message || '')) {
          lastErr = error;
          console.warn('Saved listings (user_id) error:', error.message);
        }
      }

      if (rows.length === 0) {
        if (lastErr) console.debug('Saved listings lookup ended with no rows.');
        setSavedListings([]);
        setLoadingSaved(false);
        return;
      }

      // Collect unique listing IDs (string/number-safe)
      const ids = Array.from(
        new Set(
          rows
            .map(r => (r?.listing_id != null ? String(r.listing_id) : null))
            .filter(Boolean)
        )
      );

      if (ids.length === 0) {
        setSavedListings([]);
        setLoadingSaved(false);
        return;
      }

      // Fetch seller rows for the saved listing ids
      // Convert ids to numbers when possible, but keep fallbacks as strings
      const idsAsNumber = ids.map(x => {
        const n = Number(x);
        return Number.isFinite(n) ? n : x; // keeps uuid/strings untouched
      });

      const { data: sellers, error: sellersErr } = await supabase
        .from('sellers')
        .select('id,business_name,location,asking_price,image_urls')
        .in('id', idsAsNumber);

      if (sellersErr) {
        console.warn('Saved sellers fetch error:', sellersErr.message);
        setSavedListings([]);
        setLoadingSaved(false);
        return;
      }

      // Preserve original saved order while de-duping
      const byId = new Map((sellers || []).map(s => [String(s.id), s]));
      const ordered = ids
        .map(id => byId.get(String(id)))
        .filter(Boolean);

      if (!cancelled) {
        setSavedListings(ordered);
        setLoadingSaved(false);
      }
    };

    fetchSavedListings();
    return () => { cancelled = true; };
  }, [authUser, profile]);

  // 4) Load recent messages (by buyer email)
  useEffect(() => {
    if (!profile?.email) return;
    let cancelled = false;

    (async () => {
      setLoadingMessages(true);
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('buyer_email', profile.email)
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        console.warn('Messages fetch error:', error.message);
        setMessages([]);
      } else {
        setMessages(msgs || []);
      }
      setLoadingMessages(false);
    })();

    return () => { cancelled = true; };
  }, [profile?.email]);

  // 5) Matches for You via API (NEW)
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingMatches(true);
        const resp = await fetch(`/api/get-matches?userId=${encodeURIComponent(authUser.id)}&limit=16`);
        if (!resp.ok) {
          setMatches([]);
          setLoadingMatches(false);
          return;
        }
        const json = await resp.json();
        if (!cancelled) {
          setMatches(Array.isArray(json.matches) ? json.matches : []);
          setLoadingMatches(false);
        }
      } catch {
        if (!cancelled) {
          setMatches([]);
          setLoadingMatches(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [authUser]);

  // Group messages by listing (latest only)
  const latestByListing = useMemo(() => {
    const by = new Map();
    for (const m of messages) {
      const key = String(m.listing_id || '');
      if (!key) continue;
      const prev = by.get(key);
      if (!prev || new Date(m.created_at) > new Date(prev.created_at)) {
        by.set(key, m);
      }
    }
    return Array.from(by.entries())
      .sort((a, b) => new Date(b[1].created_at) - new Date(a[1].created_at));
  }, [messages]);

  if (loadingAuth || loadingProfile) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
          <p className="text-gray-600">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
          <p className="text-gray-700">
            We couldn’t find your buyer profile.{` `}
            <Link href="/buyer-onboarding?next=/buyer-dashboard">
              <a className="text-blue-600 underline">Create it now</a>
            </Link>.
          </p>
        </div>
      </main>
    );
  }

  const placeholder = '/images/placeholders/listing-placeholder.jpg';

  return (
    <main className="min-h-screen bg-blue-50 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header / Actions */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Buyer Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back{profile?.name ? `, ${profile.name}` : ''}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/buyer-onboarding?next=/buyer-dashboard">
              <a className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                ✏️ Edit Profile
              </a>
            </Link>
            <Link href="/listings">
              <a className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold">
                🔎 Browse Listings
              </a>
            </Link>
          </div>
        </div>

        {/* Profile summary */}
        <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-blue-700 mb-3">Your Buying Preferences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <InfoTile label="Location" value={`${profile.city || '—'}${(profile.city && profile.state_or_province) ? ', ' : ''}${profile.state_or_province || '—'}`} />
            <InfoTile label="Financing" value={profile.financing_type || '—'} />
            <InfoTile label="Budget" value={profile.budget_for_purchase ? `$${Number(profile.budget_for_purchase).toLocaleString()}` : '—'} />
            <InfoTile label="Capital" value={profile.capital_investment ? `$${Number(profile.capital_investment).toLocaleString()}` : '—'} />
            <InfoTile label="Industry" value={profile.industry_preference || '—'} />
            <InfoTile label="Relocate?" value={profile.willing_to_relocate || '—'} />
          </div>
          <p className="text-xs text-gray-500 mt-3">Update your profile anytime to improve matching with sellers.</p>
        </section>

        {/* Matches for You (NEW) */}
        <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Matches for You</h2>
            <Link href="/listings">
              <a className="text-blue-600 hover:underline text-sm font-semibold">See all →</a>
            </Link>
          </div>

          {loadingMatches ? (
            <p className="text-gray-600">Finding matches…</p>
          ) : matches.length === 0 ? (
            <p className="text-gray-600">
              No strong matches yet. Try broadening your industry/price/location in{' '}
              <Link href="/buyer-onboarding?next=/buyer-dashboard"><a className="text-blue-600 underline">Edit Profile</a></Link>.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {matches.map((lst) => {
                const cover = Array.isArray(lst.image_urls) && lst.image_urls.length > 0 ? lst.image_urls[0] : placeholder;
                return (
                  <Link key={lst.id} href={`/listings/${lst.id}`}>
                    <a className="group block rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm transform transition duration-200 md:hover:-translate-y-0.5 md:hover:shadow-lg">
                      <div className="bg-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cover}
                          alt={lst.business_name || 'Business listing'}
                          className="w-full h-auto aspect-[4/3] object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = '/images/placeholders/listing-placeholder.jpg'; }}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-[15px] font-semibold text-blue-700 line-clamp-2 min-h-[40px]">
                          {lst.business_name || 'Unnamed Business'}
                        </h3>
                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="text-[14px] font-semibold text-gray-900">
                            {lst.asking_price ? `$${Number(lst.asking_price).toLocaleString()}` : 'Inquire'}
                          </p>
                          <p className="text-[13px] text-gray-600 truncate max-w-[60%] text-right">
                            {lst.location || lst.state_or_province || 'Location undisclosed'}
                          </p>
                        </div>
                      </div>
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Saved listings */}
        <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Saved Listings</h2>
            <Link href="/listings">
              <a className="text-blue-600 hover:underline text-sm font-semibold">See all →</a>
            </Link>
          </div>

          {loadingSaved ? (
            <p className="text-gray-600">Loading saved listings…</p>
          ) : savedListings.length === 0 ? (
            <p className="text-gray-600">
              You haven’t saved any listings yet.{` `}
              <Link href="/listings"><a className="text-blue-600 underline">Browse available businesses</a></Link>.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {savedListings.map((lst) => {
                const cover = Array.isArray(lst.image_urls) && lst.image_urls.length > 0 ? lst.image_urls[0] : placeholder;
                return (
                  <Link key={lst.id} href={`/listings/${lst.id}`}>
                    <a className="group block rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm transform transition duration-200 md:hover:-translate-y-0.5 md:hover:shadow-lg">
                      <div className="bg-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cover}
                          alt={lst.business_name || 'Business listing'}
                          className="w-full h-auto aspect-[4/3] object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = '/images/placeholders/listing-placeholder.jpg'; }}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-[15px] font-semibold text-blue-700 line-clamp-2 min-h-[40px]">
                          {lst.business_name || 'Unnamed Business'}
                        </h3>
                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="text-[14px] font-semibold text-gray-900">
                            {lst.asking_price ? `$${Number(lst.asking_price).toLocaleString()}` : 'Inquire'}
                          </p>
                          <p className="text-[13px] text-gray-600 truncate max-w-[60%] text-right">
                            {lst.location || 'Location undisclosed'}
                          </p>
                        </div>
                      </div>
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent conversations */}
        <RecentConversations profileEmail={profile?.email} />
      </div>
    </main>
  );
}

function RecentConversations({ profileEmail }) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    if (!profileEmail) return;
    let cancelled = false;

    (async () => {
      setLoadingMessages(true);
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('buyer_email', profileEmail)
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        console.warn('Messages fetch error:', error.message);
        setMessages([]);
      } else {
        setMessages(msgs || []);
      }
      setLoadingMessages(false);
    })();

    return () => { cancelled = true; };
  }, [profileEmail]);

  // Group messages by listing (latest only)
  const latestByListing = useMemo(() => {
    const by = new Map();
    for (const m of messages) {
      const key = String(m.listing_id || '');
      if (!key) continue;
      const prev = by.get(key);
      if (!prev || new Date(m.created_at) > new Date(prev.created_at)) {
        by.set(key, m);
      }
    }
    return Array.from(by.entries())
      .sort((a, b) => new Date(b[1].created_at) - new Date(a[1].created_at));
  }, [messages]);

  return (
    <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-800">Recent Conversations</h2>
        <Link href="/listings">
          <a className="text-blue-600 hover:underline text-sm font-semibold">Find more opportunities →</a>
        </Link>
      </div>

      {loadingMessages ? (
        <p className="text-gray-600">Loading messages…</p>
      ) : latestByListing.length === 0 ? (
        <p className="text-gray-600">No conversations yet. Start by contacting a seller on a listing.</p>
      ) : (
        <div className="divide-y">
          {latestByListing.map(([lid, last]) => (
            <div key={lid} className="py-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">Listing #{lid}</div>
                <div className="text-gray-900">{last.message || '(Attachment sent)'}</div>
                <div className="text-[11px] text-gray-400">
                  {new Date(last.created_at).toLocaleString()}
                </div>
              </div>
              <Link href={`/listings/${lid}`}>
                <a className="shrink-0 inline-flex items-center bg-white border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg text-sm font-medium">
                  Open
                </a>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Small presentational tile */
function InfoTile({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium text-gray-900">{value}</div>
    </div>
  );
}

/**
 * Force SSR so Next doesn't try to pre-render/SSG this page at build time.
 * All Supabase calls run on the client via useEffect.
 */
export async function getServerSideProps() {
  return { props: {} };
}
