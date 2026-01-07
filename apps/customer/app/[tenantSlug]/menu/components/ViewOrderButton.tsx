"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderModal } from "./OrderModal";

interface ViewOrderButtonProps {
  tenantSlug: string;
  tableNumber?: string;
}

export function ViewOrderButton({
  tenantSlug,
  tableNumber,
}: ViewOrderButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!tableNumber) {
    return null; // Don't show button if no table selected
  }

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOrderComplete = () => {
    setIsOpen(false);
    // Force a full page reload to clear all cached data and reset component states
    window.location.reload();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 sm:py-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-2xl flex items-center space-x-2 transition-all hover:scale-105 text-sm sm:text-base"
      >
        <svg
          className="h-5 w-5 sm:h-6 sm:w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <span>View Order</span>
      </button>

      {/* Order Modal */}
      {isOpen && (
        <OrderModal
          tenantSlug={tenantSlug}
          tableNumber={tableNumber}
          onClose={handleClose}
          onOrderComplete={handleOrderComplete}
        />
      )}
    </>
  );
}
