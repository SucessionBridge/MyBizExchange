// components/Header.js
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Menu, X, ChevronDown } from 'lucide-react';
import supabase from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  // 👇 NEW: broker role state
  const [isBroker, setIsBroker] = useState(false);
  const [brokerVerified, setBrokerVerified] = useState(false);

  // desktop dropdowns
  const [sellOpen, setSellOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  // mobile collapsibles
  const [sellOpenM, setSellOpenM] = useState(false);
  const [buyOpenM, setBuyOpenM] = useState(false);

  // dashboard dropdown
  const [dashOpen, setDashOpen] = useState(false);

  const router = useRouter();
  const sellTimer = useRef(null);
  const buyTimer = useRef(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  // 👇 NEW: when logged in, check for broker profile
  useEffect(() => {
    const run = async () => {
      if (!user?.id) {
        setIsBroker(false);
        setBrokerVerified(false);
        return;
      }
      const { data, error } = await supabase
        .from('brokers')
        .select('id, verified')
        .eq('auth_id', user.id)
        .maybeSingle();
      if (error || !data) {
        setIsBroker(false);
        setBrokerVerified(false);
      } else {
        setIsBroker(!!data.id);
        setBrokerVerified(!!data.verified);
      }
    };
    run();
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const openWithDelay = (setter, timerRef) => {
    clearTimeout(timerRef.current);
    setter(true);
  };
  const closeWithDelay = (setter, timerRef) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setter(false), 120);
  };

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/?force=true">
          <span className="flex items-center text-2xl font-serif font-bold cursor-pointer">
            <span className="text-[#1E3A8A]">Succession</span>
            <span className="text-[#F59E0B] flex items-center relative">
              Bridge
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" className="w-12 h-6 ml-1" style={{ transform: 'translateY(-2px)' }}>
                <path d="M0 60h200v4H0z M20 60V30h4v30z M180 60V30h-4v30z M0 30 C60 0 140 0 200 30" fill="none" stroke="#F59E0B" strokeWidth="4" />
                <path d="M95 60V20h4v40z" fill="#F59E0B" />
              </svg>
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center text-sm font-medium gap-2">
          {/* BUY dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openWithDelay(setBuyOpen, buyTimer)}
            onMouseLeave={() => closeWithDelay(setBuyOpen, buyTimer)}
          >
            <button className="inline-flex items-center gap-1 px-2 py-1.5 rounded hover:text-blue-600" aria-haspopup="true" aria-expanded={buyOpen}>
              Buy a Business <ChevronDown size={16} />
            </button>
            {buyOpen && (
              <div
                className="absolute left-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-50"
                onMouseEnter={() => openWithDelay(setBuyOpen, buyTimer)}
                onMouseLeave={() => closeWithDelay(setBuyOpen, buyTimer)}
              >
                <Link href="/listings"><a className="block px-3 py-2 rounded hover:bg-gray-50">Browse Listings</a></Link>
                <Link href="/buyer-onboarding"><a className="block px-3 py-2 rounded hover:bg-gray-50">Create Your Buyer Profile</a></Link>
                <Link href="/guides/how-buyers-value"><a className="block px-3 py-2 rounded hover:bg-gray-50">How Buyers Value Businesses</a></Link>
                <Link href="/guides/financing-options"><a className="block px-3 py-2 rounded hover:bg-gray-50">Financing Options</a></Link>
              </div>
            )}
          </div>

          {/* SELL dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openWithDelay(setSellOpen, sellTimer)}
            onMouseLeave={() => closeWithDelay(setSellOpen, sellTimer)}
          >
            <button className="inline-flex items-center gap-1 px-2 py-1.5 rounded hover:text-blue-600" aria-haspopup="true" aria-expanded={sellOpen}>
              Sell a Business <ChevronDown size={16} />
            </button>
            {sellOpen && (
              <div
                className="absolute left-0 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-50"
                onMouseEnter={() => openWithDelay(setSellOpen, sellTimer)}
                onMouseLeave={() => closeWithDelay(setSellOpen, sellTimer)}
              >
                <Link href="/sellers"><a className="block px-3 py-2 rounded hover:bg-gray-50">List Your Business (Onboarding)</a></Link>
                <Link href="/business-valuation"><a className="block px-3 py-2 rounded hover:bg-gray-50">Value Your Business</a></Link>
                <Link href="/guides/how-to-sell"><a className="block px-3 py-2 rounded hover:bg-gray-50">How to Sell Your Business</a></Link>
                <Link href="/guides/prep-to-sell"><a className="block px-3 py-2 rounded hover:bg-gray-50">Get Your Business Ready to Sell</a></Link>
                <Link href="/pricing"><a className="block px-3 py-2 rounded hover:bg-gray-50">Pricing</a></Link>
              </div>
            )}
          </div>

          {/* quick links */}
          <Link href="/business-valuation"><span className="px-2 py-1.5 rounded hover:text-blue-600 cursor-pointer">Valuation</span></Link>
          <Link href="/scorecard"><span className="px-2 py-1.5 rounded hover:text-blue-600 cursor-pointer">Sellability Scorecard</span></Link>
          <Link href="/pricing"><span className="px-2 py-1.5 rounded hover:text-blue-600 cursor-pointer">Pricing</span></Link>

          {/* Dashboard/Login */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDashOpen((v) => !v)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
              >
                Dashboard
              </button>
              {dashOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow z-50">
                  <button
                    onClick={() => {
                      toast.success('Switched to Buyer Dashboard');
                      setDashOpen(false);
                      router.push('/buyer-dashboard');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Buyer Dashboard
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Switched to Seller Dashboard');
                      setDashOpen(false);
                      router.push('/seller-dashboard');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Seller Dashboard
                  </button>

                  {/* 👇 NEW: Broker action */}
                  {isBroker ? (
                    <button
                      onClick={() => {
                        toast.success(brokerVerified ? 'Opening Broker Dashboard' : 'Broker pending verification');
                        setDashOpen(false);
                        router.push('/broker-dashboard');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Broker Dashboard{brokerVerified ? '' : ' (pending)'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setDashOpen(false);
                        router.push('/broker-onboarding');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Broker Onboarding
                    </button>
                  )}

                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login"><span className="px-2 py-1.5 rounded hover:text-blue-600 cursor-pointer">Login</span></Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen((v) => !v)} aria-label="Toggle menu" className="text-gray-800">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="flex flex-col px-4 py-2 text-sm font-medium">
            {/* BUY collapsible */}
            <button onClick={() => setBuyOpenM((v) => !v)} className="flex items-center justify-between py-2">
              <span>Buy a Business</span>
              <ChevronDown className={`transition ${buyOpenM ? 'rotate-180' : ''}`} size={18} />
            </button>
            {buyOpenM && (
              <div className="pl-3 pb-2 space-y-2">
                <Link href="/listings"><span className="block py-1.5" onClick={() => setIsOpen(false)}>Browse Listings</span></Link>
                <Link href="/buyer-onboarding"><span className="block py-1.5" onClick={() => setIsOpen(false)}>Create Your Buyer Profile</span></Link>
                <Link href="/guides/how-buyers-value"><span className="block py-1.5" onClick={() => setIsOpen(false)}>How Buyers Value</span></Link>
                <Link href="/guides/financing-options"><span className="block py-1.5" onClick={() => setIsOpen(false)}>Financing Options</span></Link>
              </div>
            )}

            {/* SELL collapsible */}
            <button onClick={() => setSellOpenM((v) => !v)} className="flex items-center justify-between py-2">
              <span>Sell a Business</span>
              <ChevronDown className={`transition ${sellOpenM ? 'rotate-180' : ''}`} size={18} />
            </button>
            {sellOpenM && (
              <div className="pl-3 pb-2 space-y-2">
                <Link href="/sellers"><span className="block py-1.5" onClick={() => setIsOpen(false)}>List Your Business</span></Link>
                <Link href="/business-valuation"><span className="block py-1.5" onClick={() => setIsOpen(false)}>Value Your Business</span></Link>
                <Link href="/guides/how-to-sell"><span className="block py-1.5" onClick={() => setIsOpen(false)}>How to Sell</span></Link>
                <Link href="/guides/prep-to-sell"><span className="block py-1.5" onClick={() => setIsOpen(false)}>Get Ready to Sell</span></Link>
                <Link href="/pricing"><span className="block py-1.5" onClick={() => setIsOpen(false)}>Pricing</span></Link>
              </div>
            )}

            {/* quick links */}
            <Link href="/business-valuation"><span className="py-2" onClick={() => setIsOpen(false)}>Valuation</span></Link>
            <Link href="/scorecard"><span className="py-2" onClick={() => setIsOpen(false)}>Sellability Scorecard</span></Link>
            <Link href="/pricing"><span className="py-2" onClick={() => setIsOpen(false)}>Pricing</span></Link>

            {user ? (
              <>
                <button
                  onClick={() => {
                    toast.success('Switched to Buyer Dashboard');
                    router.push('/buyer-dashboard');
                    setIsOpen(false);
                  }}
                  className="text-left py-2"
                >
                  Buyer Dashboard
                </button>
                <button
                  onClick={() => {
                    toast.success('Switched to Seller Dashboard');
                    router.push('/seller-dashboard');
                    setIsOpen(false);
                  }}
                  className="text-left py-2"
                >
                  Seller Dashboard
                </button>

                {/* 👇 NEW: Broker action (mobile) */}
                {isBroker ? (
                  <button
                    onClick={() => {
                      toast.success(brokerVerified ? 'Opening Broker Dashboard' : 'Broker pending verification');
                      router.push('/broker-dashboard');
                      setIsOpen(false);
                    }}
                    className="text-left py-2"
                  >
                    Broker Dashboard{brokerVerified ? '' : ' (pending)'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      router.push('/broker-onboarding');
                      setIsOpen(false);
                    }}
                    className="text-left py-2"
                  >
                    Broker Onboarding
                  </button>
                )}

                <button onClick={handleLogout} className="text-left text-red-600 py-2">
                  Log Out
                </button>
              </>
            ) : (
              <Link href="/login"><span className="py-2" onClick={() => setIsOpen(false)}>Login</span></Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

