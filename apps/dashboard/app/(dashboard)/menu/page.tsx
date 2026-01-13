import { requireTenantContext } from "@lume-app/shared";
import { prisma } from "@lume-app/shared";
import { MenuTabs } from "./components/MenuTabs";
import { POSIntegrationSetup } from "./components/POSIntegrationSetup";

export default async function MenuPage() {
  const context = await requireTenantContext();

  // Fetch tenant to check POS integration status
  const tenant = await prisma.tenant.findUnique({
    where: { id: context.tenantId },
    select: {
      squareIntegrationEnabled: true,
      squareLocationId: true,
      lastSquareSyncAt: true,
      toastIntegrationEnabled: true,
      toastRestaurantGuid: true,
      lastToastSyncAt: true,
    },
  });

  const hasSquareIntegration = tenant?.squareIntegrationEnabled && tenant?.squareLocationId;
  const hasToastIntegration = tenant?.toastIntegrationEnabled && tenant?.toastRestaurantGuid;
  const hasActiveIntegration = hasSquareIntegration || hasToastIntegration;

  // Determine which POS is connected
  const connectedPOS = hasSquareIntegration ? "Square" : hasToastIntegration ? "Toast" : null;

  // Only fetch menu if there's an active integration
  let categories: any[] = [];
  if (hasActiveIntegration) {
    categories = await prisma.menuCategory.findMany({
      where: {
        tenantId: context.tenantId,
      },
      include: {
        items: {
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy-500">Menu Management</h1>
            <p className="mt-2 text-sm text-slate-600">
              {hasActiveIntegration
                ? "View your restaurant menu synced from your POS system"
                : "Connect your POS system to sync and display your menu"}
            </p>
          </div>
          {connectedPOS && (
            <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <svg
                className="h-4 w-4 text-mint-500"
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
              <span>
                Menu items synced with your{" "}
                <span className="font-medium text-navy-500">{connectedPOS}</span>{" "}
                POS
              </span>
            </div>
          )}
        </div>
      </div>

      {hasActiveIntegration ? (
        <MenuTabs categories={categories} />
      ) : (
        <POSIntegrationSetup />
      )}
    </div>
  );
}
