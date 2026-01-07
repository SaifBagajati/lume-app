"use client";

import { useState, useEffect } from "react";

interface SquareStatus {
  enabled: boolean;
  locationId?: string;
  merchantId?: string;
  lastSyncAt?: string;
  syncStatus?: string;
  syncError?: string;
  tokenExpiring?: boolean;
}

export function POSIntegration() {
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
      window.history.replaceState({}, "", "/settings");
      // Refresh status after successful connection
      setTimeout(() => fetchSquareStatus(), 500);
    } else if (error) {
      setMessage({ type: "error", text: error });
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

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

  const handleDisconnectSquare = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect Square? Your menu data will be preserved, but the integration will be removed."
      )
    ) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/square/disconnect", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Square disconnected successfully",
        });
        fetchSquareStatus();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to disconnect",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/square/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Sync started successfully. Synced ${data.stats?.categories || 0} categories and ${data.stats?.items || 0} items.`,
        });
        fetchSquareStatus();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to sync",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const posProviders = [
    {
      name: "Toast POS",
      logoUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsNSEzfTbyNbzOPqDxmdGgj5PcTGJv0QTo7w&s",
      initial: "T",
      bgColor: "bg-white",
      description: "Popular cloud-based POS system",
      status: "coming_soon",
      useImage: true,
    },
    {
      name: "TouchBistro",
      logoUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPhSW2R2R-KLWOiEJjFsDUfgdk-tUo7g5Wtw&s",
      initial: "TB",
      bgColor: "bg-white",
      description: "iPad POS for restaurants",
      status: "coming_soon",
      useImage: true,
    },
    {
      name: "Square",
      logoUrl:
        "https://gdm-catalog-fmapi-prod.imgix.net/ProductLogo/f0986dce-1396-4b7d-9975-0a75e36e1afe.png?w=80&h=80&fit=max&dpr=3&auto=format&q=50",
      initial: "□",
      bgColor: "bg-white",
      description: "All-in-one payment and POS",
      status: squareStatus?.enabled ? "connected" : "available",
      useImage: true,
    },
    {
      name: "Clover",
      logoUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTyRuLYaWcv85WeiIxj3zWA0D9-rZ2kj1Pdw&s",
      initial: "C",
      bgColor: "bg-white",
      description: "Business management platform",
      status: "coming_soon",
      useImage: true,
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

      {/* Square Connected Status */}
      {squareStatus?.enabled && (
        <div className="rounded-xl bg-mint-50 p-6 border border-mint-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center">
                  <img
                    src="https://gdm-catalog-fmapi-prod.imgix.net/ProductLogo/f0986dce-1396-4b7d-9975-0a75e36e1afe.png?w=80&h=80&fit=max&dpr=3&auto=format&q=50"
                    alt="Square logo"
                    className="h-full w-full object-contain p-1"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-navy-500">
                  Square Connected
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Location ID: {squareStatus.locationId}
                </p>
                {squareStatus.lastSyncAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    Last synced:{" "}
                    {new Date(squareStatus.lastSyncAt).toLocaleString()}
                  </p>
                )}
                {squareStatus.syncStatus === "SYNCING" && (
                  <p className="text-sm text-blue-600 mt-2 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Syncing menu...
                  </p>
                )}
                {squareStatus.syncError && (
                  <p className="text-sm text-red-600 mt-2">
                    Error: {squareStatus.syncError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSyncNow}
                disabled={isLoading || squareStatus.syncStatus === "SYNCING"}
                className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sync Now
              </button>
              <button
                onClick={handleDisconnectSquare}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

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
              {squareStatus?.enabled
                ? "Square Integration Active"
                : "POS Integration"}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                {squareStatus?.enabled
                  ? "Your menu is automatically synced with Square. Changes in Square will update your menu within minutes."
                  : "Connect your Point of Sale system to sync orders, inventory, and menu items."}
              </p>
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
                <div
                  className={`h-12 w-12 rounded-lg ${provider.bgColor} flex items-center justify-center overflow-hidden`}
                >
                  {provider.useImage ? (
                    <img
                      src={provider.logoUrl}
                      alt={`${provider.name} logo`}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {provider.initial}
                    </span>
                  )}
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

      {/* Additional Info */}
      <div className="rounded-xl bg-slate-50 p-4">
        <h4 className="text-sm font-medium text-navy-500 mb-2">
          What you'll be able to do:
        </h4>
        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
          <li>Automatically sync menu items and prices</li>
          <li>Send orders directly to your kitchen</li>
          <li>Keep inventory synchronized across systems</li>
          <li>Export sales reports and analytics</li>
        </ul>
      </div>
    </div>
  );
}
