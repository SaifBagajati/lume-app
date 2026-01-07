"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SquareStatus {
  enabled: boolean;
  locationId?: string;
  merchantId?: string;
  lastSyncAt?: string;
  syncStatus?: string;
  syncError?: string;
  tokenExpiring?: boolean;
}

export function POSIntegrationSetup() {
  const router = useRouter();
  const [squareStatus, setSquareStatus] = useState<SquareStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch Square status on mount and handle OAuth callback messages
  useEffect(() => {
    fetchSquareStatus();

    // Check for OAuth callback messages in URL
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success) {
      setMessage({ type: "success", text: success });
      // Clear URL params
      window.history.replaceState({}, "", "/menu");
      // Refresh the page after successful connection
      setTimeout(() => router.refresh(), 500);
    } else if (error) {
      setMessage({ type: "error", text: error });
      window.history.replaceState({}, "", "/menu");
    }
  }, [router]);

  const fetchSquareStatus = async () => {
    try {
      const response = await fetch("/api/integrations/square/status");
      if (response.ok) {
        const data = await response.json();
        setSquareStatus(data);
      }
    } catch (error) {
      console.error("Error fetching Square status:", error);
    }
  };

  const handleConnectSquare = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/square/connect");
      const data = await response.json();

      if (response.ok && data.authUrl) {
        // Redirect to Square OAuth
        window.location.href = data.authUrl;
      } else {
        setMessage({
          type: "error",
          text: "Failed to initiate Square connection",
        });
        setIsLoading(false);
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
      setIsLoading(false);
    }
  };

  const posProviders = [
    {
      name: "Square",
      logoUrl:
        "https://gdm-catalog-fmapi-prod.imgix.net/ProductLogo/f0986dce-1396-4b7d-9975-0a75e36e1afe.png?w=80&h=80&fit=max&dpr=3&auto=format&q=50",
      description: "All-in-one payment and POS",
      status: squareStatus?.enabled ? "connected" : "available",
    },
    {
      name: "Toast POS",
      logoUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsNSEzfTbyNbzOPqDxmdGgj5PcTGJv0QTo7w&s",
      description: "Popular cloud-based POS system",
      status: "coming_soon",
    },
    {
      name: "TouchBistro",
      logoUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPhSW2R2R-KLWOiEJjFsDUfgdk-tUo7g5Wtw&s",
      description: "iPad POS for restaurants",
      status: "coming_soon",
    },
    {
      name: "Clover",
      logoUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTyRuLYaWcv85WeiIxj3zWA0D9-rZ2kj1Pdw&s",
      description: "Business management platform",
      status: "coming_soon",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div
          className={`rounded-xl p-4 ${
            message.type === "success"
              ? "bg-mint-50 text-mint-800 border border-mint-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === "success" ? (
                <svg
                  className="h-5 w-5 text-mint-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setMessage(null)}
                className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-navy-500 mb-2">
          Connect Your POS System
        </h2>
        <p className="text-slate-600 max-w-md mx-auto">
          Link your Point of Sale system to automatically sync your menu items, prices, and availability.
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl bg-blue-50 p-4 border border-blue-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Why connect your POS?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Automatically sync menu items and prices</li>
                <li>Keep availability in sync with your inventory</li>
                <li>No manual menu updates needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* POS Providers Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {posProviders.map((provider) => (
          <div
            key={provider.name}
            className={`relative rounded-xl border bg-white px-6 py-5 shadow-sm transition-colors ${
              provider.status === "connected"
                ? "border-mint-400"
                : provider.status === "available"
                ? "border-slate-300 hover:border-orange-400"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-slate-200">
                  <img
                    src={provider.logoUrl}
                    alt={`${provider.name} logo`}
                    className="h-full w-full object-contain p-1"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-navy-500">
                    {provider.name}
                  </p>
                  {provider.status === "connected" && (
                    <span className="inline-flex items-center rounded-full bg-mint-100 px-2.5 py-0.5 text-xs font-medium text-mint-800">
                      Connected
                    </span>
                  )}
                  {provider.status === "available" && (
                    <button
                      onClick={handleConnectSquare}
                      disabled={isLoading}
                      className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? "Connecting..." : "Connect"}
                    </button>
                  )}
                  {provider.status === "coming_soon" && (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {provider.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
