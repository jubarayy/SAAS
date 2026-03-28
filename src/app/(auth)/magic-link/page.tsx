"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

function MagicLinkHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      window.location.href = "/login?error=missing_token";
      return;
    }
    // Redirect the browser directly to the verify endpoint so it can set the session cookie
    window.location.href = `/api/magic-link/verify?token=${encodeURIComponent(token)}`;
  }, [searchParams]);

  return (
    <div className="text-center">
      <LoadingSpinner />
      <p className="mt-4 text-sm text-muted-foreground">Signing you in...</p>
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
