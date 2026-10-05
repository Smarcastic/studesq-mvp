import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations/profile";
import { z } from "zod/v4";
import { toJsonArray } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        role: true,
        bio: true,
        school: true,
        grade: true,
        graduationYear: true,
        location: true,
        interests: true,
        careerAspirations: true,
        languages: true,
        skills: true,
        academicGoals: true,
        privacyLevel: true,
        trustScore: true,
        verifiedAchievementsCount: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = profileSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(result.error) },
      { status: 400 }
    );
  }

  const { interests, languages, skills, ...rest } = result.data;

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...rest,
        interests: interests ? toJsonArray(interests) : undefined,
        languages: languages ? toJsonArray(languages) : undefined,
        skills: skills ? toJsonArray(skills) : undefined,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
