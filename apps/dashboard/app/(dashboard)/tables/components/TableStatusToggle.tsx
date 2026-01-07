"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TableStatusToggleProps {
  tableId: string;
  initialActive: boolean;
}

export function TableStatusToggle({
  tableId,
  initialActive,
}: TableStatusToggleProps) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !active,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update table status");
      }

      setActive(!active);
      // Refresh the page data to update stats and status displays
      router.refresh();
    } catch (error) {
      console.error("Error updating table status:", error);
      alert("Failed to update table status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        active ? "bg-green-600" : "bg-slate-200"
      }`}
      role="switch"
      aria-checked={active}
      aria-label="Toggle table active status"
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          active ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
