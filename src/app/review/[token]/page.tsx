import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReviewPortal } from "@/components/review/review-portal";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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
                    where: { isInternal: false },
                    orderBy: { createdAt: "asc" },
                    select: {
                      id: true, content: true, clientName: true, isInternal: true, createdAt: true,
                      user: { select: { name: true, avatarUrl: true } },
                    },
                  },
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
      approvals: {
        select: { action: true, clientName: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!reviewLink) notFound();

  if (reviewLink.expiresAt && reviewLink.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">Review link expired</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            This review link expired on {reviewLink.expiresAt.toLocaleDateString()}. 
            Please contact the team to request a new link.
          </p>
        </div>
      </div>
    );
  }

  return <ReviewPortal reviewLink={reviewLink} token={token} />;
}
