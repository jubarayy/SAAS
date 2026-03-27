import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { FeedbackStatus } from "@prisma/client";

const updateSchema = z.object({
  status: z.nativeEnum(FeedbackStatus).optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ feedbackId: string }> }) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });
  const { feedbackId } = await params;

  const feedback = await prisma.feedbackItem.findFirst({
    where: { id: feedbackId, deliverable: { project: { workspaceId: workspace!.id } } },
  });
  if (!feedback) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = updateSchema.parse(await req.json());
    const updated = await prisma.feedbackItem.update({
      where: { id: feedbackId },
      data: {
        ...data,
        ...(data.status === "resolved" && { resolvedAt: new Date(), resolvedById: userId }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}
