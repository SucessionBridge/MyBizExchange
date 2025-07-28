import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react';
import supabase from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* ✅ Homepage logo bypass redirect */}
        <Link href="/?force=true">
          <span className="flex items-center text-2xl font-serif font-bold cursor-pointer">
            <span className="text-[#2E3A59]">Succession</span>
            <span className="text-[#F59E0B] flex items-center relative">
              Bridge
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 200 80"
                className="w-12 h-6 ml-1"
                style={{ transform: 'translateY(-2px)' }}
              >
                <path
                  d="M0 60h200v4H0z M20 60V30h4v30z M180 60V30h-4v30z M0 30 C60 0 140 0 200 30"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="4"
                />
                <path d="M95 60V20h4v40z" fill="#F59E0B" />
              </svg>
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-sm font-medium items-center">
          <Link href="/listings"><span className="hover:text-blue-600 cursor-pointer">Buy a Business</span></Link>
          <Link href="/sellers"><span className="hover:text-blue-600 cursor-pointer">Sell a Business</span></Link>
          <Link href="/business-valuation"><span className="hover:text-blue-600 cursor-pointer">Value Your Business</span></Link>
          <Link href="/scorecard"><span className="hover:text-blue-600 cursor-pointer">Sellability Scorecard</span></Link>
          <Link href="/guides"><span className="hover:text-blue-600 cursor-pointer">Guides & Tools</span></Link>

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
                    onClick={() => {
                      toast.success('Switched to Buyer Dashboard');
                      router.push('/buyer-dashboard');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Buyer Dashboard
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Switched to Seller Dashboard');
                      router.push('/seller-dashboard');
                      setDropdownOpen(false);
                    }}
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
            <Link href="/login"><span className="hover:text-blue-600 cursor-pointer">Login</span></Link>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button onClick={toggleMenu} aria-label="Toggle menu" className="text-gray-800">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="flex flex-col px-4 py-2 space-y-2 text-sm font-medium">
            <Link href="/listings"><span onClick={() => setIsOpen(false)} className="hover:text-blue-600 cursor-pointer">Buy a Business</span></Link>
            <Link href="/sellers"><span onClick={() => setIsOpen(false)} className="hover:text-blue-600 cursor-pointer">Sell a Business</span></Link>
            <Link href="/business-valuation"><span onClick={() => setIsOpen(false)} className="hover:text-blue-600 cursor-pointer">Value Your Business</span></Link>
            <Link href="/scorecard"><span onClick={() => setIsOpen(false)} className="hover:text-blue-600 cursor-pointer">Sellability Scorecard</span></Link>
            <Link href="/guides"><span onClick={() => setIsOpen(false)} className="hover:text-blue-600 cursor-pointer">Guides & Tools</span></Link>

            {user && (
              <>
                <button
                  onClick={() => {
                    toast.success('Switched to Buyer Dashboard');
                    router.push('/buyer-dashboard');
                    setIsOpen(false);
                  }}
                  className="text-left hover:text-blue-600"
                >
                  Buyer Dashboard
                </button>
                <button
                  onClick={() => {
                    toast.success('Switched to Seller Dashboard');
                    router.push('/seller-dashboard');
                    setIsOpen(false);
                  }}
                  className="text-left hover:text-blue-600"
                >
                  Seller Dashboard
                </button>
                <button onClick={handleLogout} className="text-left text-red-600 hover:text-red-800">
                  Log Out
                </button>
              </>
            )}

            {!user && (
              <Link href="/login"><span onClick={() => setIsOpen(false)} className="hover:text-blue-600 cursor-pointer">Login</span></Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

