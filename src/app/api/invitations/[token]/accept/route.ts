import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "Invitation already accepted" }, { status: 410 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
  }

  if (invitation.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: "This invitation was sent to a different email address" },
      { status: 403 }
    );
  }

  // Check if already a member
  const existing = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: invitation.workspaceId,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    // Already a member — just mark invitation as accepted and redirect
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    return NextResponse.json({ workspace: invitation.workspace });
  }

  // Atomic transaction: mark accepted + create member
  await prisma.$transaction([
    prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
    prisma.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: session.user.id,
        role: invitation.role,
      },
    }),
  ]);

  return NextResponse.json({ workspace: invitation.workspace });
}
