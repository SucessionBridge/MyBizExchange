import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <span className="text-2xl font-bold text-blue-700 cursor-pointer">SuccessionBridge</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-sm font-medium">
          <Link href="/business-valuation" className="hover:text-blue-600">Valuation</Link>
          <Link href="/sellers" className="hover:text-blue-600">Sell</Link>
          <Link href="/buyers" className="hover:text-blue-600">Buy</Link>
          <Link href="/scorecard" className="hover:text-blue-600">Prepare to Sell</Link>
          <Link href="/listings" className="hover:text-blue-600">Marketplace</Link>
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
            <Link href="/business-valuation" onClick={() => setIsOpen(false)} className="hover:text-blue-600">Valuation</Link>
            <Link href="/sellers" onClick={() => setIsOpen(false)} className="hover:text-blue-600">Sell</Link>
            <Link href="/buyers" onClick={() => setIsOpen(false)} className="hover:text-blue-600">Buy</Link>
            <Link href="/scorecard" onClick={() => setIsOpen(false)} className="hover:text-blue-600">Prepare to Sell</Link>
            <Link href="/listings" onClick={() => setIsOpen(false)} className="hover:text-blue-600">Marketplace</Link>
          </nav>
        </div>
      )}
    </header>
  );
}


