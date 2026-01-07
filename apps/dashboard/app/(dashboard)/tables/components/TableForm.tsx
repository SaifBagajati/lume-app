"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TableFormProps {
  tableId?: string;
  initialNumber?: string;
  initialActive?: boolean;
}

export function TableForm({
  tableId,
  initialNumber = "",
  initialActive = true,
}: TableFormProps) {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState(initialNumber);
  const [active, setActive] = useState(initialActive);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEditMode = !!tableId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!tableNumber.trim()) {
      setError("Table number is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditMode ? `/api/tables/${tableId}` : "/api/tables";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: tableNumber.trim(),
          active,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || `Failed to ${isEditMode ? "update" : "create"} table`
        );
      }

      // Success - redirect to tables page
      router.push("/tables");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? "update" : "create"} table`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Table Number Input */}
      <div>
        <label
          htmlFor="tableNumber"
          className="block text-sm font-medium text-slate-700"
        >
          Table Number
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="tableNumber"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-slate-300 rounded-md px-3 py-2 border"
            placeholder="e.g., 1, 2, A1, Patio-1"
            disabled={isSubmitting}
          />
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Enter a unique identifier for this table. It can be a number or text.
        </p>
      </div>

      {/* Active Status Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor="active"
            className="block text-sm font-medium text-slate-700"
          >
            Active Status
          </label>
          <p className="text-sm text-slate-500">
            Inactive tables won't accept orders from QR codes
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActive(!active)}
          disabled={isSubmitting}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            active ? "bg-green-600" : "bg-slate-200"
          }`}
          role="switch"
          aria-checked={active}
          id="active"
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              active ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* QR Code Info - Only show for new tables */}
      {!isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
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
                QR Code Auto-Generated
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  A unique QR code will be automatically generated for this
                  table. You'll be able to download it after creation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
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
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push("/tables")}
          disabled={isSubmitting}
          className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditMode ? "Updating..." : "Creating..."}
            </>
          ) : isEditMode ? (
            "Update Table"
          ) : (
            "Create Table"
          )}
        </button>
      </div>
    </form>
  );
}
