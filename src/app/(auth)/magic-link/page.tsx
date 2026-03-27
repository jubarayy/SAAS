"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

function MagicLinkHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid magic link. Please request a new one.");
      return;
    }

    fetch(`/api/magic-link/verify?token=${token}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (!data.email) {
          setStatus("error");
          setMessage(data.error || "Link expired. Please request a new one.");
          return;
        }
        // Sign in with the verified email
        const result = await signIn("credentials", {
          email: data.email,
          password: data.tempPassword,
          redirect: false,
        });
        if (result?.ok) {
          setStatus("success");
          router.push("/dashboard");
        } else {
          setStatus("error");
          setMessage("Authentication failed. Please try again.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-muted-foreground">Signing you in...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
          <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Link invalid or expired</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <a href="/login" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto">
        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold">Signed in!</h2>
      <p className="mt-2 text-sm text-muted-foreground">Redirecting to your dashboard...</p>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MagicLinkHandler />
    </Suspense>
  );
}
