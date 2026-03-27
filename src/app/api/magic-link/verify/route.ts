import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!magicLink) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  if (magicLink.usedAt) {
    return NextResponse.json({ error: "Link already used" }, { status: 400 });
  }

  if (magicLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 400 });
  }

  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  });

  // Generate a temporary password for the credentials sign-in
  // (Magic link auth exchanges to credentials session)
  const tempPassword = generateToken(32);
  const tempHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id: magicLink.userId! },
    data: { passwordHash: tempHash, emailVerified: new Date() },
  });

  return NextResponse.json({
    email: magicLink.email,
    tempPassword,
  });
}
