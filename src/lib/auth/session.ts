import { auth } from "./config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import type { WorkspaceRole } from "@prisma/client";

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function requireWorkspaceAccess(
  workspaceSlug: string,
  minRole?: WorkspaceRole
) {
  const session = await requireAuth();

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!workspace) {
    redirect("/dashboard");
  }

  const member = workspace.members[0];
  if (!member) {
    redirect("/dashboard");
  }

  // Check minimum role if required
  if (minRole) {
    const roleHierarchy: Record<WorkspaceRole, number> = {
      owner: 3,
      admin: 2,
      team_member: 1,
    };
    if (roleHierarchy[member.role] < roleHierarchy[minRole]) {
      redirect(`/w/${workspaceSlug}`);
    }
  }

  return { session, workspace, member };
}

export async function requirePlatformAdmin() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (user?.platformRole !== "platform_admin") {
    redirect("/dashboard");
  }
  return session;
}

export async function getUserWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        where: { userId },
        select: { role: true },
      },
      _count: {
        select: { projects: true, clients: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
