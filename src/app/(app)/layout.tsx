import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Get primary workspace (first one user belongs to)
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) redirect("/onboarding");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          platformRole: session.user.platformRole,
        }}
        workspaceName={membership.workspace.name}
        workspaceSlug={membership.workspace.slug}
        unreadCount={unreadCount}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-6xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
