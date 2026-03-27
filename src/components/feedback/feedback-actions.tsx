"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle2, EyeOff, User } from "lucide-react";

interface FeedbackActionsProps {
  feedbackId: string;
  currentStatus: string;
  assignedToId: string | null;
  workspaceMembers: Array<{ id: string; name: string | null; email: string }>;
}

export function FeedbackActions({
  feedbackId,
  currentStatus,
  assignedToId,
  workspaceMembers,
}: FeedbackActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Feedback ${status}`);
      router.refresh();
    } catch {
      toast.error("Failed to update feedback");
    } finally {
      setLoading(false);
    }
  }

  async function assign(userId: string | null) {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: userId }),
      });
      if (!res.ok) throw new Error();
      toast.success(userId ? "Assigned" : "Unassigned");
      router.refresh();
    } catch {
      toast.error("Failed to assign");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus !== "resolved" && (
          <DropdownMenuItem onClick={() => updateStatus("resolved")}>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Mark resolved
          </DropdownMenuItem>
        )}
        {currentStatus === "resolved" && (
          <DropdownMenuItem onClick={() => updateStatus("open")}>
            Re-open
          </DropdownMenuItem>
        )}
        {currentStatus !== "ignored" && (
          <DropdownMenuItem onClick={() => updateStatus("ignored")}>
            <EyeOff className="h-4 w-4" />
            Ignore
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
        {workspaceMembers.map((member) => (
          <DropdownMenuItem
            key={member.id}
            onClick={() => assign(member.id)}
            className={assignedToId === member.id ? "bg-muted" : ""}
          >
            <User className="h-4 w-4" />
            {member.name || member.email}
            {assignedToId === member.id && " ✓"}
          </DropdownMenuItem>
        ))}
        {assignedToId && (
          <DropdownMenuItem onClick={() => assign(null)} className="text-muted-foreground">
            Unassign
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
