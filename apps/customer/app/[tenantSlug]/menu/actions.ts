"use server";

import { prisma } from "@lume-app/shared";
import { revalidatePath } from "next/cache";

export async function addItemToOrder(
  tenantSlug: string,
  tableNumber: string,
  menuItemId: string,
  quantity: number = 1
) {
  try {
    // 1. Find tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return { success: false, error: "Restaurant not found" };
    }

    // 2. Find and validate table
    const table = await prisma.restaurantTable.findFirst({
      where: {
        tenantId: tenant.id,
        number: tableNumber,
      },
    });

    if (!table) {
      return { success: false, error: "Table not found" };
    }

    if (!table.active) {
      return {
        success: false,
        error: "This table is not accepting orders. Please contact staff.",
      };
    }

    // 3. Find and validate menu item
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        tenantId: tenant.id,
      },
    });

    if (!menuItem) {
      return { success: false, error: "Menu item not found" };
    }

    if (!menuItem.available) {
      return { success: false, error: "This item is currently unavailable" };
    }

    // 4. Use transaction to find/create order and add item
    await prisma.$transaction(async (tx) => {
      // Find existing OPEN order for this table (active session)
      let order = await tx.order.findFirst({
        where: {
          tableId: table.id,
          tenantId: tenant.id,
          status: "OPEN",
        },
      });

      // Create order if doesn't exist (start new session)
      if (!order) {
        order = await tx.order.create({
          data: {
            tableId: table.id,
            tenantId: tenant.id,
            status: "OPEN",
            subtotal: 0,
            tax: 0,
            total: 0,
            sessionStartedAt: new Date(),
          },
        });
      }

      // Always create a new OrderItem (each order is tracked separately for kitchen workflow)
      // This allows each item to have its own status (PENDING, PREPARING, READY, SERVED)
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          itemId: menuItem.id,
          quantity,
          price: menuItem.price, // Capture price at order time
          status: "PENDING", // New items start as PENDING
        },
      });

      // Recalculate totals
      const allItems = await tx.orderItem.findMany({
        where: { orderId: order.id },
      });

      const subtotal = allItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const tax = subtotal * 0.13; // HST for Ontario
      const total = subtotal + tax;

      await tx.order.update({
        where: { id: order.id },
        data: { subtotal, tax, total },
      });
    });

    return {
      success: true,
      itemName: menuItem.name,
    };
  } catch (error) {
    console.error("Error adding item to order:", error);
    return {
      success: false,
      error: "Failed to add item. Please try again.",
    };
  }
}

export async function getCurrentOrder(
  tenantSlug: string,
  tableNumber: string
) {
  try {
    // 1. Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return { success: false, error: "Restaurant not found" };
    }

    // 2. Find table
    const table = await prisma.restaurantTable.findFirst({
      where: {
        tenantId: tenant.id,
        number: tableNumber,
      },
    });

    if (!table) {
      return { success: false, error: "Table not found" };
    }

    // 3. Find open or partially paid order with items
    const order = await prisma.order.findFirst({
      where: {
        tableId: table.id,
        tenantId: tenant.id,
        status: { in: ["OPEN", "PARTIALLY_PAID"] },
      },
      include: {
        items: {
          include: {
            item: true, // Include menu item details
          },
          orderBy: {
            id: "asc", // Order by creation time
          },
        },
        payments: {
          where: {
            status: "COMPLETED",
          },
        },
      },
    });

    if (!order) {
      return {
        success: true,
        order: null,
      };
    }

    // Calculate total paid
    const totalPaid = order.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    return {
      success: true,
      order: {
        id: order.id,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        totalPaid,
        amountDue: order.total - totalPaid,
        sessionStartedAt: order.sessionStartedAt,
        splitCount: order.splitCount,
        splitAmount: order.splitAmount,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.item.name,
          quantity: item.quantity,
          price: item.price,
          status: item.status,
          total: item.price * item.quantity,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching current order:", error);
    return {
      success: false,
      error: "Failed to fetch order. Please try again.",
    };
  }
}

export async function processPayment(
  tenantSlug: string,
  tableNumber: string,
  amount: number,
  paymentMethod: "CARD" | "APPLE_PAY" | "GOOGLE_PAY" = "CARD",
  splitCount?: number
) {
  try {
    // 1. Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return { success: false, error: "Restaurant not found" };
    }

    // 2. Find table
    const table = await prisma.restaurantTable.findFirst({
      where: {
        tenantId: tenant.id,
        number: tableNumber,
      },
    });

    if (!table) {
      return { success: false, error: "Table not found" };
    }

    // 3. Find open or partially paid order
    const order = await prisma.order.findFirst({
      where: {
        tableId: table.id,
        tenantId: tenant.id,
        status: { in: ["OPEN", "PARTIALLY_PAID"] },
      },
      include: {
        payments: {
          where: {
            status: "COMPLETED",
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "No active order found" };
    }

    // 4. Calculate amount due
    const totalPaid = order.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const amountDue = order.total - totalPaid;

    if (amount > amountDue) {
      return {
        success: false,
        error: `Payment amount ($${amount.toFixed(2)}) exceeds amount due ($${amountDue.toFixed(2)})`,
      };
    }

    // 5. If splitting and order doesn't have split info yet, save it
    if (splitCount && splitCount > 1 && !order.splitCount) {
      const splitAmount = amountDue / splitCount;

      // Validate that the payment amount matches the split amount (with small tolerance for rounding)
      if (Math.abs(amount - splitAmount) > 0.01) {
        return {
          success: false,
          error: `Payment amount must be $${splitAmount.toFixed(2)} (total divided by ${splitCount})`,
        };
      }
    }

    // 6. If order already has split info, validate payment amount
    if (order.splitCount && order.splitAmount) {
      // Allow the exact split amount or the remaining balance (for last payment)
      const isCorrectSplitAmount = Math.abs(amount - order.splitAmount) < 0.01;
      const isRemainingBalance = Math.abs(amount - amountDue) < 0.01;

      if (!isCorrectSplitAmount && !isRemainingBalance) {
        return {
          success: false,
          error: `Payment amount must be $${order.splitAmount.toFixed(2)} or full remaining balance`,
        };
      }
    }

    // 7. Use transaction to create payment and update order status
    await prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount,
          method: paymentMethod,
          status: "COMPLETED",
          tenantId: tenant.id,
          transactionId: `txn_${Date.now()}`, // Mock transaction ID
        },
      });

      // If this is the first split payment, save split configuration
      if (splitCount && splitCount > 1 && !order.splitCount) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            splitCount,
            splitAmount: amountDue / splitCount,
          },
        });
      }

      // Check if order is now fully paid
      const newTotalPaid = totalPaid + amount;
      if (newTotalPaid >= order.total) {
        // Mark order as completed
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "COMPLETED",
            sessionEndedAt: new Date(),
          },
        });
      } else if (newTotalPaid > 0) {
        // Mark order as partially paid
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "PARTIALLY_PAID",
          },
        });
      }
    });

    const newTotalPaid = totalPaid + amount;
    const isFullyPaid = newTotalPaid >= order.total;

    // Revalidate the menu page to clear quantity indicators
    if (isFullyPaid) {
      revalidatePath(`/${tenantSlug}/menu`);
    }

    return {
      success: true,
      message: isFullyPaid
        ? "Order fully paid! Thank you!"
        : "Payment received. Remaining balance: $" +
          (order.total - newTotalPaid).toFixed(2),
      isFullyPaid,
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      success: false,
      error: "Failed to process payment. Please try again.",
    };
  }
}
