import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">
          Welcome to SuccessionBridge
        </h1>
        <p className="text-lg text-center mb-6">
          SuccessionBridge helps you sell or buy a business with confidence. Our platform connects
          business owners with qualified buyers and offers a seamless process for all.
        </p>

        {/* Sellers Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">Are You a Seller?</h2>
          <p className="text-lg mb-6">
            Ready to sell your business? We help you get the right value and connect you with the
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
            Looking to buy a business? We help you find the right opportunities and make business
            ownership a reality.
          </p>
          <div className="flex justify-center mb-4">
            <Link href="/buyer-onboarding">
              <button className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 text-lg font-semibold">
                Browse Businesses
              </button>
            </Link>
          </div>
        </div>

        {/* Business Valuation CTA Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">Get Your Free Business Valuation</h2>
          <p className="text-lg mb-6">
            Discover what your business is worth with our free AI-powered valuation tool. Get an
            instant, accurate estimate and make informed decisions about selling your business.
          </p>

          {/* CTA Button for Business Valuation */}
          <div className="flex justify-center mb-8">
            <Link href="/business-valuation">
              <button className="bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 text-lg font-semibold">
                See How Much Your Business Is Worth
              </button>
            </Link>
          </div>
        </div>

        {/* How SuccessionBridge Works */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">How SuccessionBridge Works</h2>
          <p className="text-lg mb-6">
            SuccessionBridge is here to make buying and selling businesses easy. Here's how it
            works:
          </p>

          <div className="space-y-4">
            <div className="flex justify-center items-center">
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">1. List Your Business</h3>
                <p>Get your business listed with all the right details, including valuation and photos.</p>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">2. Browse Businesses</h3>
                <p>Browse businesses that match your interests and goals, using our easy-to-navigate platform.</p>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">3. Connect and Negotiate</h3>
                <p>Once you're interested, connect with sellers and negotiate terms to make the deal happen.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


