export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-md p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">Succession Bridge</h1>
          <nav>
            <a href="/sellers" className="text-blue-600 hover:underline font-medium">
              Seller Onboarding
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center px-6">
        <h2 className="text-4xl font-bold mb-4">The Marketplace for Business Succession</h2>
        <p className="text-lg max-w-2xl mx-auto mb-8">
          Helping Baby Boomer business owners exit gracefully — and matching them with ambitious entrepreneurs ready to carry the torch.
        </p>
        <div className="flex justify-center gap-6 flex-wrap">
          <a
            href="/sellers"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            I’m a Seller
          </a>
          <a
            href="#"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300"
          >
            I’m a Buyer
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-center text-sm text-gray-500 py-6">
        &copy; {new Date().getFullYear()} Succession Bridge. All rights reserved.
      </footer>
    </main>
  );
}

