"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAll() {
    setLoading(true);
    await fetch("/api/notifications", { method: "PATCH" });
    toast.success("All notifications marked as read");
    router.refresh();
    setLoading(false);
  }

  return (
    <Button size="sm" variant="outline" onClick={markAll} disabled={loading}>
      <CheckCheck className="h-4 w-4" />
      Mark all read
    </Button>
  );
}
