import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <span className="text-2xl font-bold text-blue-700 cursor-pointer">SuccessionBridge</span>
        </Link>
        <nav className="hidden md:flex space-x-6 text-sm font-medium">
          <Link href="/business-valuation" className="hover:text-blue-600">Valuation</Link>
          <Link href="/sellers" className="hover:text-blue-600">Sell</Link>
          <Link href="/buyers" className="hover:text-blue-600">Buy</Link>
          <Link href="/scorecard" className="hover:text-blue-600">Scorecard</Link>
        </nav>
      </div>
    </header>
  );
}
