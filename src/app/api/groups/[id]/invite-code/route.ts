import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Only admin/owner can regenerate invite code
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: session.user.id },
      },
    });

    if (!member || !["admin", "owner"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const inviteCode = crypto.randomBytes(4).toString("hex");

    await prisma.group.update({
      where: { id },
      data: { inviteCode },
    });

    return NextResponse.json({ inviteCode });
  } catch (error) {
    console.error("[GroupInviteCode] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
