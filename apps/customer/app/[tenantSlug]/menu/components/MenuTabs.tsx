"use client";

import { useState } from "react";
import { MenuItem } from "./MenuItem";

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    available: boolean;
  }[];
}

interface MenuTabsProps {
  categories: MenuCategory[];
  tenantSlug: string;
  tableNumber?: string;
  orderQuantities: Record<string, number>;
}

export function MenuTabs({
  categories,
  tenantSlug,
  tableNumber,
  orderQuantities,
}: MenuTabsProps) {
  // Categories are already sorted by sortOrder from the server
  const [activeTab, setActiveTab] = useState<string>(
    categories[0]?.id || ""
  );

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
          Menu not available yet
        </h3>
        <p className="text-slate-500">
          The restaurant hasn't added any menu items yet. Please check back
          later.
        </p>
      </div>
    );
  }

  const activeCategory = categories.find((cat) => cat.id === activeTab);

  return (
    <div className="bg-white shadow rounded-xl">
      {/* Tab Navigation - Horizontally scrollable on mobile */}
      <div className="border-b border-slate-200">
        <nav
          className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto scrollbar-hide"
          aria-label="Tabs"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`
                whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0
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
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4 sm:px-6 sm:py-6">
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
            </div>

            {/* Category Items */}
            {activeCategory.items.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-6 text-center">
                <p className="text-slate-500">
                  No items available in this category
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeCategory.items.map((item) => (
                  <MenuItem
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    description={item.description || ""}
                    price={item.price}
                    imageUrl={item.imageUrl || undefined}
                    tenantSlug={tenantSlug}
                    tableNumber={tableNumber}
                    orderedQuantity={orderQuantities[item.id] || 0}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
