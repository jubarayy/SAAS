import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encode } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
  }

  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!magicLink) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", req.url));
  }

  if (magicLink.usedAt) {
    return NextResponse.redirect(new URL("/login?error=link_already_used", req.url));
  }

  if (magicLink.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/login?error=link_expired", req.url));
  }

  const user = magicLink.user;
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", req.url));
  }

  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  });

  // Ensure emailVerified
  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd ? "__Secure-authjs.session-token" : "authjs.session-token";
  const maxAge = 30 * 24 * 60 * 60; // 30 days

  const sessionToken = await encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.avatarUrl,
      platformRole: user.platformRole,
    },
    secret: process.env.AUTH_SECRET!,
    salt: cookieName,
    maxAge,
  });

  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge,
  });

  return response;
}
