import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-blue-900 text-white p-8"> {/* Updated background color */}
      <div className="max-w-2xl mx-auto">
        {/* Valuation Tool Section at the top */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Your Business Worth?</h2>
          <p className="text-lg mb-6">
            Get an instant, free valuation using our AI-powered tool. Understand the value of your
            business and make more informed decisions about your next steps.
          </p>
          <div className="flex justify-center mb-8">
            <Link href="/business-valuation">
              <button className="bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 text-lg font-semibold">
                See How Much Your Business Is Worth
              </button>
            </Link>
          </div>
        </div>

        {/* Sellers Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">Are You a Seller?</h2>
          <p className="text-lg mb-6">
            Ready to sell your business? We help you get the right value and connect with the
            best buyers.
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

        {/* How SuccessionBridge Works */}
        <div className="text-center mb-8">
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

