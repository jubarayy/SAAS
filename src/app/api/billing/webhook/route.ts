import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import type { PlanSlug, SubscriptionStatus } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId;
        const planSlug = session.metadata?.planSlug as PlanSlug;
        if (!workspaceId || !planSlug) break;

        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            planSlug,
            subscriptionId: session.subscription as string,
            subscriptionStatus: "active",
          },
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const workspace = await prisma.workspace.findFirst({
          where: { stripeCustomerId: sub.customer as string },
        });
        if (!workspace) break;

        await prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            subscriptionStatus: sub.status as SubscriptionStatus,
            currentPeriodEndsAt: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
          },
        });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
  }

  return NextResponse.json({ received: true });
}
