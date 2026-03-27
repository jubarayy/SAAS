import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { prisma } = await import("@/lib/db");

  const reviewLink = await prisma.reviewLink.findUnique({
    where: { token, isActive: true },
    include: {
      project: {
        include: {
          client: { select: { name: true } },
          deliverables: {
            where: { isArchived: false },
            include: {
              versions: { where: { isLatest: true }, take: 1 },
              feedback: {
                where: { status: { not: "ignored" } },
                include: {
                  comments: {
                    orderBy: { createdAt: "asc" },
                    select: {
                      id: true, content: true, clientName: true, isInternal: true, createdAt: true,
                      user: { select: { name: true, avatarUrl: true } },
                    },
                  },
                },
              },
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!reviewLink) return NextResponse.json({ error: "Review link not found" }, { status: 404 });

  if (reviewLink.expiresAt && reviewLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "This review link has expired" }, { status: 410 });
  }

  const sanitized = {
    ...reviewLink,
    project: {
      ...reviewLink.project,
      deliverables: reviewLink.project.deliverables.map((d) => ({
        ...d,
        feedback: d.feedback.map((f) => ({
          ...f,
          comments: f.comments.filter((c) => !c.isInternal),
        })),
      })),
    },
  };

  return NextResponse.json(sanitized);
}
