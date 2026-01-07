import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lume-app/shared";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Unauthorized - No tenant context" },
        { status: 401 }
      );
    }

    const tables = await prisma.restaurantTable.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        number: "asc",
      },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Unauthorized - No tenant context" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { number, active = true } = body;

    if (!number) {
      return NextResponse.json(
        { error: "Table number is required" },
        { status: 400 }
      );
    }

    // Check if table number already exists for this tenant
    const existingTable = await prisma.restaurantTable.findFirst({
      where: {
        tenantId,
        number: number.toString(),
      },
    });

    if (existingTable) {
      return NextResponse.json(
        { error: "Table number already exists" },
        { status: 409 }
      );
    }

    // Auto-generate unique QR code
    const qrCode = `table-${randomUUID()}`;

    // Create the table
    const table = await prisma.restaurantTable.create({
      data: {
        number: number.toString(),
        qrCode,
        active,
        tenantId,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    );
  }
}
