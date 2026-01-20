import { NextResponse } from "next/server";
import { prisma, hashPassword } from "@lume-app/shared";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, restaurantName } = body;

    // Validate required fields
    if (!email || !password || !restaurantName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate unique slug for tenant
    const baseSlug = generateSlug(restaurantName);
    const slug = await getUniqueSlug(baseSlug);

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create tenant and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: restaurantName,
          slug,
        },
      });

      // Create user with OWNER role
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name: restaurantName, // Use restaurant name as initial user name
          password: hashedPassword,
          role: "OWNER",
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    return NextResponse.json({
      success: true,
      tenantId: result.tenant.id,
      tenantSlug: result.tenant.slug,
      userId: result.user.id,
    });
  } catch (error) {
    console.error("Sign-up error:", error);
    return NextResponse.json(
      { error: "An error occurred during sign-up. Please try again." },
      { status: 500 }
    );
  }
}
