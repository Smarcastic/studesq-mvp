import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores allowed"),
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = usernameSchema.safeParse({
      ...body,
      username: body.username?.toLowerCase(),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: z.treeifyError(result.error) },
        { status: 400 }
      );
    }

    const { username } = result.data;

    // Check uniqueness
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Username PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update username" },
      { status: 500 }
    );
  }
}
