import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Privacy Policy - Lume",
  description: "Lume privacy policy and data handling practices.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-navy-500 mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">
              Last updated: January 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                1. Information We Collect
              </h2>
              <p className="text-slate-600 mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Account information (name, email, password)</li>
                <li>Restaurant information (name, address, phone)</li>
                <li>Payment information (processed by our payment partners)</li>
                <li>Order and transaction data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-slate-600 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Provide and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                3. Data Security
              </h2>
              <p className="text-slate-600">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                4. Contact Us
              </h2>
              <p className="text-slate-600">
                If you have any questions about this Privacy Policy, please
                contact us at{" "}
                <a
                  href="mailto:privacy@getlume.ca"
                  className="text-orange-500 hover:text-orange-600"
                >
                  privacy@getlume.ca
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
