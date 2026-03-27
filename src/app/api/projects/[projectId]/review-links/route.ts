import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";

const createSchema = z.object({
  label: z.string().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  requiresEmail: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { workspace, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace!.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const links = await prisma.reviewLink.findMany({
    where: { projectId },
    include: {
      _count: { select: { sessions: true, feedback: true, approvals: true } },
      approvals: {
        select: { action: true, clientName: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace!.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = createSchema.parse(await req.json());
    const token = generateToken(24);

    const link = await prisma.reviewLink.create({
      data: {
        projectId,
        token,
        label: data.label,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        requiresEmail: data.requiresEmail || false,
      },
    });

    await createAuditLog({
      workspaceId: workspace!.id,
      projectId,
      userId: userId!,
      action: "create",
      entity: "review_link",
      entityId: link.id,
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "in_review" },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create review link" }, { status: 500 });
  }
}
