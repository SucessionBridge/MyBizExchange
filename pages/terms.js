// pages/terms.js
import Head from 'next/head'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Head>
        <title>Terms of Use — SuccessionBridge</title>
        <meta
          name="description"
          content="Terms of Use for SuccessionBridge. Please read these terms carefully before using our website and services."
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#2E3A59]">
          Terms of Use
        </h1>
        <p className="mt-4 text-gray-700">
          YOUR USE OF THIS WEBSITE AND SERVICE MEANS YOU AGREE TO THESE TERMS. If you do not agree,
          please do not use SuccessionBridge.
        </p>

        {/* 1. Who we are / Definitions */}
        <Section title="1) Who we are & definitions">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>SuccessionBridge</strong> (“<strong>we</strong>,” “<strong>us</strong>,” “<strong>our</strong>”) provides tools for owners to list businesses for sale, for buyers to discover opportunities, and utilities like a valuation estimator and a sellability scorecard.
            </li>
            <li>
              <strong>Website</strong> means our site, app(s), and related interfaces we operate.
            </li>
            <li>
              <strong>Product/Service</strong> means the Website, listings, messaging, tools, documents, and all content we provide.
            </li>
            <li>
              <strong>Listing</strong> means a posted offer to sell a business, business assets, franchise territory, or related opportunity.
            </li>
            <li>
              <strong>Submitted Content</strong> means anything you upload or submit (text, images, data, attachments, messages).
            </li>
            <li>
              <strong>Privacy Notice</strong> refers to our <Link href="/privacy"><a className="text-blue-700 hover:underline">Privacy Notice</a></Link>, incorporated by reference.
            </li>
          </ul>
        </Section>

        {/* 2. Eligibility & acceptance */}
        <Section title="2) Eligibility & acceptance">
          <ul className="list-disc list-inside space-y-2">
            <li>You must be at least 18 years old and able to form a binding contract to use the Service.</li>
            <li>
              By accessing or using the Service, you agree to these Terms and our Privacy Notice. We may update these Terms at any time by posting a revised version with an effective date; your continued use means you accept the changes.
            </li>
            <li>
              If you have a separate written agreement with us for a specific product or promotion, that agreement will control to the extent it conflicts with these Terms for that specific product or promotion.
            </li>
          </ul>
        </Section>

        {/* 3. Accounts, access & security */}
        <Section title="3) Accounts, access & security">
          <ul className="list-disc list-inside space-y-2">
            <li>You’re responsible for your account credentials and all activity under your account. Keep logins confidential.</li>
            <li>Don’t share accounts, circumvent security, probe, scrape, or attempt to access areas you’re not authorized to access.</li>
            <li>Tell us immediately if you suspect unauthorized access: <a className="text-blue-700 hover:underline" href="mailto:security@successionbridge.com">security@successionbridge.com</a>.</li>
          </ul>
        </Section>

        {/* 4. Permitted & prohibited uses */}
        <Section title="4) Permitted & prohibited uses">
          <p className="mb-2">You may use the Service to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>View listings, create and manage your own listings, message through our system, and use our tools for your business purposes.</li>
            <li>Link to our public pages in a way that is fair and legal and does not damage our reputation.</li>
          </ul>
          <p className="mt-4 mb-2">You may <strong>not</strong>:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Copy, scrape, spider, harvest, bulk-download, frame, mirror, or create derivative works from the Service or data.</li>
            <li>Reverse engineer, decompile, or attempt to derive the source of any part of the Service.</li>
            <li>Use the Service to send spam, unlawful, defamatory, obscene, hateful, infringing, or misleading material.</li>
            <li>Upload viruses, malware, or anything that interferes with or harms the Service or other users.</li>
            <li>Use the Service in connection with securities offerings or to provide consumer reports or similar regulated services.</li>
          </ul>
        </Section>

        {/* 5. Listings & content rules */}
        <Section title="5) Listings & content rules">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Accuracy.</strong> You’re solely responsible for your Listings and Submitted Content. Post only accurate, lawful information you’re authorized to share. Keep it up to date and remove it when no longer available.
            </li>
            <li>
              <strong>One opportunity per listing.</strong> Don’t reuse a listing slot to market a different business. Don’t embed phone numbers, emails, or external URLs in listing images to bypass our messaging.
            </li>
            <li>
              <strong>Timely responses.</strong> Aim to respond to qualified buyer inquiries within 3 business days.
            </li>
            <li>
              <strong>Ownership & license.</strong> You retain ownership of your Submitted Content. You grant us a worldwide, non-exclusive, royalty-free license to host, store, reproduce, display, distribute, and modify your Submitted Content as needed to operate, improve, and market the Service (for example, showing your listing on category pages, emails, and social posts). You can delete your Listing; we may retain archived copies as required by law or for legitimate business purposes.
            </li>
            <li>
              <strong>Moderation.</strong> We may remove or edit content that violates these Terms or the law, or that we reasonably deem misleading or harmful. We’re not obligated to monitor all content.
            </li>
            <li>
              <strong>Brokers/intermediaries.</strong> If you present yourself as a broker, agent, or intermediary, you represent you are properly licensed and compliant wherever required. We are not your broker and are not a party to user transactions.
            </li>
          </ul>
        </Section>

        {/* 6. Tools & no-appraisal disclaimer */}
        <Section title="6) Valuation tools, scorecards & no-appraisal disclaimer">
          <ul className="list-disc list-inside space-y-2">
            <li>
              Our valuation estimates, scorecards, templates, and guides are <strong>indicative only</strong>. They are not appraisals, guarantees, legal advice, tax advice, accounting advice, or financing commitments.
            </li>
            <li>
              Do not use our outputs for lending, tax filings, insurance claims, or legal matters. Consult your own professional advisors.
            </li>
            <li>
              We do not verify the information you enter. Results depend on your inputs and market conditions.
            </li>
          </ul>
        </Section>

        {/* 7. Fees & subscriptions (no auto-renew) */}
        <Section title="7) Fees & subscriptions (no auto-renew)">
          <ul className="list-disc list-inside space-y-2">
            <li>
              Current seller plans are shown on our <Link href="/pricing"><a className="text-blue-700 hover:underline">Pricing</a></Link> page (e.g., Monthly Flex with 3-month minimum, 6-Month Saver prepaid, and 1-Year). Prices are in USD unless stated otherwise.
            </li>
            <li>
              <strong>No auto-renew:</strong> plans do not automatically renew. We’ll send reminder emails about one week before your term ends so you can choose to renew.
            </li>
            <li>
              <strong>Billing & refunds:</strong> Charges are collected via our payment processor. Fees are generally non-refundable once a listing goes live or a term begins, except where required by law.
            </li>
            <li>
              You agree to keep your payment and contact details current and to pay all applicable taxes.
            </li>
          </ul>
        </Section>

        {/* 8. Communications & marketing */}
        <Section title="8) Communications & marketing">
          <ul className="list-disc list-inside space-y-2">
            <li>
              By using the Service, you consent to receive transactional emails (e.g., receipts, expiry reminders). You can opt out of marketing emails at any time via the unsubscribe link.
            </li>
            <li>
              Don’t use our messaging or contact tools to send unsolicited or unlawful marketing. Comply with all anti-spam laws.
            </li>
          </ul>
        </Section>

        {/* 9. Intellectual property */}
        <Section title="9) Intellectual property">
          <ul className="list-disc list-inside space-y-2">
            <li>
              The Service, including its design, software, and original content, is owned by us or our licensors and is protected by intellectual property laws. Except for the limited rights expressly granted in these Terms, we reserve all rights.
            </li>
            <li>
              You may not use our trademarks, logos, or branding without our prior written consent.
            </li>
          </ul>
        </Section>

        {/* 10. Copyright (DMCA) */}
        <Section title="10) Copyright notices (DMCA)">
          <p className="mb-2">
            We respect intellectual property rights. If you believe content on our Service infringes your copyright, send a notice to our designated agent with:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Your physical or electronic signature;</li>
            <li>Identification of the copyrighted work and the allegedly infringing material (URL(s) help);</li>
            <li>Your contact information (name, address, phone, email);</li>
            <li>A statement that you have a good-faith belief the use is not authorized; and</li>
            <li>A statement under penalty of perjury that the notice is accurate and you are authorized to act.</li>
          </ul>
          <p className="mt-3">
            <strong>Designated Agent:</strong> Legal, SuccessionBridge — <a className="text-blue-700 hover:underline" href="mailto:legal@successionbridge.com">legal@successionbridge.com</a>
          </p>
          <p className="text-xs text-gray-600 mt-2">
            If your content was removed by mistake, you may send a counter-notice with the information required by 17 U.S.C. §512.
          </p>
        </Section>

        {/* 11. Third-party links */}
        <Section title="11) Third-party links & services">
          <p>
            The Service may link to third-party sites or use third-party tools (e.g., payments). We don’t control those sites or services and aren’t responsible for their content or policies. Review their terms and privacy notices.
          </p>
        </Section>

        {/* 12. Suspension & termination */}
        <Section title="12) Suspension & termination">
          <ul className="list-disc list-inside space-y-2">
            <li>We may suspend or terminate access, remove content, or block accounts that violate these Terms or the law.</li>
            <li>On termination, your right to use the Service ends. Certain sections of these Terms survive termination.</li>
          </ul>
        </Section>

        {/* 13. Disclaimers */}
        <Section title="13) Disclaimers">
          <p className="mb-2">
            THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>We don’t guarantee uninterrupted or error-free operation, or accuracy, timeliness, or completeness of content.</li>
            <li>We are not a broker, appraiser, law firm, accounting firm, lender, insurer, or financial advisor, and we are not a party to user transactions.</li>
            <li>You are responsible for your due diligence and professional advice before any transaction.</li>
          </ul>
        </Section>

        {/* 14. Limitation of liability */}
        <Section title="14) Limitation of liability">
          <ul className="list-disc list-inside space-y-2">
            <li>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA, GOODWILL, OR REPUTATION.
            </li>
            <li>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO LIABILITY OR (B) USD $100.
            </li>
          </ul>
        </Section>

        {/* 15. Indemnity */}
        <Section title="15) Indemnification">
          <p>
            You agree to defend, indemnify, and hold harmless SuccessionBridge and our officers, directors, employees, and agents from any claims, damages, liabilities, costs, and expenses (including reasonable attorneys’ fees) arising from your Listings, Submitted Content, use of the Service, or violation of these Terms or applicable law.
          </p>
        </Section>

        {/* 16. Governing law & venue */}
        <Section title="16) Governing law & venue">
          <p>
            These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-law rules. You and we agree to the exclusive jurisdiction and venue of the state and federal courts located in Delaware for any dispute not subject to arbitration (if arbitration is later offered and agreed in writing).
          </p>
        </Section>

        {/* 17. Miscellaneous */}
        <Section title="17) Miscellaneous">
          <ul className="list-disc list-inside space-y-2">
            <li>If any part of these Terms is found unenforceable, the rest remains in effect.</li>
            <li>Headings are for convenience only.</li>
            <li>You may not assign these Terms without our consent. We may assign them to an affiliate or in connection with a merger, acquisition, or sale.</li>
            <li>These Terms (plus any referenced policies) are the entire agreement between you and us about the Service.</li>
          </ul>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <p>
            Questions about these Terms? Contact us at{' '}
            <a className="text-blue-700 hover:underline" href="mailto:support@successionbridge.com">support@successionbridge.com</a>.
          </p>
        </Section>

        <div className="mt-6 text-xs text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
      </div>
    </main>
  )
}

function Section({ title, children }) {
  return (
    <section className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
      <h2 className="text-xl font-semibold text-[#2E3A59]">{title}</h2>
      <div className="mt-3 text-gray-700 leading-relaxed">{children}</div>
    </section>
  )
}
