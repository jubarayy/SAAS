import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", req.url));

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership?.workspace.stripeCustomerId) {
    return NextResponse.redirect(new URL("/billing", req.url));
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: membership.workspace.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return NextResponse.redirect(portalSession.url);
}
