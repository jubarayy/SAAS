import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";

  const users = await prisma.user.findMany({
    where: search ? {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ],
    } : undefined,
    include: {
      workspaceMemberships: {
        include: { workspace: { select: { name: true, slug: true } } },
        take: 2,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users ({users.length})</h1>
        <form>
          <input
            name="search"
            defaultValue={search}
            placeholder="Search users..."
            className="rounded-md border px-3 py-1.5 text-sm"
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {["User", "Workspaces", "Role", "Verified", "Joined"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{user.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {user.workspaceMemberships.map((m) => m.workspace.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  {user.platformRole === "platform_admin" ? (
                    <Badge variant="destructive" className="text-xs">Admin</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">User</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {user.emailVerified ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
