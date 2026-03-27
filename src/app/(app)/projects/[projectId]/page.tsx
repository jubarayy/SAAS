import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectStatusBadge, DeliverableStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft, Plus, Link2, ExternalLink, Clock, CheckCircle2,
  MessageSquare, Copy, Share2, Eye, Layers, Calendar
} from "lucide-react";
import { AddDeliverableDialog } from "@/components/projects/add-deliverable-dialog";
import { CreateReviewLinkDialog } from "@/components/projects/create-review-link-dialog";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { projectId } = await params;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) redirect("/onboarding");

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: membership.workspace.id },
    include: {
      client: { select: { id: true, name: true, company: true, email: true } },
      deliverables: {
        where: { isArchived: false },
        include: {
          versions: { where: { isLatest: true }, take: 1 },
          _count: { select: { feedback: { where: { status: "open" } } } },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      reviewLinks: {
        where: { isActive: true },
        include: {
          _count: { select: { sessions: true, feedback: true, approvals: true } },
          approvals: {
            select: { action: true, clientName: true, clientEmail: true, createdAt: true, note: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  const openFeedbackCount = project.deliverables.reduce((sum, d) => sum + d._count.feedback, 0);
  const approvedCount = project.deliverables.filter((d) => d.status === "approved").length;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>
        <PageHeader
          title={project.name}
          description={`${project.client.name}${project.client.company ? ` · ${project.client.company}` : ""}`}
          actions={
            <div className="flex items-center gap-2">
              <ProjectStatusBadge status={project.status} />
              <CreateReviewLinkDialog projectId={projectId} />
              <AddDeliverableDialog projectId={projectId} />
            </div>
          }
        />
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Layers className="h-4 w-4" />
          {project.deliverables.length} deliverable{project.deliverables.length !== 1 ? "s" : ""}
          {project.deliverables.length > 0 && ` · ${approvedCount} approved`}
        </div>
        {openFeedbackCount > 0 && (
          <div className="flex items-center gap-1.5 text-yellow-600">
            <MessageSquare className="h-4 w-4" />
            {openFeedbackCount} open feedback
          </div>
        )}
        {project.dueDate && (
          <div className={`flex items-center gap-1.5 ${new Date(project.dueDate) < new Date() && project.status !== "approved" ? "text-red-600" : "text-muted-foreground"}`}>
            <Calendar className="h-4 w-4" />
            Due {formatDate(project.dueDate)}
          </div>
        )}
        {project.internalNote && (
          <div className="text-muted-foreground">
            <span className="font-medium">Note:</span> {project.internalNote}
          </div>
        )}
      </div>

      <Tabs defaultValue="deliverables">
        <TabsList>
          <TabsTrigger value="deliverables">
            Deliverables ({project.deliverables.length})
          </TabsTrigger>
          <TabsTrigger value="review-links">
            Review Links ({project.reviewLinks.length})
          </TabsTrigger>
          <TabsTrigger value="approvals">
            Approval History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deliverables" className="mt-4 space-y-3">
          {project.deliverables.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No deliverables yet"
              description="Add a URL, design file, or link to start collecting feedback"
              action={<AddDeliverableDialog projectId={projectId} />}
            />
          ) : (
            project.deliverables.map((deliverable) => {
              const latestVersion = deliverable.versions[0];
              return (
                <Card key={deliverable.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{deliverable.name}</p>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {deliverable.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {latestVersion?.url && (
                        <a
                          href={latestVersion.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {latestVersion.url.length > 60 ? latestVersion.url.slice(0, 60) + "…" : latestVersion.url}
                        </a>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          v{latestVersion?.versionNumber || 1}
                        </span>
                        {deliverable._count.feedback > 0 && (
                          <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                            <MessageSquare className="h-3 w-3" />
                            {deliverable._count.feedback} open
                          </span>
                        )}
                      </div>
                    </div>
                    <DeliverableStatusBadge status={deliverable.status} />
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="review-links" className="mt-4 space-y-3">
          {project.reviewLinks.length === 0 ? (
            <EmptyState
              icon={Share2}
              title="No review links yet"
              description="Create a review link to share with your client for visual feedback and approval"
              action={<CreateReviewLinkDialog projectId={projectId} />}
            />
          ) : (
            project.reviewLinks.map((link) => {
              const reviewUrl = `${appUrl}/review/${link.token}`;
              return (
                <Card key={link.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{link.label || "Review Link"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{reviewUrl}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{link._count.sessions} views</span>
                          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{link._count.feedback} comments</span>
                          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{link._count.approvals} responses</span>
                          {link.expiresAt && (
                            <span className={new Date(link.expiresAt) < new Date() ? "text-red-500" : ""}>
                              Expires {formatDate(link.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <CopyLinkButton url={reviewUrl} />
                        <Button size="sm" variant="outline" asChild>
                          <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          {project.reviewLinks.every((l) => l.approvals.length === 0) ? (
            <EmptyState
              icon={CheckCircle2}
              title="No approval actions yet"
              description="Approval history will appear here once clients respond to review links"
            />
          ) : (
            <div className="space-y-3">
              {project.reviewLinks.flatMap((link) =>
                link.approvals.map((approval) => (
                  <Card key={`${link.id}-${approval.createdAt.toISOString()}`}>
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                        approval.action === "approved" ? "bg-green-100" : "bg-orange-100"
                      }`}>
                        {approval.action === "approved"
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <MessageSquare className="h-4 w-4 text-orange-600" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {approval.clientName || "Client"}{" "}
                          <span className={approval.action === "approved" ? "text-green-600" : "text-orange-600"}>
                            {approval.action === "approved" ? "approved" : "requested changes"}
                          </span>
                        </p>
                        {approval.clientEmail && (
                          <p className="text-xs text-muted-foreground">{approval.clientEmail}</p>
                        )}
                        {approval.note && (
                          <p className="mt-1 text-sm text-muted-foreground bg-muted rounded-md p-2">{approval.note}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(approval.createdAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  // Client component wrapper needed — using a simple button with onClick
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
      }}
    >
      <Copy className="h-3.5 w-3.5" />
    </Button>
  );
}
