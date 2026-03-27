import { Badge } from "@/components/ui/badge";
import type { ProjectStatus, DeliverableStatus, FeedbackStatus } from "@prisma/client";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const map: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
    draft: { label: "Draft", variant: "secondary" },
    active: { label: "Active", variant: "info" },
    in_review: { label: "In Review", variant: "warning" },
    changes_requested: { label: "Changes Requested", variant: "destructive" },
    approved: { label: "Approved", variant: "success" },
    archived: { label: "Archived", variant: "outline" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function DeliverableStatusBadge({ status }: { status: DeliverableStatus }) {
  const map: Record<DeliverableStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
    pending_review: { label: "Pending Review", variant: "secondary" },
    in_review: { label: "In Review", variant: "warning" },
    changes_requested: { label: "Changes Requested", variant: "destructive" },
    approved: { label: "Approved", variant: "success" },
    archived: { label: "Archived", variant: "outline" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  const map: Record<FeedbackStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
    open: { label: "Open", variant: "warning" },
    resolved: { label: "Resolved", variant: "success" },
    ignored: { label: "Ignored", variant: "secondary" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
