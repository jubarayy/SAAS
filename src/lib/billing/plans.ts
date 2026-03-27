import type { PlanSlug } from "@prisma/client";

export interface Plan {
  slug: PlanSlug;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: {
    projects: number;       // -1 = unlimited
    clients: number;
    teamMembers: number;
    storageGb: number;
    reviewLinks: number;
  };
  features: string[];
  stripePriceId?: string;
}

export const PLANS: Record<PlanSlug, Plan> = {
  free: {
    slug: "free",
    name: "Free",
    description: "Get started, no credit card required",
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      projects: 3,
      clients: 5,
      teamMembers: 1,
      storageGb: 1,
      reviewLinks: 3,
    },
    features: [
      "3 active projects",
      "5 clients",
      "1 team member",
      "1 GB storage",
      "Visual feedback",
      "Client review portal",
    ],
  },
  starter: {
    slug: "starter",
    name: "Starter",
    description: "For freelancers and solo designers",
    priceMonthly: 29,
    priceYearly: 290,
    limits: {
      projects: 20,
      clients: 25,
      teamMembers: 3,
      storageGb: 20,
      reviewLinks: -1,
    },
    features: [
      "20 active projects",
      "25 clients",
      "3 team members",
      "20 GB storage",
      "Unlimited review links",
      "Version history",
      "Email notifications",
      "Approval audit trail",
    ],
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
  },
  pro: {
    slug: "pro",
    name: "Pro",
    description: "For growing studios and small agencies",
    priceMonthly: 79,
    priceYearly: 790,
    limits: {
      projects: -1,
      clients: -1,
      teamMembers: 10,
      storageGb: 100,
      reviewLinks: -1,
    },
    features: [
      "Unlimited projects",
      "Unlimited clients",
      "10 team members",
      "100 GB storage",
      "Everything in Starter",
      "Custom branding",
      "Priority support",
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  agency: {
    slug: "agency",
    name: "Agency",
    description: "For agencies at scale",
    priceMonthly: 199,
    priceYearly: 1990,
    limits: {
      projects: -1,
      clients: -1,
      teamMembers: -1,
      storageGb: 500,
      reviewLinks: -1,
    },
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "500 GB storage",
      "White-label client portal",
      "SSO (coming soon)",
      "Dedicated support",
    ],
    stripePriceId: process.env.STRIPE_PRICE_AGENCY,
  },
};

export function getPlan(slug: PlanSlug): Plan {
  return PLANS[slug];
}

export function isWithinLimit(
  current: number,
  limit: number
): boolean {
  if (limit === -1) return true;
  return current < limit;
}
