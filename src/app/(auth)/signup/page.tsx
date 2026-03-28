"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineSpinner } from "@/components/shared/loading-spinner";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Suspense } from "react";

const passwordRules = [
  { label: "At least 10 characters", test: (p: string) => p.length >= 10 },
  { label: "1 uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "1 number", test: (p: string) => /[0-9]/.test(p) },
  { label: "1 special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;
  const passed = passwordRules.filter((r) => r.test(password)).length;
  const pct = (passed / passwordRules.length) * 100;
  const color = passed <= 2 ? "bg-destructive" : passed <= 3 ? "bg-yellow-500" : passed <= 4 ? "bg-blue-500" : "bg-green-500";

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-1">
        {passwordRules.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-muted-foreground"}`}>
              {ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(10, "At least 10 characters")
    .regex(/[A-Z]/, "At least 1 uppercase letter")
    .regex(/[a-z]/, "At least 1 lowercase letter")
    .regex(/[0-9]/, "At least 1 number")
    .regex(/[^A-Za-z0-9]/, "At least 1 special character"),
});
type FormData = z.infer<typeof schema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const prefillEmail = searchParams.get("email") || "";

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefillEmail },
  });

  const password = watch("password") || "";

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Failed to create account");
      return;
    }

    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      toast.error("Account created but sign in failed. Please sign in.");
      router.push("/login");
      return;
    }

    toast.success("Account created!");
    if (inviteToken) {
      router.push(`/invite/${inviteToken}`);
    } else {
      router.push("/onboarding");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Start collecting visual feedback in minutes</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Alex Rivera" autoComplete="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@studio.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Min. 10 characters" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          <PasswordStrengthIndicator password={password} />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <InlineSpinner className="mr-2" />}
          Create account
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
