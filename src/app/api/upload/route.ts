import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // MIME type allowlist
  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Only JPEG, PNG, WebP, and PDF are accepted." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", session.user.id);
  await mkdir(uploadDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  return NextResponse.json({
    url: `/uploads/${session.user.id}/${fileName}`,
    fileName: file.name,
    fileSize: file.size,
  });
}
