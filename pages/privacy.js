// pages/privacy.js
import Head from 'next/head'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Head>
        <title>Privacy Notice — SuccessionBridge</title>
        <meta
          name="description"
          content="How SuccessionBridge collects, uses, shares, and protects your information."
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#2E3A59]">
          Privacy Notice
        </h1>
        <p className="mt-3 text-gray-700">
          This Privacy Notice explains how SuccessionBridge (“we”, “us”, “our”) collects, uses, and
          shares information when you use our website, tools, and services (the “Service”).
          By using the Service, you agree to this Privacy Notice and our{' '}
          <Link href="/terms"><a className="text-blue-700 hover:underline">Terms of Use</a></Link>.
        </p>

        <Section title="1) Information we collect">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Account & contact info</strong> — name, email, password/login identifiers, and preferences.
            </li>
            <li>
              <strong>Seller listing info</strong> — business name, industry, location, asking price,
              descriptions, photos, included assets, and other listing details you submit.
            </li>
            <li>
              <strong>Valuation & scorecard inputs</strong> — revenue, expenses/SDE, years in business,
              franchise/operations flags, and any notes you provide. These are used to generate estimates and guidance (not an appraisal).
            </li>
            <li>
              <strong>Buyer activity</strong> — saved listings, messages sent to sellers, preferences.
            </li>
            <li>
              <strong>Communications</strong> — messages sent via our platform, email you send us, and support requests.
            </li>
            <li>
              <strong>Device & usage data</strong> — IP address, browser type, pages viewed, referring/exit pages,
              timestamps, and similar analytics.
            </li>
            <li>
              <strong>Payment data</strong> — handled by our payment processor (e.g., card details).
              We receive limited information such as payment status and plan purchased.
            </li>
            <li>
              <strong>Cookies & similar tech</strong> — see <a href="#cookies" className="text-blue-700 hover:underline">Cookies</a>.
            </li>
          </ul>
        </Section>

        <Section title="2) How we use information">
          <ul className="list-disc list-inside space-y-2">
            <li>Operate, maintain, and improve the Service (including listings, valuation, scorecard, and messaging).</li>
            <li>Create and manage your account; provide customer support.</li>
            <li>Send transactional messages (e.g., confirmations, receipts, listing status, subscription reminders).</li>
            <li>Send marketing communications (you can opt out at any time).</li>
            <li>Detect, prevent, and address fraud, security, and abuse.</li>
            <li>Comply with legal obligations and enforce our Terms.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-600">
            <strong>No auto-renew:</strong> Plans do not auto-renew. We may email reminder notices about
            plan expiration so you can choose to renew.
          </p>
        </Section>

        <Section title="3) How we share information">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Service providers</strong> — cloud hosting, authentication, email delivery, analytics,
              and payments — strictly to operate the Service under contracts that limit use to our instructions.
            </li>
            <li>
              <strong>With other users</strong> — info you include in a public listing is visible to visitors;
              messages you send through our platform are shared with the counterparty.
            </li>
            <li>
              <strong>Legal & safety</strong> — to comply with law, respond to lawful requests, or protect the rights,
              property, or safety of you, us, or others.
            </li>
            <li>
              <strong>Business transfers</strong> — as part of a merger, acquisition, financing, or sale of assets.
            </li>
          </ul>
          <p className="mt-3 text-sm text-gray-700">
            We do <strong>not</strong> sell your personal information. See{' '}
            <a href="#ca-do-not-sell" className="text-blue-700 hover:underline">California Notice</a>.
          </p>
        </Section>

        <Section id="cookies" title="4) Cookies & analytics">
          <p className="mb-2">
            We use cookies and similar technologies to keep you logged in, remember preferences,
            measure site performance, and improve the Service. You can control cookies through your browser settings.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Strictly necessary</strong> — required for core functionality (cannot be disabled).</li>
            <li><strong>Performance/analytics</strong> — help us understand usage (you can opt out by using browser controls or blocking analytics scripts).</li>
            <li><strong>Marketing</strong> — if used, only to measure our own campaigns; we do not sell data to ad brokers.</li>
          </ul>
        </Section>

        <Section title="5) Legal bases (EEA/UK users)">
          <p>
            If you are in the EEA/UK, our legal bases include: (i) performance of a contract (providing the Service);
            (ii) legitimate interests (e.g., improving and securing the Service, communicating with you about similar features);
            (iii) consent (for certain marketing/optional cookies); and (iv) legal obligations.
          </p>
        </Section>

        <Section title="6) Data retention">
          <ul className="list-disc list-inside space-y-2">
            <li>Account and listing data — for the life of your account and as needed to comply with law or resolve disputes.</li>
            <li>Messages — typically up to 24 months after thread inactivity, unless law or disputes require longer.</li>
            <li>Valuation/scorecard inputs — retained to generate reports, improve tools, and provide your history on request.</li>
            <li>Analytics logs — typically 12–24 months in aggregate form.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-600">
            We may anonymize or aggregate data so it no longer identifies you and use it indefinitely.
          </p>
        </Section>

        <Section title="7) Your choices & rights">
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Access, update, delete</strong> — you can request a copy, correction, or deletion of your personal data.</li>
            <li><strong>Marketing opt-out</strong> — use the unsubscribe link in emails or contact us.</li>
            <li><strong>Cookies</strong> — manage via your browser; blocking some cookies may affect functionality.</li>
            <li><strong>GDPR (EEA/UK)</strong> — you may have rights to data portability, restriction/objection, and to withdraw consent where applicable.</li>
            <li><strong>CCPA/CPRA (California)</strong> — see the notice below for rights to know, delete, correct, and limit certain uses.</li>
          </ul>
          <p className="mt-3 text-sm">
            To exercise rights, email{' '}
            <a href="mailto:privacy@successionbridge.com" className="text-blue-700 hover:underline">
              privacy@successionbridge.com
            </a>. We may need to verify your identity.
          </p>
        </Section>

        <Section id="ca-do-not-sell" title="8) California privacy notice (CCPA/CPRA)">
          <ul className="list-disc list-inside space-y-2">
            <li>
              We do <strong>not “sell”</strong> or “share” personal information as defined by the CCPA/CPRA.
              If we ever change this, we will update this Notice and provide a right to opt out.
            </li>
            <li>
              You may request: (a) categories/specific pieces of personal information we collected about you;
              (b) deletion of personal information; and (c) correction of inaccurate information.
            </li>
            <li>
              We will not discriminate against you for exercising your rights. Authorized agents may submit requests with proof of authorization.
            </li>
          </ul>
          <p className="mt-3 text-sm">
            To submit a request, email{' '}
            <a href="mailto:privacy@successionbridge.com" className="text-blue-700 hover:underline">
              privacy@successionbridge.com
            </a>{' '}
            with “California Request” in the subject line.
          </p>
          <p className="mt-3 text-sm">
            <strong>Do Not Sell My Personal Information:</strong> Since we don’t sell your data,
            you don’t need to opt out. If you have questions, contact us at the address above.
          </p>
        </Section>

        <Section title="9) Security">
          <p>
            We use reasonable administrative, technical, and physical safeguards to protect personal information.
            No system is 100% secure. If you believe your account has been compromised, contact us immediately at{' '}
            <a href="mailto:security@successionbridge.com" className="text-blue-700 hover:underline">
              security@successionbridge.com
            </a>.
          </p>
        </Section>

        <Section title="10) International transfers">
          <p>
            We are based in the United States. If you access the Service from outside the U.S.,
            your information may be transferred to and processed in the U.S. or other countries
            with different data protection laws than your home country.
          </p>
        </Section>

        <Section title="11) Children’s privacy">
          <p>
            The Service is not directed to children under 18, and we do not knowingly collect personal
            information from children under 18. If you believe a child has provided us personal information,
            please contact us and we will take appropriate steps to delete it.
          </p>
        </Section>

        <Section title="12) Changes to this Privacy Notice">
          <p>
            We may update this Privacy Notice from time to time. If we make material changes, we will post a prominent notice
            or contact you as required by law. The “Last updated” date reflects the latest revision.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            Questions or requests about privacy? Email{' '}
            <a href="mailto:privacy@successionbridge.com" className="text-blue-700 hover:underline">
              privacy@successionbridge.com
            </a>.
          </p>
        </Section>

        <div className="mt-6 text-xs text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
      </div>
    </main>
  )
}

function Section({ title, children, id }) {
  return (
    <section id={id} className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
      <h2 className="text-xl font-semibold text-[#2E3A59]">{title}</h2>
      <div className="mt-3 text-gray-700 leading-relaxed">{children}</div>
    </section>
  )
}
