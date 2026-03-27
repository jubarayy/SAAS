import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendMagicLink } from "@/lib/email";
import { generateToken } from "@/lib/utils";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());

    const token = generateToken(48);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, emailVerified: new Date() },
      });
    }

    await prisma.magicLink.create({
      data: { token, email, userId: user.id, expiresAt },
    });

    await sendMagicLink(email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Magic link error:", error);
    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  }
}
