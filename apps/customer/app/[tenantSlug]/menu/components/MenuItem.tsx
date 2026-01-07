"use client";

import { useState, useEffect } from "react";
import { addItemToOrder } from "../actions";

interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  tenantSlug: string;
  tableNumber?: string;
  orderedQuantity: number;
}

export function MenuItem({
  id,
  name,
  description,
  price,
  imageUrl,
  tenantSlug,
  tableNumber,
  orderedQuantity,
}: MenuItemProps) {
  const [imageError, setImageError] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayQuantity, setDisplayQuantity] = useState(orderedQuantity);

  // Sync displayQuantity with orderedQuantity when prop changes
  useEffect(() => {
    setDisplayQuantity(orderedQuantity);
  }, [orderedQuantity]);

  // Format price as Canadian dollars
  const formattedPrice = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(price);

  // Truncate description if too long
  const MAX_DESCRIPTION_LENGTH = 100;
  const shouldTruncate = description.length > MAX_DESCRIPTION_LENGTH;
  const displayDescription = shouldTruncate && !showFullDescription
    ? description.substring(0, MAX_DESCRIPTION_LENGTH) + "..."
    : description;

  // Handle adding item to order
  const handleAddToCart = async () => {
    if (!tableNumber) {
      setError("Please scan a QR code to order");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const result = await addItemToOrder(tenantSlug, tableNumber, id);

      if (result.success) {
        setJustAdded(true);
        setDisplayQuantity((prev) => prev + 1); // Increment the displayed quantity
        setTimeout(() => setJustAdded(false), 2000);
      } else {
        setError(result.error || "Failed to add item");
      }
    } catch (err) {
      setError("Failed to add item. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 relative">
      {/* Quantity Indicator - Top Right */}
      {displayQuantity > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white shadow-lg">
            {displayQuantity}
          </span>
        </div>
      )}

      {/* Image */}
      {imageUrl && !imageError ? (
        <div className="aspect-w-16 aspect-h-9 bg-slate-200">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-36 sm:h-48 object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="h-36 sm:h-48 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
          <svg
            className="h-12 w-12 sm:h-16 sm:w-16 text-orange-300"
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
      <div className="p-4 sm:p-5">
        {/* Name and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-navy-500 flex-1 leading-tight">
            {name}
          </h3>
          <span className="text-base sm:text-lg font-bold text-orange-500 ml-2 flex-shrink-0">
            {formattedPrice}
          </span>
        </div>

        {/* Description */}
        {description && (
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{displayDescription}</p>
            {shouldTruncate && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium mt-1"
              >
                {showFullDescription ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || justAdded || !tableNumber}
          className={`w-full px-4 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            justAdded
              ? "bg-mint-500 text-navy-500 focus:ring-mint-500"
              : error
              ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              : !tableNumber
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500"
          } ${isAdding ? "opacity-75 cursor-wait" : ""}`}
        >
          {isAdding ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-4 w-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Adding...
            </span>
          ) : justAdded ? (
            <span className="flex items-center justify-center">
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Added!
            </span>
          ) : error ? (
            "Retry"
          ) : !tableNumber ? (
            "Scan QR to Order"
          ) : (
            "Add to Order"
          )}
        </button>

        {/* Error message */}
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
