import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { DeliverableType } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(DeliverableType),
  url: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { projectId } = await params;

  // Verify project belongs to workspace
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace!.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = createSchema.parse(await req.json());

    const deliverable = await prisma.deliverable.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        type: data.type,
        versions: {
          create: {
            versionNumber: 1,
            label: "v1",
            url: data.url,
            notes: data.notes,
            uploadedById: userId,
            isLatest: true,
          },
        },
      },
      include: {
        versions: { where: { isLatest: true } },
      },
    });

    return NextResponse.json(deliverable, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create deliverable" }, { status: 500 });
  }
}
