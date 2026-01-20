import Link from "next/link";

export const metadata = {
  title: "Welcome to Lume!",
  description: "Your account has been created successfully.",
};

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-mint-100 rounded-full">
            <svg
              className="w-10 h-10 text-mint-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-navy-500 mb-4">
          Welcome to Lume!
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Your account has been created successfully. Let&apos;s get your
          restaurant set up.
        </p>

        {/* Steps Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 text-left">
          <h2 className="font-semibold text-navy-500 mb-4">
            Here&apos;s what&apos;s next:
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <span className="text-slate-600">
                Add your restaurant details
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <span className="text-slate-600">
                Connect your POS system (optional)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <span className="text-slate-600">
                Set up your tables and QR codes
              </span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
        >
          Continue Setup
          <svg
            className="ml-2 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>

        <p className="mt-4 text-sm text-slate-500">
          Takes about 5 minutes to complete
        </p>
      </div>
    </div>
  );
}
