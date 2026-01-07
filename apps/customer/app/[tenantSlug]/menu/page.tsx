import { notFound } from "next/navigation";
import { ViewOrderButton } from "./components/ViewOrderButton";
import { MenuTabs } from "./components/MenuTabs";
import { prisma } from "@lume-app/shared";

interface MenuData {
  restaurant: {
    name: string;
    slug: string;
  };
  categories: {
    id: string;
    name: string;
    description: string | null;
    items: {
      id: string;
      name: string;
      description: string | null;
      price: number;
      imageUrl: string | null;
      available: boolean;
    }[];
  }[];
}

async function getMenu(tenantSlug: string): Promise<MenuData | null> {
  try {
    // Find tenant by slug
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

    // Fetch menu categories with items
    const categories = await prisma.menuCategory.findMany({
      where: { tenantId: tenant.id },
      include: {
        items: {
          where: { available: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            available: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return {
      restaurant: {
        name: tenant.name,
        slug: tenant.slug,
      },
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        items: category.items,
      })),
    };
  } catch (error) {
    console.error("Error fetching menu:", error);
    return null;
  }
}

async function getOrderQuantities(
  tenantSlug: string,
  tableNumber: string
): Promise<Record<string, number>> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) return {};

    const table = await prisma.restaurantTable.findFirst({
      where: {
        tenantId: tenant.id,
        number: tableNumber,
      },
    });

    if (!table) return {};

    const order = await prisma.order.findFirst({
      where: {
        tableId: table.id,
        tenantId: tenant.id,
        status: { in: ["OPEN", "PARTIALLY_PAID"] },
      },
      include: {
        items: true,
      },
    });

    if (!order) return {};

    // Create a map of itemId -> total quantity
    const quantities: Record<string, number> = {};
    order.items.forEach((item) => {
      quantities[item.itemId] = (quantities[item.itemId] || 0) + item.quantity;
    });

    return quantities;
  } catch (error) {
    console.error("Error fetching order quantities:", error);
    return {};
  }
}

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { tenantSlug } = await params;
  const { table: tableNumber } = await searchParams;
  const menuData = await getMenu(tenantSlug);

  if (!menuData) {
    notFound();
  }

  // Get current order quantities for this table
  const orderQuantities = tableNumber
    ? await getOrderQuantities(tenantSlug, tableNumber)
    : {};

  return (
    <div className="min-h-screen bg-slate-100">
      {/* View Order Button */}
      <ViewOrderButton tenantSlug={tenantSlug} tableNumber={tableNumber} />

      {/* Restaurant Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{menuData.restaurant.name}</h1>
          <p className="text-orange-100 text-sm sm:text-lg">Browse our menu</p>
        </div>
      </div>

      {/* Warning if no table */}
      {!tableNumber && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>No table selected.</strong> Please scan a QR code to place
              orders.
            </p>
          </div>
        </div>
      )}

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
        <MenuTabs
          categories={menuData.categories}
          tenantSlug={tenantSlug}
          tableNumber={tableNumber}
          orderQuantities={orderQuantities}
        />
      </div>
    </div>
  );
}
