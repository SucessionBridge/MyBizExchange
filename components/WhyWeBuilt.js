// components/WhyWeBuilt.js
export default function WhyWeBuilt() {
  return (
    <section className="bg-white rounded-xl p-10 mb-16 shadow-md border border-gray-200">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-semibold text-[#2E3A59] mb-6">
          Why We Built SuccessionBridge
        </h2>

        <p className="text-lg text-gray-700 mb-4">
          After years of building and scaling a business we bootstrapped with just{" "}
          <strong>$160,000</strong>, we eventually sold it for over{" "}
          <strong>$4.5 million USD</strong>.
        </p>

        <p className="text-lg text-gray-700 mb-4">
          When we first explored selling, we realized how fragmented the process was —
          brokers were selective, buyers were scattered, and information was often locked away.
        </p>

        <p className="text-lg text-gray-700 mb-4">
          The lesson was clear: when you get your business in front of more qualified buyers
          and present it clearly, the market sets the value.
        </p>

        <p className="text-lg text-gray-700 mb-8">
          SuccessionBridge exists to give owners that same advantage — modern tools to package
          your business, attract the right buyers, and take control of the process.
        </p>

        <div className="grid sm:grid-cols-2 gap-8 text-left">
          <div>
            <h3 className="text-xl font-semibold text-[#2E3A59] mb-2">What You Get</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Simple valuation guidance (SDE × industry range)</li>
              <li>Clear, copyable summaries and PDFs</li>
              <li>Direct connection to interested buyers</li>
              <li>Optional: use alongside a broker</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#2E3A59] mb-2">Our Philosophy</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Visibility drives outcomes</li>
              <li>Transparent, plain-English tools</li>
              <li>You stay in control of the process</li>
              <li>Respect for brokers and their role</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

