import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  company: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { workspace, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace!.id },
    include: {
      projects: {
        where: { isArchived: false },
        include: { _count: { select: { deliverables: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace!.id },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = updateSchema.parse(await req.json());
    const updated = await prisma.client.update({
      where: { id: clientId },
      data,
    });

    await createAuditLog({
      workspaceId: workspace!.id,
      userId: userId!,
      action: "update",
      entity: "client",
      entityId: clientId,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace!.id },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Archive instead of hard delete
  await prisma.client.update({
    where: { id: clientId },
    data: { isArchived: true },
  });

  await createAuditLog({
    workspaceId: workspace!.id,
    userId: userId!,
    action: "archive",
    entity: "client",
    entityId: clientId,
  });

  return NextResponse.json({ success: true });
}
