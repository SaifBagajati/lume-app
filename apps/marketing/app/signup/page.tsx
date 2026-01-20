import Link from "next/link";
import SignupForm from "@/components/signup/SignupForm";

export const metadata = {
  title: "Sign Up - Lume",
  description: "Create your Lume account and start taking QR orders today.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-bold text-orange-500">Lume</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy-500">
              Start your free trial
            </h1>
            <p className="mt-2 text-slate-600">
              Get up and running in under an hour. No credit card required.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <SignupForm />
          </div>
        </div>
      </div>

      {/* Right side - Marketing */}
      <div className="hidden lg:flex lg:flex-1 bg-navy-500 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Join 500+ Canadian Restaurants
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Transform your dining experience with QR code ordering. Guests
              scan, order, and pay from their phones while your staff focuses on
              hospitality.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-orange-500">25%</p>
              <p className="text-sm text-slate-400">Faster turns</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-500">15%</p>
              <p className="text-sm text-slate-400">Larger checks</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-500">50%</p>
              <p className="text-sm text-slate-400">More tables</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
