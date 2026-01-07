import { getTenantContext, prisma } from "@lume-app/shared";
import Link from "next/link";
import { QRCodeDisplay } from "./components/QRCodeDisplay";
import { TableStatusToggle } from "./components/TableStatusToggle";

export default async function TablesPage() {
  const context = await getTenantContext();

  // Fetch all tables for this tenant
  const tables = await prisma.restaurantTable.findMany({
    where: {
      tenantId: context.tenantId,
    },
    orderBy: {
      number: "asc",
    },
  });

  const activeTablesCount = tables.filter((t) => t.active).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500">Restaurant Tables</h1>
        <p className="mt-2 text-slate-600">
          Manage your tables and QR codes for customer ordering
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-orange-500 p-3">
                  <svg
                    className="h-6 w-6 text-white"
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
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Total Tables
                  </dt>
                  <dd className="text-3xl font-semibold text-navy-500">
                    {tables.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <svg
                    className="h-6 w-6 text-white"
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
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Active Tables
                  </dt>
                  <dd className="text-3xl font-semibold text-navy-500">
                    {activeTablesCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-orange-500 p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    QR Codes Generated
                  </dt>
                  <dd className="text-3xl font-semibold text-navy-500">
                    {tables.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-600">
            Click on a QR code to download it for printing
          </p>
        </div>
        <Link
          href="/tables/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New Table
        </Link>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="bg-white shadow rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
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
          </div>
          <h3 className="text-lg font-medium text-navy-500 mb-2">
            No tables yet
          </h3>
          <p className="text-slate-500 mb-6">
            Get started by creating your first table with a QR code
          </p>
          <Link
            href="/tables/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
          >
            Add Your First Table
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white overflow-hidden shadow rounded-xl"
            >
              <div className="p-5">
                {/* Table Number Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      Table {table.number}
                    </span>
                  </div>
                  <TableStatusToggle
                    tableId={table.id}
                    initialActive={table.active}
                  />
                </div>

                {/* QR Code and Actions */}
                <QRCodeDisplay
                  tableId={table.id}
                  tableNumber={table.number}
                  qrCodeData={table.qrCode}
                  tenantSlug={context.tenantSlug}
                >
                  {/* Edit Button - inserted between QR code and Download button */}
                  <Link
                    href={`/tables/${table.id}/edit`}
                    className="block w-full text-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Edit Table
                  </Link>
                </QRCodeDisplay>

                {/* Table Info */}
                <div className="mt-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">
                      Status:{" "}
                      <span
                        className={
                          table.active ? "text-green-600" : "text-red-400"
                        }
                      >
                        {table.active ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
