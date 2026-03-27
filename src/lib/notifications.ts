import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationOptions {
  workspaceId: string;
  userId: string;
  projectId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  actionUrl?: string;
}

export async function createNotification(options: CreateNotificationOptions) {
  return prisma.notification.create({ data: options });
}

export async function createNotificationForWorkspaceMembers(
  workspaceId: string,
  excludeUserId: string | undefined,
  notification: Omit<CreateNotificationOptions, "workspaceId" | "userId">
) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });

  const userIds = members
    .map((m) => m.userId)
    .filter((id) => id !== excludeUserId);

  if (userIds.length === 0) return;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      workspaceId,
      userId,
      ...notification,
    })),
  });
}

export async function markNotificationsRead(
  userId: string,
  notificationIds?: string[]
) {
  return prisma.notification.updateMany({
    where: {
      userId,
      ...(notificationIds ? { id: { in: notificationIds } } : {}),
    },
    data: { isRead: true },
  });
}
