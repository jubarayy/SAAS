import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function getWorkspaceForRequest() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401, workspace: null, userId: null };

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) return { error: "No workspace", status: 404, workspace: null, userId: null };

  return { workspace: membership.workspace, userId: session.user.id, member: membership, error: null, status: 200 };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
