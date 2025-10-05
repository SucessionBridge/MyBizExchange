// pages/buyer-dashboard.js
import { useEffect, useMemo, useState, useCallback } from 'react';
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
  const [unsaving, setUnsaving] = useState({}); // map of listingId -> boolean

  // Recent messages
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Suggested matches (raw + filtered)
  const [matches, setMatches] = useState([]); // [{ listing, score, reasons }]
  const [loadingMatches, setLoadingMatches] = useState(true);

  // For KPI "New this week"
  const [allSellersForKPI, setAllSellersForKPI] = useState([]);

  // ---------- NEW: Filter state (client-side, URL-persisted) ----------
  const [fIndustry, setFIndustry] = useState([]); // array of strings
  const [fLocations, setFLocations] = useState([]); // array of city/state tokens
  const [fPriceMin, setFPriceMin] = useState('');
  const [fPriceMax, setFPriceMax] = useState('');
  const [fRevMin, setFRevMin] = useState('');
  const [fFinancing, setFFinancing] = useState(''); // '', 'seller', 'third-party', 'rent-to-own', 'self'
  const [fSort, setFSort] = useState('newest'); // 'newest' | 'priceAsc' | 'priceDesc' | 'profitAsc' | 'profitDesc'

  // Read filters from URL on mount
  useEffect(() => {
    const q = router.query;
    const csv = (v) => (typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : []);
    if (q.ind) setFIndustry(csv(q.ind));
    if (q.loc) setFLocations(csv(q.loc));
    if (q.price) {
      const [a, b] = String(q.price).split('-');
      setFPriceMin(a || '');
      setFPriceMax(b || '');
    }
    if (q.revMin) setFRevMin(String(q.revMin));
    if (q.fin) setFFinancing(String(q.fin).toLowerCase());
    if (q.sort) setFSort(String(q.sort));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push filters to URL when they change (replaceState to avoid history spam)
  useEffect(() => {
    const params = new URLSearchParams();
    if (fIndustry.length) params.set('ind', fIndustry.join(','));
    if (fLocations.length) params.set('loc', fLocations.join(','));
    if (fPriceMin || fPriceMax) params.set('price', `${fPriceMin || 0}-${fPriceMax || ''}`);
    if (fRevMin) params.set('revMin', String(fRevMin));
    if (fFinancing) params.set('fin', fFinancing);
    if (fSort && fSort !== 'newest') params.set('sort', fSort);
    const qs = params.toString();
    const href = qs ? `/buyer-dashboard?${qs}` : '/buyer-dashboard';
    router.replace(href, undefined, { shallow: true });
  }, [fIndustry, fLocations, fPriceMin, fPriceMax, fRevMin, fFinancing, fSort, router]);

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

      // Fetch sellers for those ids
      const idsAsNumber = ids.map(x => {
        const n = Number(x);
        return Number.isFinite(n) ? n : x;
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

  // 🔘 Unsave from dashboard
  const handleUnsave = async (listingId) => {
    if (!authUser || !profile) {
      alert('Please sign in first.');
      return;
    }

    const idStr = String(listingId);
    setUnsaving(prev => ({ ...prev, [idStr]: true }));

    // normalize id shape to match your saved_listings.listing_id type
    const n = Number(listingId);
    const listingValue = Number.isFinite(n) ? n : listingId;

    try {
      const { error } = await supabase
        .from('saved_listings')
        .delete()
        .eq('listing_id', listingValue)
        .or(`buyer_auth_id.eq.${authUser.id},buyer_email.eq.${profile.email}`);

      if (error) throw error;

      // update UI
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

  // 5) Suggested matches (client-side scoring, priority-aware)
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const fetchAndScore = async () => {
      setLoadingMatches(true);

      const { data: sellers, error } = await supabase
        .from('sellers')
        .select('id,business_name,location,city,state_or_province,asking_price,annual_profit,industry,financing_type,seller_financing_considered,image_urls,created_at')
        .order('created_at', { ascending: false })
        .limit(250);

      if (error) {
        console.warn('Sellers fetch for matches error:', error.message);
        setMatches([]);
        setAllSellersForKPI([]);
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
        setMatches(scored);
        setAllSellersForKPI(sellers || []);
        setLoadingMatches(false);
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

  // ---------- NEW: Profile completeness ----------
  const profileScore = useMemo(() => {
    if (!profile) return 0;
    let s = 0;
    if (Number(profile?.budget_for_purchase) > 0) s += 25;
    if (String(profile?.industry_preference || '').trim()) s += 25;
    if (String(profile?.city || profile?.state_or_province || '').trim()) s += 25;
    if (String(profile?.financing_type || '').trim()) s += 25;
    return s;
  }, [profile]);

  const completenessTips = useMemo(() => {
    if (!profile) return [];
    const tips = [];
    if (!(Number(profile?.budget_for_purchase) > 0)) tips.push('Add your target budget');
    if (!String(profile?.industry_preference || '').trim()) tips.push('Choose 1–3 industries');
    if (!String(profile?.city || profile?.state_or_province || '').trim()) tips.push('Set your preferred location');
    if (!String(profile?.financing_type || '').trim()) tips.push('Select preferred financing');
    return tips.slice(0, 3);
  }, [profile]);

  // ---------- NEW: Filtered matches (client-side) ----------
  const filteredMatches = useMemo(() => {
    const norm = (s) => String(s || '').toLowerCase();
    const inPrice = (ask) => {
      const n = toNum(ask);
      const min = toNum(fPriceMin);
      const max = toNum(fPriceMax) || Number.POSITIVE_INFINITY;
      return n >= (min || 0) && n <= max;
    };
    const inRev = (rev) => {
      const n = toNum(rev);
      const min = toNum(fRevMin);
      return n >= (min || 0);
    };
    const locHit = (l) => {
      if (!fLocations.length) return true;
      const city = norm(l?.city);
      const st = norm(l?.state_or_province);
      const loc = norm(l?.location);
      return fLocations.some(tok => (city && city.includes(norm(tok))) || (st && st.includes(norm(tok))) || (loc && loc.includes(norm(tok))));
    };
    const indHit = (l) => {
      if (!fIndustry.length) return true;
      const li = norm(l?.industry);
      return fIndustry.some(tok => li.includes(norm(tok)));
    };
    const finHit = (l) => {
      if (!fFinancing) return true;
      const lf = norm(l?.financing_type);
      const sellerConsidered = norm(l?.seller_financing_considered);
      if (fFinancing === 'seller') return sellerConsidered === 'yes' || sellerConsidered === 'maybe' || lf.includes('seller');
      if (fFinancing === 'third-party') return lf.includes('third') || lf.includes('buyer');
      if (fFinancing === 'rent-to-own') return lf.includes('rent');
      if (fFinancing === 'self') return true;
      return true;
    };

    let arr = matches.filter(m =>
      indHit(m.listing) &&
      locHit(m.listing) &&
      inPrice(m.listing.asking_price) &&
      inRev(m.listing.annual_profit) &&
      finHit(m.listing)
    );

    // Sort
    const byNum = (v) => toNum(v);
    if (fSort === 'priceAsc') arr = arr.slice().sort((a, b) => byNum(a.listing.asking_price) - byNum(b.listing.asking_price));
    else if (fSort === 'priceDesc') arr = arr.slice().sort((a, b) => byNum(b.listing.asking_price) - byNum(a.listing.asking_price));
    else if (fSort === 'profitAsc') arr = arr.slice().sort((a, b) => byNum(a.listing.annual_profit) - byNum(b.listing.annual_profit));
    else if (fSort === 'profitDesc') arr = arr.slice().sort((a, b) => byNum(b.listing.annual_profit) - byNum(a.listing.annual_profit));
    // default 'newest' keeps server order (already newest first)

    return arr;
  }, [matches, fIndustry, fLocations, fPriceMin, fPriceMax, fRevMin, fFinancing, fSort]);

  const clearFilters = useCallback(() => {
    setFIndustry([]); setFLocations([]); setFPriceMin(''); setFPriceMax(''); setFRevMin(''); setFFinancing(''); setFSort('newest');
  }, []);

  // ---------- NEW: KPI computations ----------
  const kpiSaved = savedListings.length;
  const kpiMatches = filteredMatches.length; // show filtered count (more intuitive with filter bar)
  const kpiConvos = latestByListing.length;
  const kpiNewThisWeek = useMemo(() => {
    if (!Array.isArray(allSellersForKPI)) return 0;
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    return allSellersForKPI.filter(s => {
      const t = new Date(s.created_at).getTime();
      return Number.isFinite(t) && now - t <= week;
    }).length;
  }, [allSellersForKPI]);

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

        {/* ---------- NEW: KPI strip ---------- */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile label="Saved" value={kpiSaved} href="#saved" />
          <KpiTile label="Matches" value={kpiMatches} href="#matches" />
          <KpiTile label="Conversations" value={kpiConvos} href="#conversations" />
          <KpiTile label="New this week" value={kpiNewThisWeek} href="/listings" />
        </section>

        {/* Header / Actions */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Buyer Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back{profile?.name ? `, ${profile.name}` : ''}.</p>
            <p className="text-[13px] text-emerald-700 mt-2">
              Tip: Try our <Link href="/deal-maker"><a className="underline font-semibold">🤝 Deal Maker</a></Link> to structure creative offers faster.
            </p>
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

        {/* ---------- NEW: Profile completeness ---------- */}
        <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-blue-700">Your Buying Preferences</h2>
            <div className="text-sm text-gray-600">
              Profile completeness
              <div className="mt-1 w-44 h-2 bg-gray-200 rounded-full overflow-hidden inline-block align-middle ml-2">
                <div
                  className="h-full bg-emerald-600"
                  style={{ width: `${profileScore}%` }}
                  aria-label={`Profile completeness ${profileScore}%`}
                />
              </div>
              <span className="ml-2 font-semibold text-gray-800">{profileScore}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <InfoTile label="Location" value={`${profile.city || '—'}${(profile.city && profile.state_or_province) ? ', ' : ''}${profile.state_or_province || '—'}`} />
            <InfoTile label="Financing" value={profile.financing_type || '—'} />
            <InfoTile label="Budget" value={profile.budget_for_purchase ? `$${Number(profile.budget_for_purchase).toLocaleString()}` : '—'} />
            <InfoTile label="Capital" value={profile.capital_investment ? `$${Number(profile.capital_investment).toLocaleString()}` : '—'} />
            <InfoTile label="Industry" value={profile.industry_preference || '—'} />
            <InfoTile label="Relocate?" value={profile.willing_to_relocate || '—'} />
          </div>

          {profileScore < 100 && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-900">
              <div className="font-medium mb-1">Complete your profile to get stronger matches:</div>
              <ul className="list-disc ml-5">
                {completenessTips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
              <Link href="/buyer-onboarding?next=/buyer-dashboard">
                <a className="inline-block mt-2 text-blue-700 underline font-semibold">Update profile →</a>
              </Link>
            </div>
          )}
        </section>

        {/* ---------- NEW: Filter bar + Suggested Matches ---------- */}
        <section id="matches" className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Suggested Matches</h2>
            <Link href="/listings">
              <a className="text-blue-600 hover:underline text-sm font-semibold">See marketplace →</a>
            </Link>
          </div>

          {/* Filter bar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 mb-4">
            <input
              type="text"
              placeholder="Industry (comma-separated)"
              value={fIndustry.join(', ')}
              onChange={e => setFIndustry(splitCSV(e.target.value))}
              className="px-3 py-2 border rounded-lg text-sm"
              aria-label="Filter by industry"
            />
            <input
              type="text"
              placeholder="Location (city/state; comma-separated)"
              value={fLocations.join(', ')}
              onChange={e => setFLocations(splitCSV(e.target.value))}
              className="px-3 py-2 border rounded-lg text-sm"
              aria-label="Filter by location"
            />
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Price min"
                value={fPriceMin}
                onChange={e => setFPriceMin(e.target.value)}
                className="w-1/2 px-3 py-2 border rounded-lg text-sm"
                aria-label="Price minimum"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Price max"
                value={fPriceMax}
                onChange={e => setFPriceMax(e.target.value)}
                className="w-1/2 px-3 py-2 border rounded-lg text-sm"
                aria-label="Price maximum"
              />
            </div>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Profit (SDE) min"
              value={fRevMin}
              onChange={e => setFRevMin(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              aria-label="Minimum profit"
            />
            <div className="flex gap-2">
              <select
                value={fFinancing}
                onChange={e => setFFinancing(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
                aria-label="Financing filter"
              >
                <option value="">Any financing</option>
                <option value="seller">Seller financing</option>
                <option value="third-party">Third-party</option>
                <option value="rent-to-own">Rent-to-own</option>
                <option value="self">Self financing</option>
              </select>
              <select
                value={fSort}
                onChange={e => setFSort(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
                aria-label="Sort matches"
              >
                <option value="newest">Newest</option>
                <option value="priceAsc">Price ↑</option>
                <option value="priceDesc">Price ↓</option>
                <option value="profitAsc">Profit ↑</option>
                <option value="profitDesc">Profit ↓</option>
              </select>
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                aria-label="Clear filters"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Results */}
          {loadingMatches ? (
            <p className="text-gray-600">Finding matches…</p>
          ) : filteredMatches.length === 0 ? (
            <div className="text-gray-700">
              <p className="mb-3">No strong matches yet.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="text-xs px-2 py-1 border rounded-lg bg-white hover:bg-gray-50"
                  onClick={() => setFIndustry([])}
                >Any industry</button>
                <button
                  className="text-xs px-2 py-1 border rounded-lg bg-white hover:bg-gray-50"
                  onClick={() => setFLocations([])}
                >Any location</button>
                <button
                  className="text-xs px-2 py-1 border rounded-lg bg-white hover:bg-gray-50"
                  onClick={() => { setFPriceMin(''); setFPriceMax(''); }}
                >Any price</button>
                <button
                  className="text-xs px-2 py-1 border rounded-lg bg-white hover:bg-gray-50"
                  onClick={() => setFFinancing('')}
                >Any financing</button>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Or head to the marketplace and use <strong>🤝 Propose a Deal</strong> to structure an offer:
                {' '}
                <Link href="/listings"><a className="text-blue-700 underline">Browse listings →</a></Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredMatches.map(({ listing, score, reasons }) => {
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
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[15px] font-semibold text-blue-700 line-clamp-2 min-h-[40px]">
                              {listing.business_name || 'Unnamed Business'}
                            </h3>
                            <span className="text-[11px] mt-0.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 whitespace-nowrap">
                              Score {score}
                            </span>
                          </div>
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
        <section id="saved" className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Saved Listings</h2>
            <Link href="/listings">
              <a className="text-blue-600 hover:underline text-sm font-semibold">See all →</a>
            </Link>
          </div>

          {loadingSaved ? (
            <p className="text-gray-600">Loading saved listings…</p>
          ) : savedListings.length === 0 ? (
            <div className="text-gray-700">
              <p>You haven’t saved any listings yet.</p>
              <div className="mt-3">
                <Link href="/listings">
                  <a className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold">
                    Browse listings & Propose a Deal →
                  </a>
                </Link>
              </div>
            </div>
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
        <div id="conversations">
          <RecentConversations profileEmail={profile?.email} />
        </div>

        {/* Danger Zone: deactivate or delete */}
        <BuyerDangerZone />
      </div>
    </main>
  );
}

/* ---------- Small components (added) ---------- */

function KpiTile({ label, value, href }) {
  return (
    <Link href={href || '#'}>
      <a className="block bg-white rounded-xl shadow border border-gray-200 p-4 hover:shadow-md transition">
        <div className="text-[13px] text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      </a>
    </Link>
  );
}

/* ---------- Matching helpers (unchanged + a couple tiny tweaks) ---------- */

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

function splitCSV(s) {
  return String(s || '')
    .split(',')
    .map(x => x.trim())
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
        <p className="text-gray-600">No conversations yet. Contact a seller on any listing to start a thread.</p>
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
      // Get a session token to authenticate the API call
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
          {/* Step 1 */}
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

          {/* Step 2 */}
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

          {/* Step 3 */}
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
