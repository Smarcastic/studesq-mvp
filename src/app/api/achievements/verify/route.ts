import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verificationActionSchema } from "@/lib/validations/achievement";
import { z } from "zod/v4";
import {
  approveVerification,
  rejectVerification,
  getPendingVerifications,
} from "@/lib/services/verification-service";

/**
 * GET — List all achievements pending verification (admin only).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pending = await getPendingVerifications();
  return NextResponse.json(pending);
}

/**
 * POST — Approve or reject a verification (admin only).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const result = verificationActionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const { achievementId, action, notes, level } = result.data;

  try {
    if (action === "approve") {
      const updated = await approveVerification({
        achievementId,
        adminUserId: session.user.id,
        notes,
        level,
      });
      return NextResponse.json(updated);
    }

    if (action === "reject") {
      if (!notes) {
        return NextResponse.json(
          { error: "Notes are required when rejecting" },
          { status: 400 }
        );
      }
      const updated = await rejectVerification({
        achievementId,
        adminUserId: session.user.id,
        notes,
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
