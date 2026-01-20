"use client";

import { usePathname } from "next/navigation";

const steps = [
  { name: "Restaurant Info", path: "/onboarding" },
  { name: "POS Integration", path: "/onboarding/pos" },
  { name: "Table Setup", path: "/onboarding/tables" },
  { name: "Complete", path: "/onboarding/complete" },
];

export default function OnboardingProgress() {
  const pathname = usePathname();

  const currentStepIndex = steps.findIndex((step) => step.path === pathname);

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.path}
              className="flex flex-col items-center flex-1"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  index < currentStepIndex
                    ? "bg-mint-500 text-white"
                    : index === currentStepIndex
                      ? "bg-orange-500 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {index < currentStepIndex ? (
                  <svg
                    className="w-4 h-4"
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
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium hidden sm:block ${
                  index <= currentStepIndex ? "text-navy-500" : "text-slate-400"
                }`}
              >
                {step.name}
              </span>
            </div>
          ))}
        </div>

        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 -z-10">
          <div
            className="h-full bg-mint-500 transition-all duration-300"
            style={{
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
