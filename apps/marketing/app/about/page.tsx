import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "About - Lume",
  description: "Learn about Lume and our mission to help Canadian restaurants thrive.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-navy-500 mb-8">About Lume</h1>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                Our Mission
              </h2>
              <p className="text-slate-600 mb-4">
                Lume was built with a simple mission: help Canadian restaurants
                serve more guests with less stress. We believe technology should
                make dining better for everyone—guests, servers, and owners alike.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                Why We Built Lume
              </h2>
              <p className="text-slate-600 mb-4">
                We saw restaurants struggling with staffing shortages, rising
                costs, and increasing guest expectations. At the same time, diners
                were frustrated with long waits—waiting for menus, waiting to
                order, waiting for the bill.
              </p>
              <p className="text-slate-600 mb-4">
                Lume bridges that gap. Guests get the convenience they want.
                Restaurants get the efficiency they need. Everyone wins.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                Built for Canadians by Canadians
              </h2>
              <p className="text-slate-600 mb-4">
                We&apos;re proudly Canadian. Our team understands the unique
                challenges facing Canadian restaurants—from tipping culture to
                payment preferences to the POS systems you actually use. Lume is
                designed from the ground up for the Canadian market.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">
                Our Values
              </h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>
                  <strong>Simplicity</strong> — Technology should make things
                  easier, not harder.
                </li>
                <li>
                  <strong>Reliability</strong> — Your restaurant runs on tight
                  margins. We don&apos;t let you down.
                </li>
                <li>
                  <strong>Partnership</strong> — We succeed when you succeed.
                  It&apos;s that simple.
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
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
