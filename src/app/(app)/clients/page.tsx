import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { Users, Plus, Building2, Mail, ExternalLink } from "lucide-react";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; archived?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const search = params.search || "";
  const showArchived = params.archived === "true";

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) redirect("/onboarding");

  const clients = await prisma.client.findMany({
    where: {
      workspaceId: membership.workspace.id,
      isArchived: showArchived,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      _count: { select: { projects: { where: { isArchived: false } } } },
      projects: {
        where: { isArchived: false },
        select: { status: true },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description={`${clients.length} ${showArchived ? "archived" : "active"} client${clients.length !== 1 ? "s" : ""}`}
        actions={
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="h-4 w-4" />
              Add client
            </Link>
          </Button>
        }
      />

      {/* Search + filter */}
      <div className="flex gap-3">
        <form className="flex-1 max-w-sm">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search clients..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </form>
        <Link href={`/clients?archived=${showArchived ? "false" : "true"}`}>
          <Button variant="outline" size="sm">
            {showArchived ? "Active clients" : "Archived"}
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No clients found" : "No clients yet"}
          description={search ? "Try a different search term" : "Add your first client to start managing projects"}
          action={
            !search && (
              <Button asChild>
                <Link href="/clients/new"><Plus className="h-4 w-4" />Add client</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const activeProjects = client.projects.filter(
              (p) => !["approved", "archived"].includes(p.status)
            ).length;
            return (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{client.name}</p>
                        {client.company && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3" />
                            {client.company}
                          </p>
                        )}
                        {client.email && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {client._count.projects} project{client._count.projects !== 1 ? "s" : ""}
                      </span>
                      {activeProjects > 0 && (
                        <Badge variant="info" className="text-xs">
                          {activeProjects} active
                        </Badge>
                      )}
                    </div>
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
