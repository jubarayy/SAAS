import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { FolderOpen, Plus, Calendar, Layers } from "lucide-react";
import { ProjectStatus } from "@prisma/client";

const STATUS_FILTERS: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "In Review", value: "in_review" },
  { label: "Changes Requested", value: "changes_requested" },
  { label: "Approved", value: "approved" },
  { label: "Draft", value: "draft" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; archived?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status as ProjectStatus | undefined;
  const showArchived = params.archived === "true";

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) redirect("/onboarding");

  const projects = await prisma.project.findMany({
    where: {
      workspaceId: membership.workspace.id,
      isArchived: showArchived,
      ...(statusFilter && { status: statusFilter }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { client: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { deliverables: { where: { isArchived: false } } } },
      deliverables: {
        where: { isArchived: false },
        select: { status: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
        actions={
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              New project
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/projects" : `/projects?status=${filter.value}`}
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
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={search || statusFilter ? "No projects found" : "No projects yet"}
          description={
            search || statusFilter
              ? "Try adjusting your filters"
              : "Create your first project to start collecting feedback"
          }
          action={
            !search && !statusFilter && (
              <Button asChild>
                <Link href="/projects/new"><Plus className="h-4 w-4" />New project</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {projects.map((project) => {
            const approvedCount = project.deliverables.filter((d) => d.status === "approved").length;
            const total = project.deliverables.length;
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{project.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{project.client.name}</span>
                        {total > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {approvedCount}/{total} approved
                          </span>
                        )}
                        {project.dueDate && (
                          <span className={`text-xs flex items-center gap-1 ${new Date(project.dueDate) < new Date() && project.status !== "approved" ? "text-red-600" : "text-muted-foreground"}`}>
                            <Calendar className="h-3 w-3" />
                            {formatDate(project.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
