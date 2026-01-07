"use client";

import { useState } from "react";

interface OrderCardProps {
  order: any;
}

export function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate payment status
  const totalPaid = order.payments.reduce(
    (sum: number, payment: any) =>
      payment.status === "COMPLETED" ? sum + payment.amount : sum,
    0
  );
  const paymentPercentage = (totalPaid / order.total) * 100;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-CA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SEATED":
        return "bg-blue-100 text-blue-800";
      case "PARTIALLY_PAID":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SEATED":
        return "Seated";
      case "PARTIALLY_PAID":
        return "Partially Paid";
      case "COMPLETED":
        return "Completed";
      default:
        return status;
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl hover:border-orange-300 transition-colors">
      {/* Order Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Table Number */}
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <span className="text-orange-800 font-bold text-sm">
                  T{order.table.number}
                </span>
              </div>
            </div>

            {/* Order Info */}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-navy-500">
                  Table {order.table.number}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {formatDate(order.createdAt)} • {order.items.length} items
              </p>
            </div>
          </div>

          {/* Order Total and Expand Icon */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-lg font-bold text-navy-500">
                {formatCurrency(order.total)}
              </p>
              {totalPaid > 0 && (
                <p className="text-xs text-slate-500">
                  Paid: {formatCurrency(totalPaid)}
                </p>
              )}
            </div>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${
                isExpanded ? "transform rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Payment Progress Bar (if partially paid) */}
        {totalPaid > 0 && totalPaid < order.total && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Payment Progress</span>
              <span>{Math.round(paymentPercentage)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${paymentPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Order Details */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          {/* Order Items */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-navy-500 mb-2">
              Order Items
            </h4>
            <div className="space-y-2">
              {order.items.map((orderItem: any) => (
                <div
                  key={orderItem.id}
                  className="flex justify-between text-sm"
                >
                  <div className="flex items-center">
                    <span className="text-slate-600 mr-2">
                      {orderItem.quantity}x
                    </span>
                    <span className="text-navy-500">{orderItem.item.name}</span>
                    {orderItem.notes && (
                      <span className="text-slate-500 text-xs ml-2 italic">
                        ({orderItem.notes})
                      </span>
                    )}
                  </div>
                  <span className="text-navy-500">
                    {formatCurrency(orderItem.price * orderItem.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-slate-200 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-navy-500">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tax</span>
              <span className="text-navy-500">{formatCurrency(order.tax)}</span>
            </div>
            {order.tip > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tip</span>
                <span className="text-navy-500">
                  {formatCurrency(order.tip)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
              <span className="text-navy-500">Total</span>
              <span className="text-navy-500">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>

          {/* Payments */}
          {order.payments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-medium text-navy-500 mb-2">
                Payments
              </h4>
              <div className="space-y-2">
                {order.payments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex justify-between text-sm"
                  >
                    <div>
                      <span className="text-navy-500">{payment.method}</span>
                      <span
                        className={`ml-2 text-xs ${
                          payment.status === "COMPLETED"
                            ? "text-green-600"
                            : "text-slate-500"
                        }`}
                      >
                        ({payment.status})
                      </span>
                    </div>
                    <span className="text-navy-500">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
