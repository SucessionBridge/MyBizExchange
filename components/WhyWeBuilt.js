// components/WhyWeBuilt.js
export default function WhyWeBuilt({ variant = "owner" }) {
  // variant: "owner" (default) or "broker"
  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
        Why We Built SuccessionBridge
      </h2>

      <div className="mt-4 space-y-4 text-gray-700 text-lg leading-relaxed">
        <p>
          After years of running a profitable business, we decided to sell. We were
          doing about $200K in revenue with roughly $150K in SDE. When we first
          called around, we heard a version of:{" "}
          <em>“Smaller deals don’t always get broker attention.”</em>
        </p>
        <p>
          One year later, we sold for over $4M by getting the business in front of
          the right buyers and letting the market set the value. The lesson was
          simple: <strong>more qualified eyes = more chances to sell.</strong>
        </p>

        <p>
          SuccessionBridge exists to give owners that same advantage—modern tools to
          package your business and reach more buyers directly. Many great brokers
          do valuable work; for some owners (especially main-street size), it’s
          helpful to have a <em>DIY path</em> or a <em>complement</em> to broker efforts.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border p-4 bg-white">
          <h3 className="font-semibold">What you get</h3>
          <ul className="mt-2 list-disc list-inside text-gray-700">
            <li>Simple valuation guidance (SDE × industry range)</li>
            <li>Clear, copyable summaries and PDFs</li>
            <li>Direct connection to interested buyers</li>
            <li>Optional: use alongside a broker</li>
          </ul>
        </div>

        <div className="rounded-xl border p-4 bg-white">
          <h3 className="font-semibold">Our philosophy</h3>
          <ul className="mt-2 list-disc list-inside text-gray-700">
            <li>Visibility drives outcomes</li>
            <li>Transparent, plain-English tools</li>
            <li>You stay in control of the process</li>
            <li>Respect for brokers and their role</li>
          </ul>
        </div>
      </div>

      {variant === "broker" && (
        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-blue-900">
          <p className="text-sm">
            <strong>Brokers:</strong> SuccessionBridge can complement your mandate—
            more distribution and easier seller prep. If you’re interested in early
            access, we’d love to talk.
          </p>
        </div>
      )}
    </section>
  );
}
