import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">
          Welcome to SuccessionBridge
        </h1>
        <p className="text-lg text-center mb-6">
          Discover how SuccessionBridge helps you sell or buy a business with confidence.
        </p>

        {/* Sellers Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">Are You a Seller?</h2>
          <p className="text-lg mb-6">
            If you're looking to sell your business, we're here to help you get the right value
            and connect with qualified buyers.
          </p>
          <div className="flex justify-center mb-4">
            <Link href="/sellers-onboarding">
              <button className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 text-lg font-semibold">
                List Your Business
              </button>
            </Link>
          </div>
        </div>

        {/* Buyers Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">Are You a Buyer?</h2>
          <p className="text-lg mb-6">
            Looking to buy a business? Browse our marketplace for available businesses and get
            started on your journey to business ownership.
          </p>
          <div className="flex justify-center mb-4">
            <Link href="/buyer-onboarding">
              <button className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 text-lg font-semibold">
                Browse Businesses
              </button>
            </Link>
          </div>
        </div>

        {/* Section explaining the platform */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Ready to find out what your business is worth?
          </h2>
          <p className="text-lg mb-6">
            Our free AI-powered tool can give you an instant business valuation based on your
            unique business details. Use this information to make informed decisions about your
            business exit strategy.
          </p>

          {/* CTA Button for Business Valuation */}
          <div className="flex justify-center mb-8">
            <Link href="/business-valuation">
              <button className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 text-lg font-semibold">
                See how much your business is worth
              </button>
            </Link>
          </div>
        </div>

        {/* Section about how SuccessionBridge works */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">How SuccessionBridge Works</h2>
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
