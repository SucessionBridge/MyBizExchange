// components/Header.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';
import supabase from '../lib/supabaseClient';

export default function Header() {
  const router = useRouter();
  const session = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isBroker, setIsBroker] = useState(false);
  const [brokerVerified, setBrokerVerified] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);

  // Check if logged-in user has a broker profile
  useEffect(() => {
    let isMounted = true;

    const checkBroker = async () => {
      if (!session?.user) {
        if (isMounted) {
          setIsBroker(false);
          setBrokerVerified(false);
        }
        return;
      }
      setCheckingRole(true);
      const { data, error } = await supabase
        .from('brokers')
        .select('id, verified')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!isMounted) return;
      if (error || !data) {
        setIsBroker(false);
        setBrokerVerified(false);
      } else {
        setIsBroker(!!data.id);
        setBrokerVerified(!!data.verified);
      }
      setCheckingRole(false);
    };

    checkBroker();
    return () => { isMounted = false; };
  }, [session?.user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push('/');
  };

  // Navigation targets (note: seller → sellers)
  const SELL_ROUTE = '/sellers';
  const BROKER_ONBOARD = '/broker-onboarding';
  const BROKER_DASH = '/broker-dashboard';

  // Login shortcuts (use your /login page for role-aware magic links)
  const buyerLoginHref = '/login?role=buyer&next=%2Fbuyer-dashboard';
  const brokerLoginHref = `/login?role=broker&next=${encodeURIComponent(BROKER_ONBOARD)}`;
  const sellerLoginHref = SELL_ROUTE; // seller page handles its own email gate

  const PrimaryLinks = () => (
    <nav className="hidden md:flex items-center gap-6">
      <Link href="/" className="text-gray-700 hover:text-gray-900">Browse</Link>
      <Link href={SELL_ROUTE} className="text-gray-700 hover:text-gray-900">Sell a Business</Link>
      {/* If user has a broker profile, show Dashboard shortcut; otherwise show Broker Onboarding */}
      {isBroker ? (
        <Link href={BROKER_DASH} className="text-gray-700 hover:text-gray-900">
          Broker Dashboard{checkingRole ? '…' : brokerVerified ? '' : ' (pending)'}
        </Link>
      ) : (
        <Link href={BROKER_ONBOARD} className="text-gray-700 hover:text-gray-900">
          For Brokers
        </Link>
      )}
    </nav>
  );

  const AuthSection = () => {
    if (!session?.user) {
      return (
        <div className="hidden md:flex items-center gap-3">
          <Link
            href={buyerLoginHref}
            className="text-gray-700 hover:text-gray-900"
          >
            Buyer Login
          </Link>
          <Link
            href={sellerLoginHref}
            className="text-gray-700 hover:text-gray-900"
          >
            Seller Login
          </Link>
          <Link
            href={brokerLoginHref}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
          >
            Broker Login
          </Link>
        </div>
      );
    }

    // Logged-in
    return (
      <div className="hidden md:flex items-center gap-3">
        {/* Quick path to relevant dashboards */}
        {isBroker && (
          <Link
            href={BROKER_DASH}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
          >
            Broker Dashboard{checkingRole ? '…' : brokerVerified ? '' : ' (pending)'}
          </Link>
        )}
        <button
          onClick={signOut}
          className="inline-flex items-center rounded-lg border px-3 py-2 text-gray-700 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-block h-8 w-8 rounded bg-blue-600" />
            <span className="font-semibold tracking-tight">SuccessionBridge</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <PrimaryLinks />
        <AuthSection />

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="currentColor">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 flex flex-col gap-3">
            <Link href="/" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700">Browse</Link>
            <Link href={SELL_ROUTE} onClick={() => setMobileOpen(false)} className="py-2 text-gray-700">Sell a Business</Link>
            {isBroker ? (
              <Link
                href={BROKER_DASH}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-gray-700"
              >
                Broker Dashboard{checkingRole ? '…' : brokerVerified ? '' : ' (pending)'}
              </Link>
            ) : (
              <Link
                href={BROKER_ONBOARD}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-gray-700"
              >
                For Brokers
              </Link>
            )}

            {!session?.user ? (
              <>
                <Link href={buyerLoginHref} onClick={() => setMobileOpen(false)} className="py-2 text-gray-700">
                  Buyer Login
                </Link>
                <Link href={sellerLoginHref} onClick={() => setMobileOpen(false)} className="py-2 text-gray-700">
                  Seller Login
                </Link>
                <Link
                  href={brokerLoginHref}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 rounded bg-blue-600 text-white text-center"
                >
                  Broker Login
                </Link>
              </>
            ) : (
              <>
                {isBroker && (
                  <Link
                    href={BROKER_DASH}
                    onClick={() => setMobileOpen(false)}
                    className="py-2 rounded bg-blue-600 text-white text-center"
                  >
                    Broker Dashboard{checkingRole ? '…' : brokerVerified ? '' : ' (pending)'}
                  </Link>
                )}
                <button
                  onClick={async () => { await signOut(); setMobileOpen(false); }}
                  className="py-2 rounded border text-gray-700"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
