import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createNotificationForWorkspaceMembers } from "@/lib/notifications";

const schema = z.object({
  action: z.enum(["approved", "changes_requested"]),
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional().nullable(),
  note: z.string().optional().nullable(),
  checklistData: z.array(z.object({ label: z.string(), checked: z.boolean() })).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const reviewLink = await prisma.reviewLink.findUnique({
    where: { token, isActive: true },
    include: { project: { include: { workspace: true } } },
  });

  if (!reviewLink) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  if (reviewLink.expiresAt && reviewLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }

  try {
    const data = schema.parse(await req.json());

    const sessionId = `${reviewLink.id}-${(data.clientEmail || data.clientName).replace(/[^a-zA-Z0-9]/g, '')}`;

    const session = await prisma.reviewSession.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId,
        reviewLinkId: reviewLink.id,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        status: data.action === "approved" ? "approved" : "changes_requested",
        viewedAt: new Date(),
        respondedAt: new Date(),
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
      update: {
        status: data.action === "approved" ? "approved" : "changes_requested",
        respondedAt: new Date(),
      },
    });

    await prisma.approvalAction.create({
      data: {
        reviewLinkId: reviewLink.id,
        reviewSessionId: session.id,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        projectId: reviewLink.projectId,
        action: data.action,
        note: data.note,
        checklistData: data.checklistData,
      },
    });

    const newStatus = data.action === "approved" ? "approved" : "changes_requested";
    await prisma.project.update({
      where: { id: reviewLink.projectId },
      data: { status: newStatus },
    });

    await createNotificationForWorkspaceMembers(
      reviewLink.project.workspaceId,
      undefined,
      {
        type: data.action === "approved" ? "project_approved" : "review_requested",
        title: data.action === "approved"
          ? `${data.clientName} approved the project`
          : `${data.clientName} requested changes`,
        body: data.note || undefined,
        projectId: reviewLink.projectId,
        actionUrl: `/projects/${reviewLink.projectId}`,
      }
    );

    return NextResponse.json({ success: true, action: data.action });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
