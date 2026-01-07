"use client";

import { useState, useEffect } from "react";
import { getCurrentOrder, processPayment } from "../actions";

interface OrderModalProps {
  tenantSlug: string;
  tableNumber: string;
  onClose: () => void;
  onOrderComplete: () => void;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: string;
  total: number;
}

interface Order {
  id: string;
  subtotal: number;
  tax: number;
  total: number;
  totalPaid: number;
  amountDue: number;
  sessionStartedAt: Date;
  splitCount: number | null;
  splitAmount: number | null;
  items: OrderItem[];
}

export function OrderModal({
  tenantSlug,
  tableNumber,
  onClose,
  onOrderComplete,
}: OrderModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<"full" | "split">("full");
  const [splitCount, setSplitCount] = useState(2);
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    setLoading(true);
    const result = await getCurrentOrder(tenantSlug, tableNumber);

    if (result.success && result.order) {
      setOrder(result.order as Order);

      // If order has split configuration, use that amount
      if (result.order.splitCount && result.order.splitAmount) {
        // Use the split amount or remaining balance, whichever is smaller
        const splitAmount = Math.min(
          result.order.splitAmount,
          result.order.amountDue
        );
        setPaymentAmount(splitAmount);
        setPaymentType("split"); // Auto-select split type
      } else {
        setPaymentAmount(result.order.amountDue);
      }
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!order) return;

    setProcessing(true);
    setMessage(null);

    // Pass splitCount only if this is a new split (order doesn't have split info yet)
    const splitCountToSend =
      paymentType === "split" && !order.splitCount ? splitCount : undefined;

    const result = await processPayment(
      tenantSlug,
      tableNumber,
      paymentAmount,
      "CARD",
      splitCountToSend
    );

    setProcessing(false);

    if (result.success) {
      if (result.isFullyPaid) {
        // Show completion screen immediately, then redirect
        setPaymentComplete(true);
        setTimeout(() => {
          onOrderComplete();
        }, 2000);
      } else {
        // Show success message and reload order to show updated balance
        setMessage({ type: "success", text: result.message || "Payment successful!" });
        setTimeout(() => {
          loadOrder();
          setShowPayment(false);
          setMessage(null);
        }, 1500);
      }
    } else {
      setMessage({ type: "error", text: result.error || "Payment failed" });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PREPARING: "bg-blue-100 text-blue-800",
      READY: "bg-green-100 text-green-800",
      SERVED: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-medium rounded ${
          styles[status as keyof typeof styles] || styles.PENDING
        }`}
      >
        {status}
      </span>
    );
  };

  const calculateSplitAmount = () => {
    if (!order) return 0;
    return order.amountDue / splitCount;
  };

  useEffect(() => {
    if (order) {
      // If order has split configuration, always use split amount
      if (order.splitCount && order.splitAmount) {
        const splitAmount = Math.min(order.splitAmount, order.amountDue);
        setPaymentAmount(splitAmount);
      } else if (paymentType === "split") {
        setPaymentAmount(calculateSplitAmount());
      } else {
        setPaymentAmount(order.amountDue);
      }
    }
  }, [paymentType, splitCount, order]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-orange-500 text-white px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold">Your Order</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-slate-200"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-120px)] sm:max-h-[calc(90vh-200px)]">
            {paymentComplete ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="h-10 w-10 text-green-500"
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
                </div>
                <h3 className="text-xl font-semibold text-navy-500 mb-2">
                  Payment Complete!
                </h3>
                <p className="text-slate-600">
                  Thank you for dining with us.
                </p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading order...</p>
              </div>
            ) : !order ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-16 w-16 text-slate-400"
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
                <p className="mt-4 text-lg text-slate-600">No active order</p>
                <p className="text-sm text-slate-500">
                  Start by adding items from the menu
                </p>
              </div>
            ) : (
              <>
                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-lg text-navy-500">
                    Items
                  </h3>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start border-b border-slate-200 pb-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-navy-500">
                            {item.name}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-slate-600">
                          Qty: {item.quantity} × $
                          {item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-semibold text-navy-500">
                        ${item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="space-y-2 border-t border-slate-200 pt-4 mb-6">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Tax (HST 13%)</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-navy-500 border-t border-slate-300 pt-2">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                  {order.totalPaid > 0 && (
                    <>
                      <div className="flex justify-between text-mint-600">
                        <span>Paid</span>
                        <span>-${order.totalPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-orange-500 border-t border-slate-300 pt-2">
                        <span>Amount Due</span>
                        <span>${order.amountDue.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Payment Section */}
                {!showPayment && order.amountDue > 0 ? (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    Proceed to Payment
                  </button>
                ) : showPayment && order.amountDue > 0 ? (
                  <div className="space-y-4 border-t border-slate-200 pt-6">
                    <h3 className="font-semibold text-lg text-navy-500">
                      Payment
                    </h3>

                    {/* Split Payment Info (if already configured) */}
                    {order.splitCount && order.splitAmount && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start space-x-2">
                          <svg
                            className="h-5 w-5 text-blue-600 mt-0.5"
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
                          <div className="flex-1">
                            <p className="font-semibold text-blue-900">
                              Bill Split {order.splitCount} Ways
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                              Payment amount: ${order.splitAmount.toFixed(2)} per
                              person
                            </p>
                            {order.splitCount && order.splitAmount && (
                              <p className="text-sm text-blue-800">
                                Payments remaining:{" "}
                                {Math.max(
                                  0,
                                  order.splitCount -
                                    Math.floor(
                                      order.totalPaid / order.splitAmount
                                    )
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Type Selection */}
                    <div className="space-y-3">
                      {!order.splitCount && (
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentType"
                            value="full"
                            checked={paymentType === "full"}
                            onChange={() => setPaymentType("full")}
                            className="h-4 w-4 text-orange-500"
                          />
                          <span className="text-navy-500">
                            Pay Full Amount (${order.amountDue.toFixed(2)})
                          </span>
                        </label>
                      )}

                      <label
                        className={`flex items-center space-x-3 ${
                          order.splitCount
                            ? "cursor-default"
                            : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentType"
                          value="split"
                          checked={paymentType === "split"}
                          onChange={() => setPaymentType("split")}
                          disabled={!!order.splitCount}
                          className="h-4 w-4 text-orange-500 disabled:opacity-50"
                        />
                        <span
                          className={`${
                            order.splitCount
                              ? "text-slate-500"
                              : "text-navy-500"
                          }`}
                        >
                          {order.splitCount
                            ? `Pay Split Amount ($${order.splitAmount?.toFixed(2)})`
                            : "Split Bill"}
                        </span>
                      </label>

                      {paymentType === "split" && !order.splitCount && (
                        <div className="ml-7 space-y-2">
                          <label className="block text-sm text-slate-700">
                            Number of people:
                          </label>
                          <input
                            type="number"
                            min="2"
                            max="10"
                            value={splitCount}
                            onChange={(e) =>
                              setSplitCount(parseInt(e.target.value) || 2)
                            }
                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg"
                          />
                          <p className="text-sm text-slate-600">
                            Your share: ${calculateSplitAmount().toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Message Display */}
                    {message && (
                      <div
                        className={`p-4 rounded-xl ${
                          message.type === "success"
                            ? "bg-mint-50 text-mint-800 border border-mint-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        {message.text}
                      </div>
                    )}

                    {/* Payment Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={() => {
                          setShowPayment(false);
                          setMessage(null);
                        }}
                        className="w-full sm:flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 px-4 rounded-xl transition-colors order-2 sm:order-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePayment}
                        disabled={processing}
                        className="w-full sm:flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                      >
                        {processing ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processing...
                          </span>
                        ) : (
                          `Pay $${paymentAmount.toFixed(2)}`
                        )}
                      </button>
                    </div>
                  </div>
                ) : order.amountDue === 0 ? (
                  <div className="bg-mint-50 border border-mint-200 rounded-xl p-4 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-mint-500 mb-2"
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
                    <p className="text-mint-800 font-semibold">
                      Order Fully Paid!
                    </p>
                    <p className="text-mint-700 text-sm">Thank you!</p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
