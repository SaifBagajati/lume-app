import Link from "next/link";

// Sample menu items for the phone mockup
const sampleMenuItems = [
  {
    name: "Truffle Burger",
    description: "Angus beef, truffle aioli, aged cheddar",
    price: "$18.99",
  },
  {
    name: "Caesar Salad",
    description: "Romaine, parmesan, house croutons",
    price: "$14.50",
  },
  {
    name: "Fish & Chips",
    description: "Beer-battered cod, hand-cut fries",
    price: "$22.00",
  },
];

export default function Hero() {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-white -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Now serving Canadian restaurants
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy-500 leading-tight">
              Turn Every Table Into a{" "}
              <span className="text-orange-500">Revenue Machine</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Lume gives your guests the power to scan, order, and pay from
              their phones. Reduce wait times, increase table turns, and let
              your staff focus on hospitality.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-orange-500/25"
              >
                Start Your Free Trial
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
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-navy-500 px-8 py-4 rounded-xl font-semibold text-lg transition-colors border border-slate-200"
              >
                See How It Works
              </a>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              14-day free trial. No credit card required.
            </p>
          </div>

          {/* Hero Image - Phone mockup showing customer app */}
          <div className="relative">
            <div className="relative mx-auto max-w-[280px] lg:max-w-[320px]">
              {/* Phone frame */}
              <div className="relative bg-navy-500 rounded-[2.5rem] p-2 shadow-2xl">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-navy-500 rounded-b-2xl z-10" />

                <div className="bg-slate-100 rounded-[2rem] overflow-hidden">
                  {/* Phone screen content - Customer App */}
                  <div className="h-[520px] overflow-hidden">
                    {/* Restaurant Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-4 pt-8">
                      <h2 className="text-lg font-bold">The Copper Pot</h2>
                      <p className="text-orange-100 text-xs">Browse our menu</p>
                    </div>

                    {/* Category Tabs */}
                    <div className="bg-white border-b border-slate-200 px-3 py-2 flex gap-2 overflow-x-auto">
                      <span className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg whitespace-nowrap">
                        Mains
                      </span>
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg whitespace-nowrap">
                        Starters
                      </span>
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg whitespace-nowrap">
                        Drinks
                      </span>
                    </div>

                    {/* Menu Items */}
                    <div className="p-3 space-y-3 bg-slate-100">
                      {sampleMenuItems.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl shadow-sm overflow-hidden"
                        >
                          {/* Item Image Placeholder */}
                          <div className="h-24 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                            <svg
                              className="h-8 w-8 text-orange-300"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          {/* Item Content */}
                          <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="text-sm font-semibold text-navy-500">
                                {item.name}
                              </h3>
                              <span className="text-sm font-bold text-orange-500">
                                {item.price}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">
                              {item.description}
                            </p>
                            <button className="w-full py-2 bg-orange-500 text-white text-xs font-medium rounded-lg">
                              Add to Order
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-lg p-3 hidden lg:block">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-mint-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-mint-600"
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
                  <div>
                    <p className="text-xs font-semibold text-navy-500">
                      Order Received
                    </p>
                    <p className="text-[10px] text-slate-400">Table 5</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-1/4 bg-white rounded-xl shadow-lg p-3 hidden lg:block">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-orange-500"
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
                  <div>
                    <p className="text-xs font-semibold text-navy-500">
                      Payment Complete
                    </p>
                    <p className="text-[10px] text-slate-400">$47.50</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
