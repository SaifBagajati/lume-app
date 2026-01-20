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

interface ToastStatus {
  enabled: boolean;
  restaurantGuid?: string;
  lastSyncAt?: string;
  syncStatus?: string;
  syncError?: string;
  tokenExpiring?: boolean;
}

interface POSIntegrationProps {
  /**
   * Show the hero section with icon and title
   * Useful for the Menu page when no POS is connected
   */
  showHero?: boolean;
  /**
   * Show the connected status card when a POS is connected
   * Set to false to only show the grid
   */
  showConnectedStatus?: boolean;
  /**
   * Show sync controls (Sync Now, Disconnect buttons)
   */
  showSyncControls?: boolean;
  /**
   * Callback URL path after OAuth (default: /settings)
   */
  callbackPath?: string;
  /**
   * Callback when integration status changes
   */
  onStatusChange?: () => void;
}

export function POSIntegration({
  showHero = false,
  showConnectedStatus = true,
  showSyncControls = true,
  callbackPath = "/settings",
  onStatusChange,
}: POSIntegrationProps) {
  const router = useRouter();
  const [squareStatus, setSquareStatus] = useState<SquareStatus | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Toast credentials modal state
  const [showToastModal, setShowToastModal] = useState(false);
  const [toastCredentials, setToastCredentials] = useState({
    clientId: "",
    clientSecret: "",
    restaurantGuid: "",
  });

  // Fetch both statuses on mount and handle OAuth callback messages
  useEffect(() => {
    fetchSquareStatus();
    fetchToastStatus();

    // Check for OAuth callback messages in URL
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success) {
      setMessage({ type: "success", text: success });
      // Clear URL params
      window.history.replaceState({}, "", callbackPath);
      // Refresh status after successful connection
      setTimeout(() => {
        fetchSquareStatus();
        fetchToastStatus();
        onStatusChange?.();
        router.refresh();
      }, 500);
    } else if (error) {
      setMessage({ type: "error", text: error });
      window.history.replaceState({}, "", callbackPath);
    }
  }, [callbackPath, onStatusChange, router]);

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

  const fetchToastStatus = async () => {
    try {
      const response = await fetch("/api/integrations/toast/status");
      if (response.ok) {
        const data = await response.json();
        setToastStatus(data);
      }
    } catch (error) {
      console.error("Error fetching Toast status:", error);
    }
  };

  const handleConnectSquare = async () => {
    setLoadingAction('square-connect');
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/square/connect");
      const data = await response.json();

      if (response.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to initiate Square connection",
        });
        setLoadingAction(null);
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
      setLoadingAction(null);
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

    setLoadingAction('square-disconnect');
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
        onStatusChange?.();
        router.refresh();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to disconnect",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSyncSquare = async () => {
    setLoadingAction('square-sync');
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/square/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Sync completed. Synced ${data.stats?.categories || 0} categories and ${data.stats?.items || 0} items.`,
        });
        fetchSquareStatus();
        onStatusChange?.();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to sync",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Toast handlers
  const handleConnectToast = () => {
    setShowToastModal(true);
    setToastCredentials({ clientId: "", clientSecret: "", restaurantGuid: "" });
  };

  const handleSubmitToastCredentials = async () => {
    if (!toastCredentials.clientId || !toastCredentials.clientSecret || !toastCredentials.restaurantGuid) {
      setMessage({ type: "error", text: "Please fill in all Toast credential fields" });
      return;
    }

    setLoadingAction('toast-connect');
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/toast/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toastCredentials),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message || "Toast connected successfully",
        });
        setShowToastModal(false);
        fetchToastStatus();
        onStatusChange?.();
        router.refresh();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to connect Toast",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDisconnectToast = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect Toast? Your menu data will be preserved, but the integration will be removed."
      )
    ) {
      return;
    }

    setLoadingAction('toast-disconnect');
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/toast/disconnect", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Toast disconnected successfully",
        });
        fetchToastStatus();
        onStatusChange?.();
        router.refresh();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to disconnect",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSyncToast = async () => {
    setLoadingAction('toast-sync');
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/toast/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Sync completed. Synced ${data.stats?.categories || 0} categories and ${data.stats?.items || 0} items.`,
        });
        fetchToastStatus();
        onStatusChange?.();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to sync",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Determine if any integration is active
  const hasActiveIntegration = squareStatus?.enabled || toastStatus?.enabled;

  // Get the status for each provider
  const getProviderStatus = (providerName: string): "connected" | "available" | "coming_soon" | "blocked" => {
    if (providerName === "Square") {
      if (squareStatus?.enabled) return "connected";
      if (toastStatus?.enabled) return "blocked";
      return "available";
    }
    if (providerName === "Toast POS") {
      if (toastStatus?.enabled) return "connected";
      if (squareStatus?.enabled) return "blocked";
      return "available";
    }
    return "coming_soon";
  };

  const posProviders = [
    {
      name: "Toast POS",
      logoUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsNSEzfTbyNbzOPqDxmdGgj5PcTGJv0QTo7w&s",
      description: "Popular cloud-based POS system",
    },
    {
      name: "Lightspeed",
      logoUrl: "/images/pos/lightspeed.jpeg",
      description: "Restaurant POS and payments",
    },
    {
      name: "Square",
      logoUrl:
        "https://gdm-catalog-fmapi-prod.imgix.net/ProductLogo/f0986dce-1396-4b7d-9975-0a75e36e1afe.png?w=80&h=80&fit=max&dpr=3&auto=format&q=50",
      description: "All-in-one payment and POS",
    },
    {
      name: "Clover",
      logoUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTyRuLYaWcv85WeiIxj3zWA0D9-rZ2kj1Pdw&s",
      description: "Business management platform",
    },
  ];

  const getConnectHandler = (providerName: string) => {
    if (providerName === "Square") return handleConnectSquare;
    if (providerName === "Toast POS") return handleConnectToast;
    return undefined;
  };

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

      {/* Hero Section (optional) */}
      {showHero && !hasActiveIntegration && (
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
      )}

      {/* Square Connected Status */}
      {showConnectedStatus && squareStatus?.enabled && (
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
            {showSyncControls && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSyncSquare}
                  disabled={loadingAction === 'square-sync' || squareStatus.syncStatus === "SYNCING"}
                  className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingAction === 'square-sync' ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  onClick={handleDisconnectSquare}
                  disabled={loadingAction === 'square-disconnect'}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingAction === 'square-disconnect' ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Connected Status */}
      {showConnectedStatus && toastStatus?.enabled && (
        <div className="rounded-xl bg-mint-50 p-6 border border-mint-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsNSEzfTbyNbzOPqDxmdGgj5PcTGJv0QTo7w&s"
                    alt="Toast logo"
                    className="h-full w-full object-contain p-1"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-navy-500">
                  Toast Connected
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Restaurant GUID: {toastStatus.restaurantGuid}
                </p>
                {toastStatus.lastSyncAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    Last synced:{" "}
                    {new Date(toastStatus.lastSyncAt).toLocaleString()}
                  </p>
                )}
                {toastStatus.syncStatus === "SYNCING" && (
                  <p className="text-sm text-blue-600 mt-2 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Syncing menu...
                  </p>
                )}
                {toastStatus.syncError && (
                  <p className="text-sm text-red-600 mt-2">
                    Error: {toastStatus.syncError}
                  </p>
                )}
              </div>
            </div>
            {showSyncControls && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSyncToast}
                  disabled={loadingAction === 'toast-sync' || toastStatus.syncStatus === "SYNCING"}
                  className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingAction === 'toast-sync' ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  onClick={handleDisconnectToast}
                  disabled={loadingAction === 'toast-disconnect'}
                  className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingAction === 'toast-disconnect' ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            )}
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
              {hasActiveIntegration
                ? "POS Integration Active"
                : showHero
                ? "Why connect your POS?"
                : "POS Integration"}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              {hasActiveIntegration ? (
                <p>
                  Your menu is automatically synced with your POS. Changes will update your menu within minutes. Only one POS integration can be active at a time.
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  <li>Automatically sync menu items and prices</li>
                  <li>Keep availability in sync with your inventory</li>
                  <li>No manual menu updates needed</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* POS Providers Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {posProviders.map((provider) => {
          const status = getProviderStatus(provider.name);
          const connectHandler = getConnectHandler(provider.name);

          return (
            <div
              key={provider.name}
              className={`relative rounded-xl border bg-white px-6 py-5 shadow-sm transition-colors ${
                status === "connected"
                  ? "border-mint-400"
                  : status === "available"
                  ? "border-slate-300 hover:border-orange-400"
                  : "border-slate-200 opacity-60"
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
                    {status === "connected" && (
                      <span className="inline-flex items-center rounded-full bg-mint-100 px-2.5 py-0.5 text-xs font-medium text-mint-800">
                        Connected
                      </span>
                    )}
                    {status === "available" && connectHandler && (
                      <button
                        onClick={connectHandler}
                        disabled={loadingAction === (provider.name === "Square" ? 'square-connect' : provider.name === "Toast POS" ? 'toast-connect' : null)}
                        className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loadingAction === (provider.name === "Square" ? 'square-connect' : provider.name === "Toast POS" ? 'toast-connect' : null) ? "Connecting..." : "Connect"}
                      </button>
                    )}
                    {status === "blocked" && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        Disconnect other first
                      </span>
                    )}
                    {status === "coming_soon" && (
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
          );
        })}
      </div>

      {/* Additional Info (only on Settings page) */}
      {!showHero && (
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
      )}

      {/* Toast Credentials Modal */}
      {showToastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-navy-500 mb-4">
              Connect Toast POS
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter your Toast API credentials. You can find these in your Toast
              Developer Portal.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  value={toastCredentials.clientId}
                  onChange={(e) =>
                    setToastCredentials((prev) => ({
                      ...prev,
                      clientId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Your Toast Client ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={toastCredentials.clientSecret}
                  onChange={(e) =>
                    setToastCredentials((prev) => ({
                      ...prev,
                      clientSecret: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Your Toast Client Secret"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Restaurant GUID
                </label>
                <input
                  type="text"
                  value={toastCredentials.restaurantGuid}
                  onChange={(e) =>
                    setToastCredentials((prev) => ({
                      ...prev,
                      restaurantGuid: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., abc12345-1234-1234-1234-123456789abc"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowToastModal(false)}
                disabled={loadingAction === 'toast-connect'}
                className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitToastCredentials}
                disabled={loadingAction === 'toast-connect'}
                className="px-4 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {loadingAction === 'toast-connect' ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
