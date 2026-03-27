import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { prisma } from "@/lib/db";

const schema = z.object({
  url: z.string().url().optional().nullable(),
  label: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ deliverableId: string }> }) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { deliverableId } = await params;

  const deliverable = await prisma.deliverable.findFirst({
    where: { id: deliverableId, project: { workspaceId: workspace!.id } },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  if (!deliverable) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = schema.parse(await req.json());
    const latestVersion = deliverable.versions[0]?.versionNumber || 0;

    // Mark all previous versions as not latest
    await prisma.deliverableVersion.updateMany({
      where: { deliverableId },
      data: { isLatest: false },
    });

    const version = await prisma.deliverableVersion.create({
      data: {
        deliverableId,
        versionNumber: latestVersion + 1,
        label: data.label || `v${latestVersion + 1}`,
        url: data.url,
        notes: data.notes,
        uploadedById: userId,
        isLatest: true,
      },
    });

    // Update deliverable status back to in_review
    await prisma.deliverable.update({
      where: { id: deliverableId },
      data: { status: "in_review", updatedAt: new Date() },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to add version" }, { status: 500 });
  }
}
