import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AdminWorkspacesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";

  const workspaces = await prisma.workspace.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    include: {
      members: {
        where: { role: "owner" },
        include: { user: { select: { email: true, name: true } } },
        take: 1,
      },
      _count: {
        select: { projects: true, clients: true, members: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workspaces ({workspaces.length})</h1>
        <form>
          <input
            name="search"
            defaultValue={search}
            placeholder="Search workspaces..."
            className="rounded-md border px-3 py-1.5 text-sm"
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {["Workspace", "Owner", "Plan", "Status", "Members", "Projects", "Created"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {workspaces.map((ws) => (
              <tr key={ws.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{ws.name}</p>
                  <p className="text-xs text-muted-foreground">{ws.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {ws.members[0]?.user.name || ws.members[0]?.user.email || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="capitalize text-xs">{ws.planSlug}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={ws.subscriptionStatus === "active" ? "success" : "secondary"}
                    className="capitalize text-xs"
                  >
                    {ws.subscriptionStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">{ws._count.members}</td>
                <td className="px-4 py-3 text-center">{ws._count.projects}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(ws.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
