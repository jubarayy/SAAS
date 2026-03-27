import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FolderOpen, MessageSquare } from "lucide-react";

export default async function AdminPage() {
  const [totalWorkspaces, totalUsers, totalProjects, totalFeedback] = await Promise.all([
    prisma.workspace.count(),
    prisma.user.count(),
    prisma.project.count(),
    prisma.feedbackItem.count(),
  ]);

  const recentWorkspaces = await prisma.workspace.findMany({
    include: {
      members: { where: { role: "owner" }, include: { user: { select: { email: true, name: true } } }, take: 1 },
      _count: { select: { projects: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const stats = [
    { label: "Total workspaces", value: totalWorkspaces, icon: Building2 },
    { label: "Total users", value: totalUsers, icon: Users },
    { label: "Total projects", value: totalProjects, icon: FolderOpen },
    { label: "Total feedback", value: totalFeedback, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent workspaces</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentWorkspaces.map((ws) => (
              <div key={ws.id} className="flex items-center gap-4 px-6 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{ws.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ws.members[0]?.user.email} · {ws.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <p>{ws._count.members} members</p>
                  <p>{ws._count.projects} projects</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  ws.subscriptionStatus === "active" ? "bg-green-100 text-green-700" :
                  ws.subscriptionStatus === "trialing" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {ws.planSlug}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
