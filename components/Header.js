import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react';
import supabase from '../lib/supabaseClient';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBuyerProfile, setHasBuyerProfile] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const checkProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('buyers')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setHasBuyerProfile(true);
        }
      }
    };

    checkProfile();
  }, []);

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Stylized Brand Name */}
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
          {hasBuyerProfile && (
            <Link href="/buyer-dashboard">
              <a className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                Dashboard
              </a>
            </Link>
          )}
          <Link href="/login"><a className="hover:text-blue-600">Login</a></Link>
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
            <Link href="/business-valuation">
              <a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Valuation</a>
            </Link>
            <Link href="/sellers">
              <a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Sell</a>
            </Link>
            <Link href="/buyer-onboarding">
              <a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Buy</a>
            </Link>
            <Link href="/scorecard">
              <a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Prepare to Sell</a>
            </Link>
            <Link href="/listings">
              <a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Marketplace</a>
            </Link>
            {hasBuyerProfile && (
              <Link href="/buyer-dashboard">
                <a onClick={() => setIsOpen(false)} className="text-blue-700 font-semibold">Dashboard</a>
              </Link>
            )}
            <Link href="/login">
              <a onClick={() => setIsOpen(false)} className="hover:text-blue-600">Login</a>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
