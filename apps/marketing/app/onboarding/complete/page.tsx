"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OnboardingComplete() {
  const [tableCount, setTableCount] = useState(0);
  const [posType, setPosType] = useState("");

  useEffect(() => {
    // Get stored values from localStorage
    const tables = localStorage.getItem("onboarding_tables");
    const pos = localStorage.getItem("onboarding_pos");

    if (tables) setTableCount(parseInt(tables));
    if (pos) setPosType(pos);
  }, []);

  const getPosName = (pos: string) => {
    switch (pos) {
      case "square":
        return "Square";
      case "toast":
        return "Toast";
      case "clover":
        return "Clover";
      case "lightspeed":
        return "Lightspeed";
      default:
        return "Manual";
    }
  };

  return (
    <div className="text-center">
      {/* Success Animation */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-mint-100 rounded-full mb-4">
          <svg
            className="w-12 h-12 text-mint-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-navy-500 mb-2">
          You&apos;re All Set!
        </h1>
        <p className="text-lg text-slate-600">
          Your restaurant is ready to start taking orders with Lume.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 text-left">
        <h2 className="font-semibold text-navy-500 mb-4">Setup Summary</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Tables configured</span>
            <span className="font-semibold text-navy-500">{tableCount} tables</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">POS integration</span>
            <span className="font-semibold text-navy-500">{getPosName(posType)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-600">Trial period</span>
            <span className="font-semibold text-mint-600">14 days free</span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
        <h2 className="font-semibold text-navy-500 mb-4">What&apos;s Next?</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
              1
            </span>
            <div>
              <p className="font-medium text-navy-500">
                {posType !== "none" ? "Connect your POS" : "Add your menu items"}
              </p>
              <p className="text-sm text-slate-500">
                {posType !== "none"
                  ? "Complete the POS connection to sync your menu automatically"
                  : "Add your menu categories and items from the dashboard"}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
              2
            </span>
            <div>
              <p className="font-medium text-navy-500">Print your QR codes</p>
              <p className="text-sm text-slate-500">
                Download and print QR codes for each table from your dashboard
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
              3
            </span>
            <div>
              <p className="font-medium text-navy-500">Start taking orders</p>
              <p className="text-sm text-slate-500">
                Place QR codes on tables and you&apos;re ready to go live
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <Link
        href="http://localhost:3001"
        className="inline-flex items-center justify-center w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
      >
        Go to Dashboard
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
        Need help?{" "}
        <a href="mailto:hello@getlume.ca" className="text-orange-500 hover:text-orange-600">
          Contact our support team
        </a>
      </p>
    </div>
  );
}
