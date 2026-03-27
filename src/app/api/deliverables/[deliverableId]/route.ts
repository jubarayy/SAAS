import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { DeliverableStatus } from "@prisma/client";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(DeliverableStatus).optional(),
  isArchived: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ deliverableId: string }> }) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { deliverableId } = await params;

  const deliverable = await prisma.deliverable.findFirst({
    where: { id: deliverableId, project: { workspaceId: workspace!.id } },
  });
  if (!deliverable) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = updateSchema.parse(await req.json());
    const updated = await prisma.deliverable.update({ where: { id: deliverableId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to update deliverable" }, { status: 500 });
  }
}
