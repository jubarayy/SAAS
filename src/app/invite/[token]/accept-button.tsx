"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InlineSpinner } from "@/components/shared/loading-spinner";

interface Props {
  token: string;
  workspaceSlug: string;
}

export function InviteAcceptButton({ token, workspaceSlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to accept invitation");
        return;
      }
      toast.success("Welcome to the workspace!");
      router.push(`/w/${workspaceSlug}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className="w-full" onClick={handleAccept} disabled={loading}>
      {loading && <InlineSpinner className="mr-2" />}
      Accept invitation
    </Button>
  );
}
