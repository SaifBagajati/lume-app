import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lume-app/shared";
import { randomBytes, createHash } from "crypto";

export const runtime = "nodejs";

/**
 * POST /api/auth/forgot-password
 * Generates a password reset token and stores it in the database.
 * In production, this would send an email with the reset link.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    // But only proceed if user exists
    if (user) {
      // Generate a random token
      const resetToken = randomBytes(32).toString("hex");

      // Hash the token before storing (for security)
      const hashedToken = createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Set token expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Store the hashed token in the database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetTokenExpiresAt: expiresAt,
        },
      });

      // Build the reset URL
      const baseUrl = process.env.AUTH_URL || "http://localhost:3001";
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // In production, send an email here
      // For development, log the reset URL to console
      console.log("\n========================================");
      console.log("PASSWORD RESET LINK (dev mode):");
      console.log(resetUrl);
      console.log("========================================\n");
    }

    // Always return success (prevents email enumeration)
    return NextResponse.json({
      message: "If an account exists, a reset email has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
