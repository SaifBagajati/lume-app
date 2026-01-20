import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Contact - Lume",
  description: "Get in touch with the Lume team. We'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-navy-500 mb-4">Contact Us</h1>
          <p className="text-lg text-slate-600 mb-8">
            Have questions? We&apos;d love to hear from you.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Sales */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-navy-500 mb-2">Sales</h2>
              <p className="text-slate-600 text-sm mb-4">
                Interested in Lume for your restaurant? Let&apos;s chat.
              </p>
              <a
                href="mailto:sales@getlume.ca"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                sales@getlume.ca
              </a>
            </div>

            {/* Support */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-12 h-12 bg-mint-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-mint-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-navy-500 mb-2">
                Support
              </h2>
              <p className="text-slate-600 text-sm mb-4">
                Already a customer? Our support team is here to help.
              </p>
              <a
                href="mailto:support@getlume.ca"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                support@getlume.ca
              </a>
            </div>

            {/* General */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-navy-500 mb-2">
                General Inquiries
              </h2>
              <p className="text-slate-600 text-sm mb-4">
                For everything else, drop us a line.
              </p>
              <a
                href="mailto:hello@getlume.ca"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                hello@getlume.ca
              </a>
            </div>

            {/* Press */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-navy-500 mb-2">Press</h2>
              <p className="text-slate-600 text-sm mb-4">
                Media inquiries and press requests.
              </p>
              <a
                href="mailto:press@getlume.ca"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                press@getlume.ca
              </a>
            </div>
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
