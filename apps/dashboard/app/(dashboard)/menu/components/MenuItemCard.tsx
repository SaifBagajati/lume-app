"use client";

import { useState } from "react";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
}

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const [imageError, setImageError] = useState(false);

  // Format price as Canadian dollars
  const formattedPrice = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(item.price);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-slate-200">
      {/* Image */}
      {item.imageUrl && !imageError ? (
        <div className="aspect-w-16 aspect-h-9 bg-slate-200">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-48 object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
          <svg
            className="h-16 w-16 text-orange-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Name and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-navy-500 flex-1">
            {item.name}
          </h3>
          <span className="text-lg font-bold text-orange-500 ml-2">
            {formattedPrice}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-slate-600">{item.description}</p>
        )}

        {/* Availability indicator */}
        {!item.available && (
          <p className="text-sm text-red-500 mt-2 font-medium">
            Currently unavailable
          </p>
        )}
      </div>
    </div>
  );
}
