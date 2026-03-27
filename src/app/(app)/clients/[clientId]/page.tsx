import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft, Plus, Building2, Mail, Phone, Globe, FolderOpen, Edit
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { clientId } = await params;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) redirect("/onboarding");

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: membership.workspace.id },
    include: {
      projects: {
        where: { isArchived: false },
        include: {
          _count: { select: { deliverables: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to clients
        </Link>
        <PageHeader
          title={client.name}
          description={client.company || client.email || "Client"}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/clients/${clientId}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/projects/new?clientId=${clientId}`}>
                  <Plus className="h-4 w-4" />
                  New project
                </Link>
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client info */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Contact info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${client.email}`} className="text-primary hover:underline truncate">{client.email}</a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{client.company}</span>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                  {client.website}
                </a>
              </div>
            )}
            {!client.email && !client.phone && !client.company && !client.website && (
              <p className="text-sm text-muted-foreground">No contact info</p>
            )}
            {client.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Internal notes</p>
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                </div>
              </>
            )}
            <Separator />
            <p className="text-xs text-muted-foreground">Client since {formatDate(client.createdAt)}</p>
          </CardContent>
        </Card>

        {/* Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Projects ({client.projects.length})</h3>
            <Button size="sm" asChild>
              <Link href={`/projects/new?clientId=${clientId}`}>
                <Plus className="h-4 w-4" />
                New project
              </Link>
            </Button>
          </div>

          {client.projects.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <Button size="sm" className="mt-3" asChild>
                  <Link href={`/projects/new?clientId=${clientId}`}>Create first project</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {client.projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {project._count.deliverables} deliverable{project._count.deliverables !== 1 ? "s" : ""}
                          {project.dueDate && ` · Due ${formatDate(project.dueDate)}`}
                        </p>
                      </div>
                      <ProjectStatusBadge status={project.status} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
