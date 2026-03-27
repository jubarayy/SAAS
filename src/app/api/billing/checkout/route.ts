import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import Stripe from "stripe";
import { PLANS } from "@/lib/billing/plans";
import type { PlanSlug } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", req.url));

  const planSlug = req.nextUrl.searchParams.get("plan") as PlanSlug;
  const plan = PLANS[planSlug];
  if (!plan?.stripePriceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return NextResponse.redirect(new URL("/onboarding", req.url));

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  // Get or create Stripe customer
  let customerId = membership.workspace.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email,
      name: membership.workspace.name,
      metadata: { workspaceId: membership.workspace.id },
    });
    customerId = customer.id;
    await prisma.workspace.update({
      where: { id: membership.workspace.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    metadata: { workspaceId: membership.workspace.id, planSlug },
  });

  return NextResponse.redirect(checkoutSession.url!);
}
