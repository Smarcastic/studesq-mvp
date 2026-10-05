import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { achievementSchema } from "@/lib/validations/achievement";
import { z } from "zod/v4";
import { toJsonArray } from "@/lib/utils";
import {
  createAuditLog,
  recalculateTrustScore,
  requestVerification,
  setAchievementVisibility,
} from "@/lib/services/verification-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const achievement = await prisma.achievement.findFirst({
    where: { id, userId: session.user.id },
    include: {
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!achievement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(achievement);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.achievement.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const result = achievementSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const { tags, date, externalLink, isPublic, ...rest } = result.data;

  const achievement = await prisma.achievement.update({
    where: { id },
    data: {
      ...rest,
      date: new Date(date),
      tags: tags ? toJsonArray(tags) : null,
      externalLink: externalLink || null,
      isPublic: isPublic ?? existing.isPublic,
    },
  });

  await createAuditLog({
    achievementId: id,
    actionType: "UPDATED",
    performedBy: session.user.id,
  });

  return NextResponse.json(achievement);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.achievement.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.achievement.delete({ where: { id } });

  // Recalculate trust score after deletion
  await recalculateTrustScore(session.user.id);

  return NextResponse.json({ success: true });
}

/**
 * PATCH — Handle verification-related actions:
 * - request_review: Submit for admin review
 * - toggle_visibility: Change public/private
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action: string };

  try {
    if (action === "request_review") {
      const result = await requestVerification({
        achievementId: id,
        userId: session.user.id,
      });
      return NextResponse.json(result);
    }

    if (action === "toggle_visibility") {
      const { isPublic } = body as { isPublic: boolean };
      const result = await setAchievementVisibility({
        achievementId: id,
        userId: session.user.id,
        isPublic,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
