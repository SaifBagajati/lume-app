import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lume-app/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;

    // Find tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: tenantSlug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Fetch menu categories with items
    const categories = await prisma.menuCategory.findMany({
      where: {
        tenantId: tenant.id,
      },
      include: {
        items: {
          where: {
            available: true, // Only show available items
          },
          orderBy: {
            name: "asc",
          },
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
      orderBy: {
        name: "asc",
      },
    });

    // Format response
    const response = {
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
