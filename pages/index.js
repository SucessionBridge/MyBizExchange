import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-blue-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-yellow-400 mb-4">SuccessionBridge</h1>
          <p className="text-lg font-light mb-6">
            Connecting business owners with qualified buyers seamlessly.
          </p>
        </div>

        {/* Valuation Tool Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4">What is Your Business Worth?</h2>
          <p className="text-lg mb-6">
            Get an instant, free valuation using our AI-powered tool. Understand the value of your
            business and make more informed decisions about your next steps.
          </p>
          <div className="flex justify-center mb-8">
            <Link href="/business-valuation">
              <button className="bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 text-lg font-semibold transition-all">
                See How Much Your Business Is Worth
              </button>
            </Link>
          </div>
        </div>

        {/* Sellers Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4">Are You a Seller?</h2>
          <p className="text-lg mb-6">
            Ready to sell your business? We help you get the right value and connect with the
            best buyers.
          </p>
          <div className="flex justify-center mb-4">
            <Link href="/sellers">
              <button className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 text-lg font-semibold transition-all">
                List Your Business
              </button>
            </Link>
          </div>
        </div>

        {/* Sellability Scorecard Section */}
        <div className="text-center mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">
            Not sure if your business is ready to sell?
          </h2>
          <Link href="/scorecard">
            <a className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md shadow-md">
              👉 Take the Sellability Scorecard
            </a>
          </Link>
        </div>

        {/* Buyers Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4">Are You a Buyer?</h2>
          <p className="text-lg mb-6">
            Looking to buy a business? Browse our marketplace for available businesses and get
            started on your journey to business ownership.
          </p>
          <div className="flex justify-center mb-4">
            <Link href="/buyers">
              <button className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 text-lg font-semibold transition-all">
                Browse Businesses
              </button>
            </Link>
          </div>
        </div>

        {/* How SuccessionBridge Works */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4">How SuccessionBridge Works</h2>
          <p className="text-lg mb-6">
            SuccessionBridge connects business owners with prospective buyers in a seamless
            platform. Whether you're looking to retire, scale your business, or move on to new
            ventures, we provide the tools to help you sell your business at the right value.
          </p>
        </div>
      </div>
    </main>
  );
}

