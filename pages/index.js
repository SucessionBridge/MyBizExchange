import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-blue-800 mb-4">SuccessionBridge</h1>
          <p className="text-lg font-normal text-gray-700 max-w-2xl mx-auto">
            Helping business owners transition smoothly — and buyers step confidently into ownership.
          </p>
        </div>

        {/* Valuation Tool Section */}
        <section className="bg-blue-50 rounded-xl p-8 mb-12 shadow-sm">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-blue-900 mb-4">What is Your Business Worth?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Get an instant, free valuation using our AI-powered tool. Understand your business value and plan your exit with confidence.
            </p>
            <Link href="/business-valuation">
              <button className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg text-lg font-semibold">
                See How Much Your Business Is Worth
              </button>
            </Link>
          </div>
        </section>

        {/* Sellers Section */}
        <section className="bg-white rounded-xl p-8 mb-12 border border-gray-200">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-blue-900 mb-4">Are You a Seller?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Ready to sell your business? We help you maximize value and connect with the right buyer.
            </p>
            <Link href="/sellers">
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-semibold">
                List Your Business
              </button>
            </Link>
          </div>
        </section>

        {/* Sellability Scorecard Section (Updated Color) */}
        <section className="bg-blue-50 rounded-xl p-8 mb-12 border border-blue-100">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">
              Not sure if your business is ready to sell?
            </h2>
            <Link href="/scorecard">
              <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md">
                👉 Take the Sellability Scorecard
              </a>
            </Link>
          </div>
        </section>

        {/* Buyers Section */}
        <section className="bg-white rounded-xl p-8 mb-12 border border-gray-200">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-blue-900 mb-4">Are You a Buyer?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Browse our marketplace for available businesses and find your next opportunity.
            </p>
            <Link href="/buyers">
              <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg text-lg font-semibold">
                Browse Businesses
              </button>
            </Link>
          </div>
        </section>

        {/* How SuccessionBridge Works */}
        <section className="bg-gray-50 rounded-xl p-8 border border-gray-200">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-blue-900 mb-4">How SuccessionBridge Works</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              SuccessionBridge connects business owners with prospective buyers in a seamless, supportive environment.
              Whether you're ready to retire, pivot, or grow, our tools help you make the most of your business exit — and help buyers take over with confidence.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

