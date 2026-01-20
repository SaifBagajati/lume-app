import Link from "next/link";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

export const metadata = {
  title: "Setup Your Restaurant - Lume",
  description: "Complete your restaurant setup to start taking orders.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-orange-500">
              Lume
            </Link>
            <span className="text-sm text-slate-500">Setup Wizard</span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <OnboardingProgress />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
