"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const posOptions = [
  {
    id: "square",
    name: "Square",
    description: "Connect your Square account for automatic menu sync",
    available: true,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 0h15A4.5 4.5 0 0124 4.5v15a4.5 4.5 0 01-4.5 4.5h-15A4.5 4.5 0 010 19.5v-15A4.5 4.5 0 014.5 0zm.75 5.25a.75.75 0 00-.75.75v12a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75V6a.75.75 0 00-.75-.75H5.25z" />
      </svg>
    ),
  },
  {
    id: "toast",
    name: "Toast",
    description: "Connect your Toast POS for seamless integration",
    available: true,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  {
    id: "clover",
    name: "Clover",
    description: "Clover POS integration",
    available: false,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
      </svg>
    ),
  },
  {
    id: "lightspeed",
    name: "Lightspeed",
    description: "Lightspeed Restaurant POS",
    available: false,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
      </svg>
    ),
  },
  {
    id: "none",
    name: "No POS / Manual",
    description: "Add your menu items manually without POS integration",
    available: true,
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
];

export default function OnboardingPOS() {
  const router = useRouter();
  const [selectedPOS, setSelectedPOS] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    if (!selectedPOS) return;

    setIsLoading(true);

    // Store selection in localStorage
    localStorage.setItem("onboarding_pos", selectedPOS);

    // Navigate to next step
    router.push("/onboarding/tables");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-500">
          Connect Your POS System
        </h1>
        <p className="mt-2 text-slate-600">
          Connect your existing POS to automatically sync your menu, or add
          items manually.
        </p>
      </div>

      {/* POS Options */}
      <div className="space-y-3 mb-8">
        {posOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => option.available && setSelectedPOS(option.id)}
            disabled={!option.available}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              selectedPOS === option.id
                ? "border-orange-500 bg-orange-50"
                : option.available
                  ? "border-slate-200 hover:border-slate-300 bg-white"
                  : "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
            }`}
          >
            <div
              className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
                selectedPOS === option.id
                  ? "bg-orange-100 text-orange-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {option.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-navy-500">
                  {option.name}
                </span>
                {!option.available && (
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{option.description}</p>
            </div>
            {selectedPOS === option.id && (
              <svg
                className="w-6 h-6 text-orange-500 flex-shrink-0"
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
            )}
          </button>
        ))}
      </div>

      {/* Info banner for POS integration */}
      {selectedPOS && selectedPOS !== "none" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-blue-700">
              You&apos;ll be redirected to connect your {selectedPOS === "square" ? "Square" : "Toast"} account after setup. Your menu will sync automatically once connected.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-slate-200">
        <button
          onClick={() => router.back()}
          className="text-slate-600 hover:text-navy-500 font-medium flex items-center gap-2"
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
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedPOS || isLoading}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
        >
          {isLoading ? "Saving..." : "Continue"}
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
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
