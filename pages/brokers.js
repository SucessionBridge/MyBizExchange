// pages/brokers.js
import Link from 'next/link';

export default function BrokersPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">For Brokers</h1>
      <p className="text-gray-700 mb-8">
        Manage listings, connect with verified buyers, and track deal progress on SuccessionBridge.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/broker-onboarding" className="block border rounded-xl p-5 hover:shadow">
          <h2 className="text-lg font-medium mb-1">Broker Onboarding</h2>
          <p className="text-sm text-gray-600">Create your broker profile to get started.</p>
        </Link>

        <Link href="/broker-dashboard" className="block border rounded-xl p-5 hover:shadow">
          <h2 className="text-lg font-medium mb-1">Broker Dashboard</h2>
          <p className="text-sm text-gray-600">Access your listings and tools (requires login).</p>
        </Link>

        <Link href="/broker-login" className="block border rounded-xl p-5 hover:shadow">
          <h2 className="text-lg font-medium mb-1">Broker Login</h2>
          <p className="text-sm text-gray-600">Sign in or get a magic link.</p>
        </Link>
      </div>
    </main>
  );
}
