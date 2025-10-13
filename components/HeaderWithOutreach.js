// components/HeaderWithOutreach.js
import Header from './Header';
import Link from 'next/link';
import { useState, useEffect } from 'react';

/**
 * Elegant empathy-driven outreach header wrapper.
 * Adds a light top bar above your existing Header.js.
 * Fully responsive for desktop + mobile.
 */
export default function HeaderWithOutreach() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // prevent showing again if dismissed in this session
    const hidden = sessionStorage.getItem('hideOutreachBar');
    if (hidden) setIsVisible(false);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hideOutreachBar', 'true');
  };

  if (!isVisible) return <Header />;

  return (
    <div className="relative w-full">
      {/* Outreach Bar */}
      <div className="bg-white/70 backdrop-blur-md border-b border-gray-200 text-sm text-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2">
          <p className="flex-1 text-center sm:text-left leading-snug">
            Thinking about closing your business?{' '}
            <span className="hidden sm:inline">Let’s talk first — there’s almost always a buyer.</span>
          </p>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/find-your-buyer">
              <span className="text-[#14B8A6] font-medium hover:underline hover:text-[#0d9488] transition cursor-pointer">
                Find Your Buyer →
              </span>
            </Link>
            <button
              onClick={handleClose}
              aria-label="Dismiss"
              className="text-gray-400 hover:text-gray-600 transition text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Main header (your existing navigation) */}
      <Header />
    </div>
  );
}
