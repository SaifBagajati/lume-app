import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@lume-app/shared";

async function verifyTable(
  tenantSlug: string,
  tableNumber: string,
  qrCode?: string
) {
  try {
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!tenant) {
      return null;
    }

    // Find table
    const table = await prisma.restaurantTable.findFirst({
      where: {
        tenantId: tenant.id,
        number: tableNumber,
      },
    });

    if (!table) {
      return null;
    }

    // Verify QR code if provided
    if (qrCode && table.qrCode !== qrCode) {
      return null;
    }

    return {
      tenant,
      table,
    };
  } catch (error) {
    console.error("Error verifying table:", error);
    return null;
  }
}

export default async function TableLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string; tableNumber: string }>;
  searchParams: Promise<{ qr?: string }>;
}) {
  const { tenantSlug, tableNumber } = await params;
  const { qr } = await searchParams;

  const data = await verifyTable(tenantSlug, tableNumber, qr);

  if (!data) {
    notFound();
  }

  const { tenant, table } = data;

  // Store table info in localStorage will be handled client-side
  // For now, we'll pass it via URL to the menu page

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 sm:px-8 py-8 sm:py-12 text-center">
            <div className="mb-3 sm:mb-4">
              <svg
                className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-white"
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              Welcome to
            </h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-orange-100">
              {tenant.name}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            {/* Table Number Badge */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-orange-100 text-orange-800">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-semibold text-base sm:text-lg">
                  Table {table.number}
                </span>
              </div>
            </div>

            {/* Status Check */}
            {!table.active ? (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Table Currently Inactive
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      This table is not accepting orders at the moment. Please
                      contact staff for assistance.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Instructions */}
                <div className="mb-6 text-center">
                  <p className="text-gray-600">
                    Browse our menu, add items to your cart, and place your
                    order directly from your table.
                  </p>
                </div>

                {/* View Menu Button */}
                <Link
                  href={`/${tenantSlug}/menu?table=${tableNumber}`}
                  className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  View Menu
                </Link>
              </>
            )}

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-start space-x-3 text-sm text-gray-500">
                <svg
                  className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5"
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
                <div>
                  <p className="font-medium text-gray-700 mb-1">
                    How it works
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Browse the menu</li>
                    <li>Add items to your cart</li>
                    <li>Review and place your order</li>
                    <li>We'll bring it to your table!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Powered by{" "}
            <span className="font-semibold text-orange-500">Lume</span>
          </p>
        </div>
      </div>
    </div>
  );
}
