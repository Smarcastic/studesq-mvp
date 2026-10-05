import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { achievementSchema } from "@/lib/validations/achievement";
import { z } from "zod/v4";
import { toJsonArray } from "@/lib/utils";
import {
  createAuditLog,
  recalculateTrustScore,
  getTrustImpact,
  validateProofLink,
} from "@/lib/services/verification-service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "date-desc";

    const where: Record<string, unknown> = { userId: session.user.id };
    if (category && category !== "all") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [sortField, sortDir] = sort.split("-");
    const orderBy: Record<string, string> = {};
    if (sortField === "date") orderBy.date = sortDir || "desc";
    else if (sortField === "title") orderBy.title = sortDir || "asc";
    else orderBy.createdAt = "desc";

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy,
      take: 100,
    });

    return NextResponse.json(achievements);
  } catch (error) {
    console.error("[Achievements] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = achievementSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  try {
    const {
      tags,
      date,
      externalLink,
      proofDocumentUrl: submittedDocUrl,
      proofDocumentType: submittedDocType,
      isPublic,
      ...rest
    } = result.data;

    // Determine initial verification state based on provided proof
    let verificationLevel = 0;
    let verificationStatus = "SELF_REPORTED";
    let proofDocumentType = "NONE";
    let proofDocumentUrl: string | null = null;

    // Uploaded file takes priority for document type
    if (submittedDocUrl && submittedDocType && submittedDocType !== "NONE") {
      verificationLevel = 1;
      verificationStatus = "DOCUMENT_UPLOADED";
      proofDocumentType = submittedDocType;
      proofDocumentUrl = submittedDocUrl;
    } else if (externalLink && validateProofLink(externalLink)) {
      verificationLevel = 1;
      verificationStatus = "DOCUMENT_UPLOADED";
      proofDocumentType = "LINK";
    }

    const achievement = await prisma.achievement.create({
      data: {
        ...rest,
        date: new Date(date),
        tags: tags ? toJsonArray(tags) : null,
        externalLink: externalLink || null,
        proofDocumentUrl,
        proofDocumentType,
        isPublic: isPublic ?? true,
        verificationLevel,
        verificationStatus,
        trustScoreImpact: getTrustImpact(verificationLevel),
        userId: session.user.id,
      },
    });

    await createAuditLog({
      achievementId: achievement.id,
      actionType: "CREATED",
      performedBy: session.user.id,
    });

    await recalculateTrustScore(session.user.id);

    return NextResponse.json(achievement, { status: 201 });
  } catch (error) {
    console.error("[Achievements] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
