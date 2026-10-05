import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";
import { rateLimit, REGISTER_RATE_LIMIT } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "parent"]).default("student"),
  username: z.string().min(3).max(20).regex(/^[a-z][a-z0-9_]*$/).optional(),
});

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`register:${ip}`, REGISTER_RATE_LIMIT.limit, REGISTER_RATE_LIMIT.windowMs);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: z.treeifyError(result.error) },
        { status: 400 }
      );
    }

    const { name, email, password, role } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check username uniqueness if provided
    if (result.data.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: result.data.username },
      });
      if (existingUsername) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        username: result.data.username || null,
      },
    });

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
