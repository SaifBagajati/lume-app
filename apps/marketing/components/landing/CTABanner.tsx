import Link from "next/link";

export default function CTABanner() {
  return (
    <section className="py-12 lg:py-16 bg-orange-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Ready to see it in action?
        </h2>
        <p className="text-orange-100 mb-6 text-lg">
          Start your free 14-day trial. No credit card required.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-orange-500 px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </section>
  );
}
