import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, MessageSquare, Share2, Shield, Zap, Users,
  ArrowRight, Star
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Visual feedback, in context",
    description: "Clients click anywhere on your design or live site to leave a pinned comment. No more 'see the red area on the left' emails.",
  },
  {
    icon: Share2,
    title: "One link, zero friction",
    description: "Send clients a secure review link. No account required. They open it, comment, and approve. Done.",
  },
  {
    icon: CheckCircle2,
    title: "Explicit, traceable approvals",
    description: "Every approval is timestamped with who approved, what version, and a checklist confirmation. No more 'I thought you signed off on this'.",
  },
  {
    icon: Zap,
    title: "Centralized feedback triage",
    description: "All comments in one place, sorted by project. Assign, resolve, or ignore items without losing anything in email threads.",
  },
  {
    icon: Users,
    title: "Built for agencies and studios",
    description: "Multi-client workspace, team roles, and version history — everything you need when juggling 10+ active projects.",
  },
  {
    icon: Shield,
    title: "Audit trail included",
    description: "Every action is logged. Know exactly what changed, who approved it, and when. Perfect for client disputes.",
  },
];

const TESTIMONIALS = [
  {
    quote: "We cut our revision cycles from 4 rounds to 1.5 on average. Clients actually understand what they're approving.",
    name: "Maya Hoffman",
    role: "Creative Director, Pixel Studio",
  },
  {
    quote: "The review portal is so simple that even my least tech-savvy client figured it out in 30 seconds.",
    name: "Tom Reyes",
    role: "Freelance Web Designer",
  },
  {
    quote: "Having a signed approval with a timestamp has saved us from scope creep more times than I can count.",
    name: "Jordan Park",
    role: "Founder, Buildwell Agency",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">M</div>
            <span className="font-semibold text-lg">MarkupFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            <Button size="sm" asChild>
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
          <Badge variant="secondary" className="mb-4 text-xs">Visual feedback & design approvals</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
            Stop chasing clients.<br />
            <span className="text-primary">Start getting approvals.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            MarkupFlow lets clients click and comment directly on your websites, designs, and mockups.
            You get clean, traceable approvals. They get a dead-simple review experience.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start free — no credit card required
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Free plan includes 3 projects and 5 clients</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need for a clean approval workflow</h2>
            <p className="mt-3 text-muted-foreground">No bloat. No enterprise nonsense. Just what freelancers and agencies actually need.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-xl border p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-b bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by designers who hate revision hell</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-xl bg-white border p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-gray-700 mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to end revision chaos?</h2>
          <p className="mt-3 text-muted-foreground">Set up your workspace in 2 minutes. Your clients won't need a tutorial.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">M</div>
            <span className="text-sm font-medium">MarkupFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MarkupFlow. Visual feedback and design approvals.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
