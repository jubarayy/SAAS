import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";
import { getPlan, PLANS } from "@/lib/billing/plans";
import { CheckCircle2, ExternalLink, Zap } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { PlanSlug } from "@prisma/client";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) redirect("/onboarding");

  const workspace = membership.workspace;
  const plan = getPlan(workspace.planSlug as PlanSlug);

  const [projectCount, clientCount, memberCount] = await Promise.all([
    prisma.project.count({ where: { workspaceId: workspace.id, isArchived: false } }),
    prisma.client.count({ where: { workspaceId: workspace.id, isArchived: false } }),
    prisma.workspaceMember.count({ where: { workspaceId: workspace.id } }),
  ]);

  const limits = plan.limits;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Billing"
        description="Manage your subscription and plan"
      />

      {/* Current plan */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current plan</CardTitle>
            <Badge variant={workspace.subscriptionStatus === "active" ? "success" : "secondary"} className="capitalize">
              {workspace.subscriptionStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-bold">{plan.name}</p>
              <p className="text-muted-foreground text-sm mt-0.5">{plan.description}</p>
              {workspace.trialEndsAt && workspace.subscriptionStatus === "trialing" && (
                <p className="text-sm text-yellow-600 mt-2">
                  Trial ends {formatDate(workspace.trialEndsAt)}
                </p>
              )}
              {workspace.currentPeriodEndsAt && workspace.subscriptionStatus === "active" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Renews {formatDate(workspace.currentPeriodEndsAt)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {plan.priceMonthly === 0 ? "Free" : `$${plan.priceMonthly}`}
              </p>
              {plan.priceMonthly > 0 && <p className="text-xs text-muted-foreground">per month</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usage this month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Projects", current: projectCount, limit: limits.projects },
            { label: "Clients", current: clientCount, limit: limits.clients },
            { label: "Team members", current: memberCount, limit: limits.teamMembers },
          ].map(({ label, current, limit }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-sm text-muted-foreground">
                  {current} / {limit === -1 ? "∞" : limit}
                </span>
              </div>
              {limit !== -1 && (
                <Progress value={(current / limit) * 100} className="h-1.5" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upgrade */}
      {workspace.planSlug === "free" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {(["starter", "pro", "agency"] as PlanSlug[]).map((slug) => {
            const p = PLANS[slug];
            return (
              <Card key={slug} className={p.slug === "pro" ? "border-primary ring-1 ring-primary" : ""}>
                {p.slug === "pro" && (
                  <div className="bg-primary text-primary-foreground text-xs font-semibold text-center py-1 rounded-t-xl">
                    Most popular
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription>
                    <span className="text-xl font-bold text-foreground">${p.priceMonthly}</span>
                    <span className="text-sm">/mo</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    className="w-full"
                    variant={p.slug === "pro" ? "default" : "outline"}
                    asChild
                  >
                    <Link href={`/api/billing/checkout?plan=${slug}`}>
                      <Zap className="h-3.5 w-3.5" />
                      Upgrade to {p.name}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {workspace.planSlug !== "free" && workspace.stripeCustomerId && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Manage subscription</p>
                <p className="text-xs text-muted-foreground mt-0.5">Update payment method, download invoices, or cancel</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/api/billing/portal">
                  <ExternalLink className="h-4 w-4" />
                  Billing portal
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
