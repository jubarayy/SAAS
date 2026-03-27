import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/utils";
import { sendInvitation } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "team_member"]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = await params;

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id, role: { in: ["owner", "admin"] } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { email, role } = schema.parse(await req.json());

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existing = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });
      if (existing) return NextResponse.json({ error: "This person is already a team member" }, { status: 409 });
    }

    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.workspaceInvitation.create({
      data: { workspaceId, email, role, token, invitedById: session.user.id, expiresAt },
    });

    const inviter = await prisma.user.findUnique({ where: { id: session.user.id } });
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

    await sendInvitation(
      email,
      inviter?.name || inviter?.email || "A team member",
      workspace?.name || "MarkupFlow",
      token
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}
