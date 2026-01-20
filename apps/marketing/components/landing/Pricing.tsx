import Link from "next/link";

const features = [
  "Unlimited orders",
  "QR code generation for all tables",
  "Real-time order dashboard",
  "POS integration (Square, Toast)",
  "Apple Pay & Google Pay",
  "Bill splitting",
  "Menu management",
  "Analytics & reporting",
  "Email support",
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-500">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            One plan with everything you need. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Badge */}
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-sm font-semibold px-4 py-1 rounded-bl-xl">
              14-Day Free Trial
            </div>

            <div className="p-8 lg:p-10">
              {/* Price */}
              <div className="text-center mb-8">
                <p className="text-slate-600 font-medium mb-2">Per location</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl lg:text-6xl font-bold text-navy-500">
                    $49
                  </span>
                  <span className="text-slate-500 text-lg">/month</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-mint-500 mt-0.5 flex-shrink-0"
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
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/signup"
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
              >
                Start Your Free Trial
              </Link>

              <p className="text-center text-sm text-slate-500 mt-4">
                No credit card required. Cancel anytime.
              </p>
            </div>
          </div>

          {/* Additional info */}
          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Need a custom plan for multiple locations?{" "}
              <a
                href="mailto:hello@getlume.ca"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
