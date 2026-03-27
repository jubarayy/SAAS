import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FeedbackStatusBadge } from "@/components/shared/status-badge";
import { formatRelativeTime } from "@/lib/utils";
import { MessageSquare, MapPin, User } from "lucide-react";
import { FeedbackStatus } from "@prisma/client";
import { FeedbackActions } from "@/components/feedback/feedback-actions";

const STATUS_FILTERS: { label: string; value: FeedbackStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "Ignored", value: "ignored" },
];

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; assignedToMe?: string; projectId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status as FeedbackStatus | undefined;
  const assignedToMe = params.assignedToMe === "true";
  const projectIdFilter = params.projectId;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) redirect("/onboarding");

  const items = await prisma.feedbackItem.findMany({
    where: {
      deliverable: { project: { workspaceId: membership.workspace.id } },
      ...(statusFilter && { status: statusFilter }),
      ...(assignedToMe && { assignedToId: session.user.id }),
      ...(projectIdFilter && { deliverable: { projectId: projectIdFilter } }),
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      deliverable: {
        select: {
          id: true,
          name: true,
          project: { select: { id: true, name: true, client: { select: { name: true } } } },
        },
      },
      comments: {
        select: { id: true, content: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: membership.workspace.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description={`${items.length} item${items.length !== 1 ? "s" : ""}`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/feedback" : `/feedback?status=${filter.value}`}
          >
            <button
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (filter.value === "all" && !statusFilter) || statusFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {filter.label}
            </button>
          </Link>
        ))}
        <Link href={`/feedback?assignedToMe=true`}>
          <button
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
              assignedToMe
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <User className="h-3 w-3" />
            Assigned to me
          </button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No feedback items"
          description={statusFilter ? "No items with this status" : "Feedback from clients will appear here"}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        href={`/projects/${item.deliverable.project.id}`}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        {item.deliverable.project.client.name} / {item.deliverable.project.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{item.deliverable.name}</span>
                    </div>
                    <p className="text-sm font-medium">
                      {item.comments[0]?.content?.slice(0, 120) || "No comment text"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>
                        {item.clientName || item.createdBy?.name || "Unknown"} · {formatRelativeTime(item.createdAt)}
                      </span>
                      {item.posX != null && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          Pinned
                        </span>
                      )}
                      {item.assignedTo && (
                        <span className="flex items-center gap-0.5">
                          <User className="h-3 w-3" />
                          {item.assignedTo.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <FeedbackStatusBadge status={item.status} />
                    <FeedbackActions
                      feedbackId={item.id}
                      currentStatus={item.status}
                      assignedToId={item.assignedToId}
                      workspaceMembers={workspaceMembers.map((m) => m.user)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
