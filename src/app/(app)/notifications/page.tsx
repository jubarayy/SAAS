import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import { Bell, CheckCheck, MessageSquare, CheckCircle2, UserPlus } from "lucide-react";
import { MarkAllReadButton } from "@/components/notifications/mark-read-button";
import { NotificationType } from "@prisma/client";

const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  feedback_created: MessageSquare,
  feedback_resolved: CheckCircle2,
  deliverable_approved: CheckCircle2,
  project_approved: CheckCircle2,
  review_requested: Bell,
  reminder_sent: Bell,
  member_invited: UserPlus,
  member_joined: UserPlus,
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) redirect("/onboarding");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, workspaceId: membership.workspace.id },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        actions={
          unreadCount > 0 && <MarkAllReadButton />
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll receive notifications when clients leave feedback, approve projects, or when team members are invited."
        />
      ) : (
        <div className="space-y-1">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
            return (
              <Card
                key={notification.id}
                className={notification.isRead ? "opacity-60" : ""}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                    notification.isRead ? "bg-muted" : "bg-primary/10"
                  }`}>
                    <Icon className={`h-4 w-4 ${notification.isRead ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {notification.body && (
                      <p className="text-sm text-muted-foreground mt-0.5">{notification.body}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(notification.createdAt)}</span>
                      {notification.actionUrl && (
                        <Link href={notification.actionUrl} className="text-xs text-primary hover:underline">
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
