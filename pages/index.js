export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-center px-4">
      <div className="max-w-xl w-full">
        <h1 className="text-4xl font-bold mb-4">Succession Bridge</h1>
        <p className="text-lg text-gray-700 mb-8">
          Helping Baby Boomer business owners exit gracefully — and matching them with ambitious entrepreneurs ready to carry the torch.
        </p>

        <div className="flex justify-center gap-4">
          <a
            href="/sellers"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold"
          >
            I’m a Seller
          </a>
          <a
            href="/buyers"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 font-semibold"
          >
            I’m a Buyer
          </a>
        </div>
      </div>
    </main>
  )
}

