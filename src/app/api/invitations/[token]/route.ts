import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true, logoUrl: true },
      },
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

  return NextResponse.json({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    workspace: invitation.workspace,
  });
}
