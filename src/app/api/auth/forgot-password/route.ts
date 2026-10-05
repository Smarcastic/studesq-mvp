import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { rateLimit, FORGOT_PASSWORD_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Rate limit by email
    const rl = rateLimit(
      `forgot-password:${email.toLowerCase()}`,
      FORGOT_PASSWORD_RATE_LIMIT.limit,
      FORGOT_PASSWORD_RATE_LIMIT.windowMs
    );
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Delete any existing tokens for this email
      await prisma.passwordResetToken.deleteMany({
        where: { email: email.toLowerCase() },
      });

      // Generate a secure token
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          email: email.toLowerCase(),
          token,
          expires,
        },
      });

      // In development, log the reset URL
      if (process.env.NODE_ENV === "development") {
        const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
        console.log(`\n🔑 Password reset link for ${email}:\n${resetUrl}\n`);
      }

      // TODO: In production, send email with reset link
    }

    return NextResponse.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
