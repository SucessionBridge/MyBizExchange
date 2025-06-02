import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-md p-4">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-bold text-blue-700">SuccessionBridge</Link>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/sellers" className="hover:text-blue-600">Sell a Business</Link>
          <Link href="/buyers" className="hover:text-blue-600">Buy a Business</Link>
          <Link href="/listings" className="hover:text-blue-600">Marketplace</Link>
          <Link href="/scorecard" className="hover:text-blue-600">Scorecard</Link>
        </div>
      </nav>
    </header>
  );
}
