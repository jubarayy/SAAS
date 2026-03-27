import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { ProjectStatus, ProjectType } from "@prisma/client";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(ProjectType).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  internalNote: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { workspace, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace!.id },
    include: {
      client: { select: { id: true, name: true, company: true, email: true } },
      members: { include: { project: false } },
      deliverables: {
        where: { isArchived: false },
        include: {
          versions: { where: { isLatest: true }, take: 1 },
          _count: { select: { feedback: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      reviewLinks: {
        where: { isActive: true },
        include: {
          _count: { select: { sessions: true, feedback: true } },
        },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace!.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = updateSchema.parse(await req.json());
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
      },
    });

    await createAuditLog({
      workspaceId: workspace!.id,
      projectId,
      userId: userId!,
      action: "update",
      entity: "project",
      entityId: projectId,
      metadata: data as Record<string, unknown>,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
