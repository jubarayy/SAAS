import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { PLANS } from "@/lib/billing/plans";
import type { PlanSlug } from "@prisma/client";

const PLAN_ORDER: PlanSlug[] = ["free", "starter", "pro", "agency"];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">M</div>
            <span className="font-semibold">MarkupFlow</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            <Button size="sm" asChild><Link href="/signup">Start free</Link></Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">Simple, predictable pricing</h1>
          <p className="mt-3 text-muted-foreground">Start free. Scale when you need to. No hidden fees.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((slug) => {
            const plan = PLANS[slug];
            const isPopular = slug === "pro";
            return (
              <div
                key={slug}
                className={`rounded-xl border p-6 flex flex-col ${isPopular ? "border-primary ring-2 ring-primary relative" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="font-bold text-lg">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  <div className="mt-4 mb-6">
                    <span className="text-3xl font-bold">
                      {plan.priceMonthly === 0 ? "Free" : `$${plan.priceMonthly}`}
                    </span>
                    {plan.priceMonthly > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  className="mt-6 w-full"
                  variant={isPopular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/signup">
                    {plan.priceMonthly === 0 ? "Start free" : "Get started"}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-xl bg-muted/50 border p-8 text-center">
          <h3 className="text-xl font-bold">All plans include</h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {[
              "Visual feedback with pinned comments",
              "Secure client review portal",
              "Explicit approval with checklist",
              "Complete audit trail",
              "Version history for deliverables",
              "In-app notifications",
              "Email notifications",
              "99.9% uptime SLA",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Questions? <a href="mailto:hello@markupflow.com" className="text-primary hover:underline">Contact us</a>
        </p>
      </div>
    </div>
  );
}
