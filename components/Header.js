import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react';
import supabase from '../lib/supabaseClient';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBuyerProfile, setHasBuyerProfile] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('buyers')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle();
        if (data) setHasBuyerProfile(true);
      }
    };
    checkProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <a className="text-2xl font-serif font-bold">
            <span className="text-[#2E3A59]">Succession</span>
            <span className="text-[#F59E0B]">Bridge</span>
          </a>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-sm font-medium items-center">
          <Link href="/business-valuation"><a className="hover:text-blue-600">Valuation</a></Link>
          <Link href="/sellers"><a className="hover:text-blue-600">Sell</a></Link>
          <Link href="/buyer-onboarding"><a className="hover:text-blue-600">Buy</a></Link>
          <Link href="/scorecard"><a className="hover:text-blue-600">Prepare to Sell</a></Link>
          <Link href="/listings"><a className="hover:text-blue-600">Marketplace</a></Link>

          {user && (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
              >
                Dashboard
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow z-50">
                  <button
                    onClick={() => { router.push('/buyer-dashboard'); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Buyer Dashboard
                  </button>
                  <button
                    onClick={() => { router.push('/seller-dashboard'); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Seller Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}

          {!user && (
            <Link href="/login"><a className="hover:text-blue-600">Login</a></Link>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden">
          <button onClick={toggleMenu} aria-label="Toggle menu" className="text-gray-800">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="flex flex-col px-4 py-2 space-y-2 text-sm font-medium">
            <Link href="/business-valuation"><a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Valuation</a></Link>
            <Link href="/sellers"><a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Sell</a></Link>
            <Link href="/buyer-onboarding"><a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Buy</a></Link>
            <Link href="/scorecard"><a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Prepare to Sell</a></Link>
            <Link href="/listings"><a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Marketplace</a></Link>

            {user && (
              <>
                <button onClick={() => { router.push('/buyer-dashboard'); setIsOpen(false); }} className="text-left hover:text-blue-600">Buyer Dashboard</button>
                <button onClick={() => { router.push('/seller-dashboard'); setIsOpen(false); }} className="text-left hover:text-blue-600">Seller Dashboard</button>
                <button onClick={handleLogout} className="text-left text-red-600 hover:text-red-800">Log Out</button>
              </>
            )}

            {!user && (
              <Link href="/login"><a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Login</a></Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
