import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";
import crypto from "crypto";

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["school", "class", "study", "custom"]),
  school: z.string().max(200).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const school = searchParams.get("school");
    const mine = searchParams.get("mine") === "true";

    if (mine) {
      const groups = await prisma.group.findMany({
        where: {
          members: { some: { userId: session.user.id } },
        },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          school: true,
          avatarUrl: true,
          isPublic: true,
          createdAt: true,
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(groups);
    }

    const where: Record<string, unknown> = { isPublic: true };
    if (type) where.type = type;
    if (school) where.school = { contains: school };

    const groups = await prisma.group.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        school: true,
        avatarUrl: true,
        isPublic: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("[Groups] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = createGroupSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    const { name, description, type, school, isPublic } = result.data;
    const inviteCode = crypto.randomBytes(4).toString("hex");

    const group = await prisma.$transaction(async (tx) => {
      // Create the conversation for the group chat
      const conversation = await tx.conversation.create({
        data: {
          type: "group",
          name,
          createdBy: session.user!.id,
          members: {
            create: {
              userId: session.user!.id,
              role: "owner",
            },
          },
        },
      });

      // Create the group with linked conversation
      const newGroup = await tx.group.create({
        data: {
          name,
          description,
          type,
          school,
          isPublic: isPublic ?? false,
          inviteCode,
          createdBy: session.user!.id,
          conversationId: conversation.id,
          members: {
            create: {
              userId: session.user!.id,
              role: "owner",
            },
          },
        },
        include: {
          _count: { select: { members: true } },
        },
      });

      return newGroup;
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("[Groups] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
