// pages/buyer-dashboard.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import supabase from '../lib/supabaseClient';

export default function BuyerDashboard() {
  const router = useRouter();

  // Mount guard so we only run client-side transitions after hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Auth + profile
  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Saved listings
  const [savedListings, setSavedListings] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [unsaving, setUnsaving] = useState({}); // map of listingId -> boolean

  // Recent messages
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Suggested matches
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // NEW: track whether we should navigate to login or onboarding AFTER mount
  const [needsLogin, setNeedsLogin] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // 1) Auth check (purely client-side, guarded)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        const user = data?.user || null;
        setAuthUser(user);
        setLoadingAuth(false);
        if (!user) {
          // Don’t redirect immediately; mark intent and let UI render a safe fallback
          setNeedsLogin(true);
        }
      } catch {
        setAuthUser(null);
        setLoadingAuth(false);
        setNeedsLogin(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 2) Load buyer profile; set intent to onboarding if none exists
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    (async () => {
      setLoadingProfile(true);
      try {
        const { data: buyer, error } = await supabase
          .from('buyers')
          .select('*')
          .or(`auth_id.eq.${authUser.id},email.eq.${authUser.email}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          // Soft-fail: show onboarding path if we can’t fetch
          setProfile(null);
          setNeedsOnboarding(true);
        } else if (!buyer) {
          setProfile(null);
          setNeedsOnboarding(true);
        } else {
          setProfile(buyer);
          setNeedsOnboarding(false);
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authUser]);

  // 3) Perform navigations only AFTER mount & after loading states settle
  useEffect(() => {
    if (!mounted) return;
    if (loadingAuth || loadingProfile) return;

    // If not logged in, send to login with return
    if (needsLogin) {
      router.replace('/login?next=/buyer-dashboard').catch(() => {});
      return;
    }
    // If logged-in but no profile, send to onboarding
    if (!needsLogin && needsOnboarding) {
      router.replace('/buyer-onboarding?next=/buyer-dashboard').catch(() => {});
    }
  }, [mounted, loadingAuth, loadingProfile, needsLogin, needsOnboarding, router]);

  // 4) Load saved listings (robust across historical schemas)
  useEffect(() => {
    if (!authUser || !profile) return;
    let cancelled = false;

    const fetchSavedListings = async () => {
      setLoadingSaved(true);

      let rows = [];
      let lastErr = null;

      // A) auth id or email (preferred)
      try {
        const { data, error } = await supabase
          .from('saved_listings')
          .select('*')
          .or(`buyer_auth_id.eq.${authUser.id},buyer_email.eq.${profile.email}`)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          rows = data;
        } else if (error) {
          lastErr = error;
          // continue to legacy shapes
        }
      } catch (e) {
        lastErr = e;
      }

      // B) by buyers.id (legacy)
      if (rows.length === 0) {
        try {
          const { data, error } = await supabase
            .from('saved_listings')
            .select('*')
            .eq('buyer_id', profile.id)
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data) && data.length > 0) {
            rows = data;
          }
        } catch (e) {}
      }

      // C) by user_id (very old)
      if (rows.length === 0) {
        try {
          const { data, error } = await supabase
            .from('saved_listings')
            .select('*')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data) && data.length > 0) {
            rows = data;
          }
        } catch (e) {}
      }

      if (rows.length === 0) {
        if (!cancelled) {
          setSavedListings([]);
          setLoadingSaved(false);
        }
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
        if (!cancelled) {
          setSavedListings([]);
          setLoadingSaved(false);
        }
        return;
      }

      // Fetch sellers for those ids
      const idsAsNumber = ids.map(x => {
        const n = Number(x);
        return Number.isFinite(n) ? n : x;
      });

      try {
        const { data: sellers, error: sellersErr } = await supabase
          .from('sellers')
          .select('id,business_name,location,asking_price,image_urls')
          .in('id', idsAsNumber);

        if (!cancelled) {
          if (sellersErr) {
            setSavedListings([]);
          } else {
            const byId = new Map((sellers || []).map(s => [String(s.id), s]));
            const ordered = ids.map(id => byId.get(String(id))).filter(Boolean);
            setSavedListings(ordered);
          }
          setLoadingSaved(false);
        }
      } catch {
        if (!cancelled) {
          setSavedListings([]);
          setLoadingSaved(false);
        }
      }
    };

    fetchSavedListings();
    return () => { cancelled = true; };
  }, [authUser, profile]);

  // 🔘 Unsave from dashboard
  const handleUnsave = async (listingId) => {
    if (!authUser || !profile) {
      alert('Please sign in first.');
      return;
    }

    const idStr = String(listingId);
    setUnsaving(prev => ({ ...prev, [idStr]: true }));

    const n = Number(listingId);
    const listingValue = Number.isFinite(n) ? n : listingId;

    try {
      const { error } = await supabase
        .from('saved_listings')
        .delete()
        .eq('listing_id', listingValue)
        .or(`buyer_auth_id.eq.${authUser.id},buyer_email.eq.${profile.email}`);

      if (error) throw error;

      setSavedListings(prev => prev.filter(x => String(x.id) !== idStr));
    } catch (err) {
      console.error('Unsave failed:', err);
      alert("Couldn't remove this listing.");
    } finally {
      setUnsaving(prev => {
        const p = { ...prev };
        delete p[idStr];
        return p;
      });
    }
  };

  // 5) Load recent messages (by buyer email)
  useEffect(() => {
    if (!profile?.email) return;
    let cancelled = false;

    (async () => {
      setLoadingMessages(true);
      try {
        const { data: msgs, error } = await supabase
          .from('messages')
          .select('*')
          .eq('buyer_email', profile.email)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!cancelled) {
          if (error) setMessages([]);
          else setMessages(msgs || []);
          setLoadingMessages(false);
        }
      } catch {
        if (!cancelled) {
          setMessages([]);
          setLoadingMessages(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.email]);

  // 6) Suggested matches
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const fetchAndScore = async () => {
      setLoadingMatches(true);

      try {
        const { data: sellers, error } = await supabase
          .from('sellers')
          .select('id,business_name,location,city,state_or_province,asking_price,industry,financing_type,seller_financing_considered,image_urls,created_at')
          .order('created_at', { ascending: false })
          .limit(250);

        if (cancelled) return;

        if (error) {
          setMatches([]);
          setLoadingMatches(false);
          return;
        }

        const scored = (sellers || [])
          .map(l => ({
            listing: l,
            ...scoreListingAgainstProfile(l, profile)
          }))
          .filter(x => x.score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const ba = budgetDistance(profile, b.listing);
            const aa = budgetDistance(profile, a.listing);
            if (aa !== ba) return aa - ba;
            return new Date(b.listing.created_at) - new Date(a.listing.created_at);
          });

        if (!cancelled) {
          setMatches(scored.slice(0, 8));
          setLoadingMatches(false);
        }
      } catch {
        if (!cancelled) {
          setMatches([]);
          setLoadingMatches(false);
        }
      }
    };

    fetchAndScore();
    return () => { cancelled = true; };
  }, [profile]);

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

  // ---------- Render gates (always return *something*) ----------

  // While auth/profile are resolving: stable loading UI (prevents hydration mismatch)
  if (!mounted || loadingAuth || loadingProfile) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
          <p className="text-gray-600">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  // If not logged in, render a safe screen (we also programmatically redirected already)
  if (needsLogin && !authUser) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
          <h1 className="text-2xl font-bold text-blue-800 mb-2">Sign in required</h1>
          <p className="text-gray-700 mb-4">Please sign in to view your buyer dashboard.</p>
          <Link href="/login?next=/buyer-dashboard">
            <a className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
              Go to Login
            </a>
          </Link>
        </div>
      </main>
    );
  }

  // If logged-in but no profile, render a safe screen (we also redirected already)
  if (!needsLogin && needsOnboarding) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow">
          <h1 className="text-2xl font-bold text-blue-800 mb-2">Complete your buyer profile</h1>
          <p className="text-gray-700 mb-4">We couldn’t find a buyer profile for your account.</p>
          <Link href="/buyer-onboarding?next=/buyer-dashboard">
            <a className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
              Start Onboarding
            </a>
          </Link>
        </div>
      </main>
    );
  }

  // At this point we are logged-in AND have a profile
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

        {/* ⚠️ Deactivated banner */}
        {profile?.is_deleted && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4">
            Your buyer profile is <strong>deactivated</strong>. Matching and emails are paused.
            <button
              className="ml-3 px-3 py-1.5 border rounded bg-white hover:bg-gray-50"
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return alert('Please sign in first.');
                const { error } = await supabase
                  .from('buyers')
                  .update({ is_deleted: false, deleted_at: null })
                  .eq('auth_id', user.id);
                if (error) return alert('Could not reactivate.');
                alert('Reactivated! Refreshing…');
                window.location.reload();
              }}
            >
              Reactivate
            </button>
          </div>
        )}

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

        {/* Suggested Matches */}
        <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Suggested Matches</h2>
            <Link href="/listings">
              <a className="text-blue-600 hover:underline text-sm font-semibold">See marketplace →</a>
            </Link>
          </div>

          {loadingMatches ? (
            <p className="text-gray-600">Finding matches…</p>
          ) : matches.length === 0 ? (
            <p className="text-gray-600">
              No strong matches yet. Try broadening your priorities or browse the marketplace.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {matches.map(({ listing, score, reasons }) => {
                const cover = Array.isArray(listing.image_urls) && listing.image_urls.length > 0 ? listing.image_urls[0] : placeholder;
                return (
                  <div key={listing.id} className="group block rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm transform transition duration-200 md:hover:-translate-y-0.5 md:hover:shadow-lg">
                    <Link href={`/listings/${listing.id}`}>
                      <a>
                        <div className="bg-gray-100 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cover}
                            alt={listing.business_name || 'Business listing'}
                            className="w-full h-auto aspect-[4/3] object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = '/images/placeholders/listing-placeholder.jpg'; }}
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="text-[15px] font-semibold text-blue-700 line-clamp-2 min-h-[40px]">
                            {listing.business_name || 'Unnamed Business'}
                          </h3>
                          <div className="mt-1.5 flex items-center justify-between">
                            <p className="text-[14px] font-semibold text-gray-900">
                              {listing.asking_price ? `$${toNum(listing.asking_price).toLocaleString()}` : 'Inquire'}
                            </p>
                            <p className="text-[13px] text-gray-600 truncate max-w-[60%] text-right">
                              {listing.location || composeLocation(listing)}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {reasons.map((r, i) => (
                              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </a>
                    </Link>

                    {/* Propose Deal CTA */}
                    <div className="p-3 pt-0">
                      <Link href={`/deal-maker?listingId=${listing.id}`}>
                        <a className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm font-semibold">
                          🤝 Propose a Deal
                        </a>
                      </Link>
                    </div>
                  </div>
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
                const idStr = String(lst.id);
                const isWorking = !!unsaving[idStr];

                return (
                  <div key={lst.id} className="group relative rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm transform transition duration-200 md:hover:-translate-y-0.5 md:hover:shadow-lg">
                    {/* UNSAVE button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnsave(lst.id);
                      }}
                      disabled={isWorking}
                      className={`absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded-md border shadow-sm ${
                        isWorking
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-white/90 hover:bg-white text-gray-700'
                      }`}
                    >
                      {isWorking ? 'Removing…' : 'Unsave'}
                    </button>

                    <Link href={`/listings/${lst.id}`}>
                      <a>
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

                    {/* Propose Deal CTA */}
                    <div className="p-3 pt-0">
                      <Link href={`/deal-maker?listingId=${lst.id}`}>
                        <a className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm font-semibold">
                          🤝 Propose a Deal
                        </a>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent conversations */}
        <RecentConversations profileEmail={profile?.email} />

        {/* Danger Zone: deactivate or delete */}
        <BuyerDangerZone />
      </div>
    </main>
  );
}

/* ---------- Matching helpers ---------- */

function toNum(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function lc(x) {
  return String(x || '').toLowerCase().trim();
}

function parseCSV(str) {
  return String(str || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function composeLocation(l) {
  const city = l?.city || '';
  const st = l?.state_or_province || '';
  if (city && st) return `${city}, ${st}`;
  return city || st || 'Location undisclosed';
}

function prioritiesWeights(profile) {
  const p1 = lc(profile?.priority_one);
  const p2 = lc(profile?.priority_two);
  const p3 = lc(profile?.priority_three);
  const base = { location: 0, price: 0, industry: 0, financing: 0 };

  if (!p1 && !p2 && !p3) {
    return { location: 1, price: 2, industry: 2, financing: 1 };
  }
  if (p1) base[p1] = 3;
  if (p2 && base[p2] === 0) base[p2] = 2;
  if (p3 && base[p3] === 0) base[p3] = 1;
  return base;
}

function financingCompatible(profileFinancing, listing) {
  const pf = lc(profileFinancing);
  const lf = lc(listing?.financing_type);
  const sellerConsidered = lc(listing?.seller_financing_considered);

  if (!pf) return true;
  if (pf === 'seller-financing') {
    return sellerConsidered === 'yes' || sellerConsidered === 'maybe' || lf === 'seller-financing';
  }
  if (pf === 'rent-to-own') {
    return lf === 'rent-to-own' || sellerConsidered === 'yes' || sellerConsidered === 'maybe';
  }
  if (pf === 'third-party') {
    return lf === 'third-party' || lf === 'buyer-financed' || !lf;
  }
  if (pf === 'self-financing') {
    return true;
  }
  return true;
}

function industryMatchTokens(profileIndustryCSV, listingIndustry) {
  const tokens = parseCSV(profileIndustryCSV).map(lc);
  const li = lc(listingIndustry);
  if (!tokens.length || !li) return false;
  return tokens.some(tok => li.includes(tok));
}

function locationMatch(profile, listing) {
  const pc = lc(profile?.city);
  const ps = lc(profile?.state_or_province);
  const lcCity = lc(listing?.city);
  const lcState = lc(listing?.state_or_province);
  if (!pc && !ps) return false;
  if (pc && lcCity && lcCity.includes(pc)) return true;
  if (ps && lcState && lcState.includes(ps)) return true;
  return false;
}

function budgetOK(profile, listing) {
  const budget = Number(profile?.budget_for_purchase || 0);
  if (!Number.isFinite(budget) || budget <= 0) return false;
  const ask = toNum(listing?.asking_price);
  if (!ask) return false;
  return ask <= budget;
}

function budgetDistance(profile, listing) {
  const budget = Number(profile?.budget_for_purchase || 0);
  const ask = toNum(listing?.asking_price);
  if (!ask || !budget) return Number.POSITIVE_INFINITY;
  return Math.max(0, ask - budget);
}

function scoreListingAgainstProfile(listing, profile) {
  const w = prioritiesWeights(profile);
  let score = 0;
  const reasons = [];

  if (industryMatchTokens(profile?.industry_preference, listing?.industry)) {
    score += w.industry || 0;
    reasons.push('✅ Industry match');
  }

  if (budgetOK(profile, listing)) {
    score += w.price || 0;
    reasons.push('💸 Within budget');
  }

  const willing = lc(profile?.willing_to_relocate) === 'yes';
  if (locationMatch(profile, listing)) {
    const locWeight = willing ? Math.max(1, (w.location || 0) - 1) : (w.location || 0);
    if (locWeight > 0) {
      score += locWeight;
      reasons.push('📍 Location match');
    }
  }

  if (financingCompatible(profile?.financing_type, listing)) {
    if (w.financing > 0) {
      score += w.financing;
      reasons.push('🤝 Financing compatible');
    } else {
      if (!profile?.priority_one && !profile?.priority_two && !profile?.priority_three) {
        score += 1;
        reasons.push('🤝 Financing compatible');
      }
    }
  }

  return { score, reasons };
}

/* ---------- Recent conversations ---------- */

function RecentConversations({ profileEmail }) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    if (!profileEmail) return;
    let cancelled = false;

    (async () => {
      setLoadingMessages(true);
      try {
        const { data: msgs, error } = await supabase
          .from('messages')
          .select('*')
          .eq('buyer_email', profileEmail)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!cancelled) {
          if (error) setMessages([]);
          else setMessages(msgs || []);
          setLoadingMessages(false);
        }
      } catch {
        if (!cancelled) {
          setMessages([]);
          setLoadingMessages(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [profileEmail]);

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
              <Link href={`/messages?listingId=${lid}&buyerEmail=${encodeURIComponent(profileEmail)}`}>
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

/* ---------- Danger Zone (deactivate/delete) ---------- */

function BuyerDangerZone() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [action, setAction] = useState('deactivate'); // 'deactivate' | 'delete'
  const [reason, setReason] = useState('bought');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const REASONS = [
    { value: 'bought', label: 'I bought a business' },
    { value: 'not-looking', label: 'No longer looking' },
    { value: 'inventory', label: 'Didn’t see enough inventory' },
    { value: 'emails', label: 'Too many emails/notifications' },
    { value: 'privacy', label: 'Privacy concerns' },
    { value: 'other', label: 'Other (describe below)' },
  ];

  const next = () => setStep(s => Math.min(3, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  const doDeactivate = async () => {
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in first.');
        return;
      }
      const { error } = await supabase
        .from('buyers')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deletion_reason: reason,
          deletion_notes: notes || null
        })
        .eq('auth_id', user.id);

      if (error) throw error;
      alert('Your profile has been deactivated. You can reactivate anytime.');
    } catch (e) {
      console.error(e);
      alert('Could not deactivate your profile right now.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Please sign in first.');
        return;
      }
      const r = await fetch('/api/buyer/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ reason, notes })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Delete failed');
      alert('Your account has been deleted.');
      window.location.href = '/';
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-red-700">Close Account</h2>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-sm px-3 py-1.5 border rounded-lg"
        >
          {open ? 'Hide' : 'Start'}
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        You can <strong>deactivate</strong> (pause matching & emails) or <strong>delete</strong> your account (irreversible).
      </p>

      {open && (
        <div className="space-y-5">
          {step === 1 && (
            <div>
              <h3 className="font-medium mb-2">Step 1: Choose an option</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="action"
                    value="deactivate"
                    checked={action === 'deactivate'}
                    onChange={() => setAction('deactivate')}
                  />
                  <span>Deactivate my buyer profile (can be reactivated later)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="action"
                    value="delete"
                    checked={action === 'delete'}
                    onChange={() => setAction('delete')}
                  />
                  <span>Delete my account permanently (irreversible)</span>
                </label>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-medium mb-2">Step 2: Tell us why</h3>
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm mb-1">Reason</label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full border p-3 rounded"
                  >
                    {REASONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Anything else? (optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border p-3 rounded"
                    placeholder="This helps us improve."
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={back} className="px-4 py-2 border rounded-lg">Back</button>
                <button onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-medium mb-2">Step 3: Confirm</h3>
              <p className="text-sm text-gray-700 mb-3">
                Action: <strong>{action === 'deactivate' ? 'Deactivate profile' : 'Delete account permanently'}</strong><br/>
                Reason: <strong>{reason}</strong>{notes ? <> — {notes}</> : null}
              </p>
              <div className="flex gap-2">
                <button onClick={back} className="px-4 py-2 border rounded-lg">Back</button>
                {action === 'deactivate' ? (
                  <button
                    disabled={busy}
                    onClick={doDeactivate}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg disabled:opacity-60"
                  >
                    {busy ? 'Working…' : 'Deactivate'}
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (confirm('Delete your account permanently? This cannot be undone.')) {
                        doDelete();
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-60"
                  >
                    {busy ? 'Working…' : 'Delete permanently'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Force SSR so Next doesn't try to pre-render/SSG this page at build time.
 * All Supabase calls run on the client via useEffect.
 */
export async function getServerSideProps() {
  return { props: {} };
}

