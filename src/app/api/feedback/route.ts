import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { createNotificationForWorkspaceMembers } from "@/lib/notifications";

const createSchema = z.object({
  deliverableId: z.string().cuid(),
  reviewLinkId: z.string().optional().nullable(),
  posX: z.number().min(0).max(100).optional().nullable(),
  posY: z.number().min(0).max(100).optional().nullable(),
  pageUrl: z.string().url().optional().nullable(),
  content: z.string().min(1),
  clientName: z.string().optional().nullable(),
  clientEmail: z.string().email().optional().nullable(),
  isInternal: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = req.nextUrl;
  const deliverableId = searchParams.get("deliverableId");
  const feedbackStatus = searchParams.get("status");
  const assignedToMe = searchParams.get("assignedToMe") === "true";
  const projectId = searchParams.get("projectId");

  const items = await prisma.feedbackItem.findMany({
    where: {
      deliverable: { project: { workspaceId: workspace!.id } },
      ...(deliverableId && { deliverableId }),
      ...(feedbackStatus && { status: feedbackStatus as "open" | "resolved" | "ignored" }),
      ...(assignedToMe && { assignedToId: userId }),
      ...(projectId && { deliverable: { projectId } }),
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      deliverable: { select: { id: true, name: true, projectId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await import("@/lib/auth/config").then((m) => m.auth());
  const body = await req.json();
  
  // Feedback can be created by workspace members or client reviewers (via review link)
  const isClientReview = body.reviewLinkId && !session?.user?.id;

  try {
    const data = createSchema.parse(body);

    // Verify deliverable exists
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: data.deliverableId },
      include: { project: { include: { workspace: true } } },
    });
    if (!deliverable) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If client review, verify review link is valid
    if (data.reviewLinkId) {
      const link = await prisma.reviewLink.findUnique({
        where: { id: data.reviewLinkId, isActive: true },
      });
      if (!link || link.projectId !== deliverable.projectId) {
        return NextResponse.json({ error: "Invalid review link" }, { status: 403 });
      }
    } else if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create feedback item
    const feedback = await prisma.feedbackItem.create({
      data: {
        deliverableId: data.deliverableId,
        reviewLinkId: data.reviewLinkId,
        posX: data.posX,
        posY: data.posY,
        pageUrl: data.pageUrl,
        createdById: session?.user?.id || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        comments: {
          create: {
            content: data.content,
            userId: session?.user?.id || null,
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            isInternal: data.isInternal || false,
          },
        },
      },
      include: {
        comments: true,
      },
    });

    // Notify workspace members
    if (data.reviewLinkId) {
      await createNotificationForWorkspaceMembers(
        deliverable.project.workspaceId,
        undefined,
        {
          type: "feedback_created",
          title: `New feedback on ${deliverable.name}`,
          body: `${data.clientName || "A client"} left a comment`,
          projectId: deliverable.projectId,
          actionUrl: `/projects/${deliverable.projectId}`,
        }
      );
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 });
  }
}
