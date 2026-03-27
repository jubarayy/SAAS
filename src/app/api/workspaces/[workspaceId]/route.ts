import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = await params;

  // Verify ownership
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id, role: { in: ["owner", "admin"] } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = schema.parse(await req.json());
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: data.name, website: data.website || null, description: data.description },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}
