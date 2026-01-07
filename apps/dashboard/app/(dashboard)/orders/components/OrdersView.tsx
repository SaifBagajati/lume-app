"use client";

import { useState } from "react";
import { OrderCard } from "./OrderCard";

type OrderStatus = "ALL" | "SEATED" | "PARTIALLY_PAID" | "COMPLETED";

interface OrdersViewProps {
  orders: any[];
}

export function OrdersView({ orders }: OrdersViewProps) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("ALL");

  const filteredOrders =
    statusFilter === "ALL"
      ? orders
      : statusFilter === "SEATED"
        ? orders.filter((order) => order.status === "SEATED" || order.status === "OPEN")
        : orders.filter((order) => order.status === statusFilter);

  const statusTabs = [
    { id: "ALL" as OrderStatus, name: "All Orders", count: orders.length },
    {
      id: "SEATED" as OrderStatus,
      name: "Seated",
      count: orders.filter((o) => o.status === "SEATED" || o.status === "OPEN").length,
    },
    {
      id: "PARTIALLY_PAID" as OrderStatus,
      name: "Partially Paid",
      count: orders.filter((o) => o.status === "PARTIALLY_PAID").length,
    },
    {
      id: "COMPLETED" as OrderStatus,
      name: "Completed",
      count: orders.filter((o) => o.status === "COMPLETED").length,
    },
  ];

  return (
    <div className="bg-white shadow rounded-xl">
      {/* Status Filter Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  statusFilter === tab.id
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }
              `}
            >
              {tab.name}
              <span
                className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                  statusFilter === tab.id
                    ? "bg-orange-100 text-orange-500"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Orders List */}
      <div className="p-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-navy-500">
              No orders found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {statusFilter === "ALL"
                ? "No orders have been placed yet."
                : `No orders with status "${statusFilter}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
