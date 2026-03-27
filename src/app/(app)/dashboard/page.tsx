import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import {
  FolderOpen, Users, Clock, CheckCircle2, AlertCircle,
  MessageSquare, Plus, ArrowRight
} from "lucide-react";

async function getDashboardData(workspaceId: string) {
  const now = new Date();

  const [
    totalProjects,
    activeProjects,
    awaitingClientFeedback,
    awaitingInternalAction,
    approvedThisWeek,
    overdueProjects,
    recentActivity,
    totalClients,
    openFeedback,
  ] = await Promise.all([
    prisma.project.count({ where: { workspaceId, isArchived: false } }),
    prisma.project.count({ where: { workspaceId, isArchived: false, status: { in: ["active", "in_review"] } } }),
    prisma.project.count({ where: { workspaceId, isArchived: false, status: "in_review" } }),
    prisma.project.count({ where: { workspaceId, isArchived: false, status: "changes_requested" } }),
    prisma.project.count({
      where: {
        workspaceId,
        status: "approved",
        updatedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.project.count({
      where: {
        workspaceId,
        isArchived: false,
        dueDate: { lt: now },
        status: { not: "approved" },
      },
    }),
    prisma.auditLog.findMany({
      where: { workspaceId },
      include: { user: { select: { name: true, email: true } }, project: { select: { name: true, id: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.client.count({ where: { workspaceId, isArchived: false } }),
    prisma.feedbackItem.count({
      where: { deliverable: { project: { workspaceId } }, status: "open" },
    }),
  ]);

  const recentProjects = await prisma.project.findMany({
    where: { workspaceId, isArchived: false },
    include: {
      client: { select: { name: true } },
      _count: { select: { deliverables: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return {
    totalProjects, activeProjects, awaitingClientFeedback,
    awaitingInternalAction, approvedThisWeek, overdueProjects,
    recentActivity, totalClients, openFeedback, recentProjects,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) redirect("/onboarding");

  const data = await getDashboardData(membership.workspace.id);

  const stats = [
    {
      label: "Active projects",
      value: data.activeProjects,
      icon: FolderOpen,
      href: "/projects?status=active",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Awaiting client",
      value: data.awaitingClientFeedback,
      icon: Clock,
      href: "/projects?status=in_review",
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Needs your action",
      value: data.awaitingInternalAction,
      icon: AlertCircle,
      href: "/projects?status=changes_requested",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Approved this week",
      value: data.approvedThisWeek,
      icon: CheckCircle2,
      href: "/projects?status=approved",
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${session.user.name?.split(" ")[0] || "there"}`}
        description={`${membership.workspace.name} · ${data.totalProjects} projects · ${data.totalClients} clients`}
        actions={
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              New project
            </Link>
          </Button>
        }
      />

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Alerts */}
      {(data.overdueProjects > 0 || data.openFeedback > 0) && (
        <div className="flex flex-wrap gap-3">
          {data.overdueProjects > 0 && (
            <Link href="/projects?overdue=true">
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 transition-colors">
                <AlertCircle className="h-4 w-4" />
                {data.overdueProjects} overdue {data.overdueProjects === 1 ? "project" : "projects"}
              </div>
            </Link>
          )}
          {data.openFeedback > 0 && (
            <Link href="/feedback?status=open">
              <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-100 transition-colors">
                <MessageSquare className="h-4 w-4" />
                {data.openFeedback} open feedback {data.openFeedback === 1 ? "item" : "items"}
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent projects */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent projects</CardTitle>
            <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentProjects.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <Link href="/projects/new" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                  Create your first project
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {data.recentProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {project.client.name} · {project._count.deliverables} deliverable{project._count.deliverables !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ProjectStatusBadge status={project.status} />
                      {project.dueDate && (
                        <span className={`text-xs ${new Date(project.dueDate) < new Date() ? "text-red-600" : "text-muted-foreground"}`}>
                          {formatDate(project.dueDate)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentActivity.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground text-center">No activity yet</p>
            ) : (
              <div className="divide-y">
                {data.recentActivity.map((log) => (
                  <div key={log.id} className="px-6 py-3">
                    <p className="text-xs text-foreground">
                      <span className="font-medium">{log.user?.name || log.user?.email || "System"}</span>{" "}
                      {formatAction(log.action, log.entity)}
                      {log.project && (
                        <>
                          {" "}in{" "}
                          <Link href={`/projects/${log.project.id}`} className="font-medium hover:underline">
                            {log.project.name}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(log.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/projects/new"><Plus className="h-3.5 w-3.5" />New project</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients/new"><Users className="h-3.5 w-3.5" />Add client</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/feedback?status=open"><MessageSquare className="h-3.5 w-3.5" />Open feedback</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function formatAction(action: string, entity: string) {
  const entityLabel = entity.replace(/_/g, " ");
  const actions: Record<string, string> = {
    create: `created a ${entityLabel}`,
    update: `updated a ${entityLabel}`,
    archive: `archived a ${entityLabel}`,
    delete: `deleted a ${entityLabel}`,
  };
  return actions[action] || `${action} ${entityLabel}`;
}
