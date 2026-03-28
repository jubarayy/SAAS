import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { InviteAcceptButton } from "./accept-button";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
  });

  if (!invitation) notFound();

  if (invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Invitation expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {invitation.acceptedAt
            ? "This invitation has already been accepted."
            : "This invitation has expired. Please ask for a new one."}
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  const session = await auth();

  return (
    <Suspense>
      <div className="mx-auto max-w-md text-center">
        {invitation.workspace.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={invitation.workspace.logoUrl}
            alt={invitation.workspace.name}
            className="mx-auto mb-4 h-16 w-16 rounded-xl object-cover"
          />
        )}
        <h1 className="text-2xl font-bold">You&apos;re invited!</h1>
        <p className="mt-2 text-muted-foreground">
          You&apos;ve been invited to join{" "}
          <span className="font-semibold text-foreground">{invitation.workspace.name}</span>{" "}
          as a <span className="font-semibold text-foreground">{invitation.role.replace("_", " ")}</span>.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Invitation sent to <strong>{invitation.email}</strong>
        </p>

        <div className="mt-8">
          {session?.user ? (
            session.user.email?.toLowerCase() === invitation.email.toLowerCase() ? (
              <InviteAcceptButton token={token} workspaceSlug={invitation.workspace.slug} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-destructive">
                  You are signed in as <strong>{session.user.email}</strong>, but this invitation
                  was sent to <strong>{invitation.email}</strong>.
                </p>
                <p className="text-xs text-muted-foreground">
                  Please sign in with the correct account to accept this invitation.
                </p>
                <Button asChild variant="outline">
                  <Link href={`/login?invite=${token}`}>Sign in with correct account</Link>
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href={`/login?invite=${token}`}>Sign in to accept</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/signup?invite=${token}&email=${encodeURIComponent(invitation.email)}`}>
                  Create account
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}
