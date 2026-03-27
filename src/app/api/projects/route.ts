import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { ProjectStatus, ProjectType } from "@prisma/client";

const createSchema = z.object({
  clientId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(ProjectType).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  internalNote: z.string().optional().nullable(),
  memberIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") as ProjectStatus | null;
  const clientId = searchParams.get("clientId");
  const archived = searchParams.get("archived") === "true";

  const projects = await prisma.project.findMany({
    where: {
      workspaceId: workspace!.id,
      isArchived: archived,
      ...(statusFilter && { status: statusFilter }),
      ...(clientId && { clientId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: {
        select: { deliverables: true },
      },
      deliverables: {
        where: { isArchived: false },
        select: { status: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // Verify client belongs to workspace
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, workspaceId: workspace!.id },
    });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const project = await prisma.project.create({
      data: {
        workspaceId: workspace!.id,
        clientId: data.clientId,
        name: data.name,
        description: data.description,
        type: data.type || "website",
        status: data.status || "active",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        internalNote: data.internalNote,
        members: {
          create: [
            { userId: userId! },
            ...(data.memberIds?.filter((id) => id !== userId).map((id) => ({ userId: id })) || []),
          ],
        },
      },
      include: { client: { select: { id: true, name: true } } },
    });

    await createAuditLog({
      workspaceId: workspace!.id,
      projectId: project.id,
      userId: userId!,
      action: "create",
      entity: "project",
      entityId: project.id,
      metadata: { name: project.name },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
