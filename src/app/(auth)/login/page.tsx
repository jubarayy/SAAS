"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineSpinner } from "@/components/shared/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  link_expired: "This magic link has expired. Please request a new one.",
  link_already_used: "This magic link has already been used. Please request a new one.",
  invalid_link: "This magic link is invalid. Please request a new one.",
  missing_token: "No token found in the link. Please request a new one.",
  CredentialsSignin: "Invalid email or password.",
};

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const errorCode = searchParams.get("error") || "";
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? "An error occurred. Please try again.") : "";
  const inviteToken = searchParams.get("invite");
  const next = searchParams.get("next") || (inviteToken ? `/invite/${inviteToken}` : "/dashboard");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password");
      return;
    }
    router.push(next);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!magicLinkEmail) return;
    setMagicLoading(true);
    try {
      const res = await fetch("/api/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: magicLinkEmail }),
      });
      if (res.ok) {
        setMagicLinkSent(true);
      } else {
        toast.error("Failed to send magic link");
      }
    } finally {
      setMagicLoading(false);
    }
  }

  if (magicLinkSent) {
    return (
      <div className="text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
          <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a sign-in link to <strong>{magicLinkEmail}</strong>. It expires in 15 minutes.
        </p>
        <Button variant="ghost" className="mt-4" onClick={() => setMagicLinkSent(false)}>
          Try a different email
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back to MarkupFlow</p>

      {errorMessage && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@studio.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <InlineSpinner className="mr-2" />}
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleMagicLink} className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">Sign in with a magic link</p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="you@studio.com"
            value={magicLinkEmail}
            onChange={(e) => setMagicLinkEmail(e.target.value)}
          />
          <Button type="submit" variant="outline" disabled={magicLoading}>
            {magicLoading ? <InlineSpinner /> : "Send"}
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
