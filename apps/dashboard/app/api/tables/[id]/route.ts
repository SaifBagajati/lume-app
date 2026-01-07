import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lume-app/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get("x-tenant-id");
    const { id } = await params;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Unauthorized - No tenant context" },
        { status: 401 }
      );
    }

    const table = await prisma.restaurantTable.findFirst({
      where: {
        id,
        tenantId, // Ensure tenant isolation
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error fetching table:", error);
    return NextResponse.json(
      { error: "Failed to fetch table" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get("x-tenant-id");
    const { id } = await params;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Unauthorized - No tenant context" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { active, number } = body;

    // Verify table belongs to tenant
    const existingTable = await prisma.restaurantTable.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingTable) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // If updating number, check for duplicates
    if (number && number !== existingTable.number) {
      const duplicate = await prisma.restaurantTable.findFirst({
        where: {
          tenantId,
          number: number.toString(),
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Table number already exists" },
          { status: 409 }
        );
      }
    }

    // Update the table
    const updatedTable = await prisma.restaurantTable.update({
      where: { id },
      data: {
        ...(typeof active !== "undefined" && { active }),
        ...(number && { number: number.toString() }),
      },
    });

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { error: "Failed to update table" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get("x-tenant-id");
    const { id } = await params;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Unauthorized - No tenant context" },
        { status: 401 }
      );
    }

    // Verify table belongs to tenant
    const existingTable = await prisma.restaurantTable.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        orders: true,
      },
    });

    if (!existingTable) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Check if table has orders
    if (existingTable.orders && existingTable.orders.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete table with existing orders. Please archive it instead.",
        },
        { status: 409 }
      );
    }

    // Delete the table
    await prisma.restaurantTable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: "Failed to delete table" },
      { status: 500 }
    );
  }
}
