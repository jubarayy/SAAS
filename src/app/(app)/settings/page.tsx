import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { WorkspaceForm } from "@/components/settings/workspace-form";
import { InviteTeamForm } from "@/components/settings/invite-team-form";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          },
          invitations: {
            where: { acceptedAt: null, expiresAt: { gt: new Date() } },
          },
        },
      },
      user: true,
    },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) redirect("/onboarding");

  const isOwnerOrAdmin = ["owner", "admin"].includes(membership.role);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isOwnerOrAdmin && <TabsTrigger value="workspace">Workspace</TabsTrigger>}
          {isOwnerOrAdmin && <TabsTrigger value="team">Team</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileForm
            user={{
              id: session.user.id,
              name: session.user.name || "",
              email: session.user.email,
            }}
          />
        </TabsContent>

        {isOwnerOrAdmin && (
          <TabsContent value="workspace" className="mt-4">
            <WorkspaceForm
              workspace={{
                id: membership.workspace.id,
                name: membership.workspace.name,
                slug: membership.workspace.slug,
                website: membership.workspace.website || "",
              }}
            />
          </TabsContent>
        )}

        {isOwnerOrAdmin && (
          <TabsContent value="team" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team members ({membership.workspace.members.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {membership.workspace.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 px-6 py-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{member.user.name || member.user.email}</p>
                        {member.user.name && <p className="text-xs text-muted-foreground">{member.user.email}</p>}
                      </div>
                      <Badge variant="secondary" className="capitalize text-xs">{member.role.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <InviteTeamForm workspaceId={membership.workspace.id} />

            {membership.workspace.invitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pending invitations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {membership.workspace.invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 px-6 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">{inv.email}</p>
                          <p className="text-xs text-muted-foreground">Expires {formatDate(inv.expiresAt)}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">{inv.role.replace(/_/g, " ")}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
