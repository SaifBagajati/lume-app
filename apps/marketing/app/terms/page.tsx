import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Terms of Service - Lume",
  description: "Lume terms of service and usage agreement.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-navy-500 mb-8">
            Terms of Service
          </h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">
              Last updated: January 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-slate-600">
                By accessing or using Lume&apos;s services, you agree to be bound
                by these Terms of Service. If you do not agree to these terms,
                please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                2. Description of Service
              </h2>
              <p className="text-slate-600">
                Lume provides a QR code-based ordering and payment platform for
                restaurants. Our services include menu management, order
                processing, and payment facilitation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                3. Account Registration
              </h2>
              <p className="text-slate-600 mb-4">
                To use our services, you must:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activity under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                4. Fees and Payment
              </h2>
              <p className="text-slate-600">
                You agree to pay all applicable fees for the services you use.
                Fees are billed monthly and are non-refundable except as
                expressly set forth in these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                5. Cancellation
              </h2>
              <p className="text-slate-600">
                You may cancel your subscription at any time. Cancellation will
                take effect at the end of your current billing period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                6. Contact Us
              </h2>
              <p className="text-slate-600">
                If you have any questions about these Terms of Service, please
                contact us at{" "}
                <a
                  href="mailto:legal@getlume.ca"
                  className="text-orange-500 hover:text-orange-600"
                >
                  legal@getlume.ca
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <Link
              href="/"
              className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
