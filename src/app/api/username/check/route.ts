import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores allowed");

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username");

    if (!rawUsername) {
      return NextResponse.json(
        { error: "Username query parameter is required" },
        { status: 400 }
      );
    }

    const username = rawUsername.toLowerCase();
    const result = usernameSchema.safeParse(username);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid username", details: z.treeifyError(result.error) },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    // If the username belongs to the current user, it's "available" for them
    const available = !existing || existing.id === session.user.id;

    return NextResponse.json({ available, username });
  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json(
      { error: "Failed to check username" },
      { status: 500 }
    );
  }
}
