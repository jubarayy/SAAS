import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { markNotificationsRead } from "@/lib/notifications";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });

  const notifications = await prisma.notification.findMany({
    where: { userId: userId!, workspaceId: workspace!.id },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const { userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });

  const body = await req.json().catch(() => ({}));
  await markNotificationsRead(userId!, body.ids);
  return NextResponse.json({ success: true });
}
