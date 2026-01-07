"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MenuItemCard } from "./MenuItemCard";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

interface MenuTabsProps {
  categories: MenuCategory[];
}

export function MenuTabs({ categories }: MenuTabsProps) {
  const router = useRouter();

  // Categories are already sorted by sortOrder from the server
  const [activeTab, setActiveTab] = useState<string>(
    categories[0]?.id || ""
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const response = await fetch("/api/integrations/square/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setSyncMessage({ type: "error", text: data.error || "Sync failed" });
      } else {
        setSyncMessage({ type: "success", text: "Menu synced successfully" });
        // Refresh the page to show updated menu
        router.refresh();
      }
    } catch (error) {
      setSyncMessage({ type: "error", text: "Failed to sync menu" });
    } finally {
      setIsSyncing(false);
      // Clear message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-slate-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
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
        <h3 className="text-lg font-medium text-navy-500 mb-2">
          No menu items yet
        </h3>
        <p className="text-slate-500 mb-4">
          Connect your POS system to sync your menu
        </p>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isSyncing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync from POS
            </>
          )}
        </button>
      </div>
    );
  }

  const activeCategory = categories.find((cat) => cat.id === activeTab);

  return (
    <div className="bg-white shadow rounded-xl">
      {/* Tab Navigation with Sync Button */}
      <div className="border-b border-slate-200">
        <div className="flex items-center justify-between px-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === category.id
                      ? "border-orange-500 text-orange-500"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }
                `}
              >
                {category.name}
              </button>
            ))}
          </nav>

          {/* Sync Button */}
          <div className="flex items-center space-x-3">
            {syncMessage && (
              <span className={`text-sm ${syncMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {syncMessage.text}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              title="Sync menu from POS"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        {activeCategory && (
          <div>
            {/* Category Header */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-navy-500">
                {activeCategory.name}
              </h2>
              {activeCategory.description && (
                <p className="mt-1 text-sm text-slate-600">
                  {activeCategory.description}
                </p>
              )}
              <p className="mt-1 text-sm text-slate-500">
                {activeCategory.items.length} item
                {activeCategory.items.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Category Items */}
            {activeCategory.items.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-6 text-center">
                <p className="text-slate-500">
                  No items available in this category
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeCategory.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
