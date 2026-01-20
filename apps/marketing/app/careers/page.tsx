import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Careers - Lume",
  description: "Join the Lume team and help us transform Canadian restaurants.",
};

export default function CareersPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-navy-500 mb-4">
            Careers at Lume
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Help us build the future of restaurant technology in Canada.
          </p>

          {/* Culture Section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-navy-500 mb-4">
              Why Lume?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                  <svg
                    className="w-5 h-5 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-navy-500 mb-1">
                  Real Impact
                </h3>
                <p className="text-sm text-slate-600">
                  Your work directly helps restaurants thrive and guests have
                  better experiences.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="w-10 h-10 bg-mint-100 rounded-lg flex items-center justify-center mb-3">
                  <svg
                    className="w-5 h-5 text-mint-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-navy-500 mb-1">Flexibility</h3>
                <p className="text-sm text-slate-600">
                  Remote-first culture. Work from anywhere in Canada.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-navy-500 mb-1">Small Team</h3>
                <p className="text-sm text-slate-600">
                  No bureaucracy. Your voice matters and your ideas ship.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-navy-500 mb-1">
                  Competitive Pay
                </h3>
                <p className="text-sm text-slate-600">
                  Salary, equity, and benefits that respect your value.
                </p>
              </div>
            </div>
          </section>

          {/* Open Positions */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-navy-500 mb-4">
              Open Positions
            </h2>
            <div className="bg-slate-50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-navy-500 mb-2">
                No open positions right now
              </h3>
              <p className="text-slate-600 mb-4">
                We&apos;re not actively hiring, but we&apos;re always interested
                in meeting talented people.
              </p>
              <a
                href="mailto:careers@getlume.ca"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Send us your resume →
              </a>
            </div>
          </section>

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
