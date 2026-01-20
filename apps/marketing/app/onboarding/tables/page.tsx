"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingTables() {
  const router = useRouter();
  const [tableCount, setTableCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    setIsLoading(true);

    // Store in localStorage
    localStorage.setItem("onboarding_tables", tableCount.toString());

    // Navigate to completion
    router.push("/onboarding/complete");
  };

  const previewTables = Array.from({ length: Math.min(tableCount, 12) }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-500">
          Set Up Your Tables
        </h1>
        <p className="mt-2 text-slate-600">
          How many tables does your restaurant have? We&apos;ll generate a unique QR
          code for each one.
        </p>
      </div>

      {/* Table Count Input */}
      <div className="mb-8">
        <label
          htmlFor="tableCount"
          className="block text-sm font-medium text-navy-500 mb-3"
        >
          Number of Tables
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTableCount(Math.max(1, tableCount - 1))}
            className="w-12 h-12 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-600 hover:text-navy-500 transition-colors"
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
                d="M20 12H4"
              />
            </svg>
          </button>
          <input
            type="number"
            id="tableCount"
            value={tableCount}
            onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="100"
            className="w-24 text-center text-2xl font-bold text-navy-500 px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
          />
          <button
            onClick={() => setTableCount(Math.min(100, tableCount + 1))}
            className="w-12 h-12 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-600 hover:text-navy-500 transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          You can always add more tables later from your dashboard.
        </p>
      </div>

      {/* Preview */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-navy-500 mb-3">Preview</h3>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {previewTables.map((num) => (
              <div
                key={num}
                className="aspect-square bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center p-2"
              >
                <svg
                  className="w-6 h-6 text-slate-400 mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <span className="text-xs font-medium text-slate-600">
                  T-{num}
                </span>
              </div>
            ))}
            {tableCount > 12 && (
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-medium text-slate-500">
                  +{tableCount - 12}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
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
          <div>
            <p className="text-sm text-orange-700 font-medium">
              QR Codes will be generated
            </p>
            <p className="text-sm text-orange-600 mt-1">
              After setup, you&apos;ll be able to print QR codes for each table
              from your dashboard. Place them on table tents or stickers.
            </p>
          </div>
        </div>
      </div>

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
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
        >
          {isLoading ? "Setting up..." : "Complete Setup"}
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
