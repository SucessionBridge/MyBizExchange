import Link from "next/link";

export default function ThankYou() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold text-green-600">✅ Listing Submitted!</h1>
      <p className="mt-4">
        Your business listing was submitted successfully. We'll be in touch soon.
      </p>

      <div className="mt-6">
        <Link href="/?force=true">
          <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            🏠 Go to Homepage
          </a>
        </Link>
      </div>
    </div>
  );
}

