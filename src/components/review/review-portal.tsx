"use client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FeedbackStatusBadge } from "@/components/shared/status-badge";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import { MessageSquare, CheckCircle2, X, Send, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface ReviewPortalProps {
  reviewLink: {
    id: string;
    label: string | null;
    requiresEmail: boolean;
    project: {
      id: string;
      name: string;
      description: string | null;
      client: { name: string };
      deliverables: Array<{
        id: string;
        name: string;
        type: string;
        status: string;
        versions: Array<{ url: string | null; versionNumber: number }>;
        feedback: Array<{
          id: string;
          posX: number | null;
          posY: number | null;
          status: string;
          clientName: string | null;
          createdAt: string | Date;
          comments: Array<{
            id: string;
            content: string;
            clientName: string | null;
            isInternal: boolean;
            createdAt: string | Date;
            user: { name: string | null; avatarUrl: string | null } | null;
          }>;
        }>;
      }>;
    };
    approvals: Array<{ action: string; clientName: string | null; createdAt: string | Date }>;
  };
  token: string;
}

const APPROVAL_CHECKLIST = [
  "I have reviewed all deliverables",
  "The work meets the agreed requirements",
  "I am authorizing the final version",
];

export function ReviewPortal({ reviewLink, token }: ReviewPortalProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [identified, setIdentified] = useState(false);

  const [selectedDeliverable, setSelectedDeliverable] = useState(
    reviewLink.project.deliverables[0] || null
  );
  const [pendingFeedback, setPendingFeedback] = useState<{ x: number; y: number } | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approved" | "changes_requested">("approved");
  const [approvalNote, setApprovalNote] = useState("");
  const [checklist, setChecklist] = useState<boolean[]>(APPROVAL_CHECKLIST.map(() => false));
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [approvalDone, setApprovalDone] = useState(false);
  const [approvalResult, setApprovalResult] = useState<string | null>(null);

  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  const imageRef = useRef<HTMLDivElement>(null);

  const latestVersion = selectedDeliverable?.versions[0];
  const isApproved = reviewLink.approvals[0]?.action === "approved";

  function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setIdentified(true);
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!identified) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingFeedback({ x, y });
    setNewComment("");
  }

  async function submitFeedback() {
    if (!newComment.trim() || !pendingFeedback || !selectedDeliverable) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverableId: selectedDeliverable.id,
          reviewLinkId: reviewLink.id,
          posX: pendingFeedback.x,
          posY: pendingFeedback.y,
          pageUrl: latestVersion?.url,
          content: newComment,
          clientName,
          clientEmail: clientEmail || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Feedback submitted");
      setPendingFeedback(null);
      setNewComment("");
      // Refresh page to show new feedback
      window.location.reload();
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  async function submitReply(feedbackId: string) {
    const content = replyContent[feedbackId];
    if (!content?.trim()) return;
    setSubmittingReply(feedbackId);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, clientName, clientEmail: clientEmail || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Reply sent");
      setReplyContent((prev) => ({ ...prev, [feedbackId]: "" }));
      window.location.reload();
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSubmittingReply(null);
    }
  }

  async function submitApproval() {
    if (approvalAction === "approved" && !checklist.every(Boolean)) {
      toast.error("Please confirm all checklist items before approving");
      return;
    }
    setSubmittingApproval(true);
    try {
      const res = await fetch(`/api/review/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: approvalAction,
          clientName,
          clientEmail: clientEmail || null,
          note: approvalNote || null,
          checklistData: APPROVAL_CHECKLIST.map((label, i) => ({ label, checked: checklist[i] })),
        }),
      });
      if (!res.ok) throw new Error();
      setApprovalDone(true);
      setApprovalResult(approvalAction);
      setShowApprovalDialog(false);
      toast.success(approvalAction === "approved" ? "Project approved!" : "Changes requested sent");
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmittingApproval(false);
    }
  }

  // Identify screen
  if (!identified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg mx-auto mb-3">M</div>
            <h1 className="text-xl font-bold">Review: {reviewLink.project.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Shared by your team</p>
          </div>
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="font-semibold mb-4">Who are you?</h2>
            <form onSubmit={handleIdentify} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Your name *</Label>
                <Input
                  placeholder="Your full name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">View project</Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold shrink-0">M</div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{reviewLink.project.name}</p>
              <p className="text-xs text-muted-foreground">{reviewLink.label || "Review"}</p>
            </div>
          </div>

          {approvalDone ? (
            <div className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium",
              approvalResult === "approved" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            )}>
              <CheckCircle2 className="h-4 w-4" />
              {approvalResult === "approved" ? "Approved" : "Changes requested"}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => { setApprovalAction("changes_requested"); setShowApprovalDialog(true); }}
              >
                Request changes
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => { setApprovalAction("approved"); setShowApprovalDialog(true); }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 grid gap-6 lg:grid-cols-4">
        {/* Deliverable list */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">
            Deliverables ({reviewLink.project.deliverables.length})
          </p>
          {reviewLink.project.deliverables.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDeliverable(d)}
              className={cn(
                "w-full text-left rounded-lg border p-3 transition-colors text-sm",
                selectedDeliverable?.id === d.id
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-white hover:border-border"
              )}
            >
              <p className="font-medium truncate">{d.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground capitalize">{d.type.replace(/_/g, " ")}</span>
                {d.feedback.length > 0 && (
                  <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                    <MessageSquare className="h-3 w-3" />
                    {d.feedback.length}
                  </span>
                )}
              </div>
            </button>
          ))}

          {/* Instructions */}
          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs font-medium text-blue-700 mb-1">How to leave feedback</p>
            <p className="text-xs text-blue-600">Click anywhere on the preview to add a comment at that exact spot.</p>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          {selectedDeliverable && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selectedDeliverable.name}</h2>
                  {latestVersion?.url && (
                    <a
                      href={latestVersion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in new tab
                    </a>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  v{latestVersion?.versionNumber || 1}
                </Badge>
              </div>

              {/* Visual feedback area */}
              <div
                ref={imageRef}
                className="relative bg-white border-2 border-dashed border-border rounded-xl overflow-hidden cursor-crosshair min-h-[300px]"
                onClick={handleImageClick}
                style={{ minHeight: "350px" }}
              >
                {latestVersion?.url &&
                  (selectedDeliverable.type === "figma" ||
                    selectedDeliverable.type === "url" ||
                    selectedDeliverable.type === "other_link") ? (
                  <iframe
                    src={latestVersion.url}
                    className="w-full h-full pointer-events-none"
                    style={{ height: "600px" }}
                    sandbox="allow-scripts allow-same-origin"
                    title={selectedDeliverable.name}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <ExternalLink className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Preview not available</p>
                    {latestVersion?.url && (
                      <a href={latestVersion.url} target="_blank" rel="noopener noreferrer" className="mt-2 text-sm text-primary hover:underline">
                        Open {selectedDeliverable.name}
                      </a>
                    )}
                  </div>
                )}

                {/* Existing feedback pins */}
                {selectedDeliverable.feedback.map((fb, i) =>
                  fb.posX != null && fb.posY != null ? (
                    <button
                      key={fb.id}
                      className={cn(
                        "absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold text-white shadow-md transition-transform hover:scale-110",
                        fb.status === "resolved" ? "bg-green-500" : "bg-primary"
                      )}
                      style={{ left: `${fb.posX}%`, top: `${fb.posY}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedFeedback(expandedFeedback === fb.id ? null : fb.id);
                      }}
                    >
                      {i + 1}
                    </button>
                  ) : null
                )}

                {/* Pending feedback pin */}
                {pendingFeedback && (
                  <div
                    className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white shadow-md animate-pulse"
                    style={{ left: `${pendingFeedback.x}%`, top: `${pendingFeedback.y}%` }}
                  />
                )}
              </div>

              {/* Pending feedback form */}
              {pendingFeedback && (
                <div className="rounded-lg border bg-white p-4 space-y-3">
                  <p className="text-sm font-medium">Add your comment</p>
                  <Textarea
                    placeholder="What's your feedback at this spot?"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={submitFeedback} disabled={!newComment.trim() || submittingFeedback} size="sm">
                      <Send className="h-3.5 w-3.5" />
                      Submit comment
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingFeedback(null)}>
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Feedback thread list */}
              {selectedDeliverable.feedback.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {selectedDeliverable.feedback.length} comment{selectedDeliverable.feedback.length !== 1 ? "s" : ""}
                  </p>
                  {selectedDeliverable.feedback.map((fb, i) => (
                    <div key={fb.id} className="rounded-lg border bg-white overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedFeedback(expandedFeedback === fb.id ? null : fb.id)}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{fb.comments[0]?.content?.slice(0, 80) || "Feedback"}</p>
                          <p className="text-xs text-muted-foreground">
                            {fb.clientName || "Anonymous"} · {fb.comments.length} reply{fb.comments.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <FeedbackStatusBadge status={fb.status as "open" | "resolved" | "ignored"} />
                        {expandedFeedback === fb.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>

                      {expandedFeedback === fb.id && (
                        <div className="border-t divide-y">
                          {fb.comments.map((comment) => (
                            <div key={comment.id} className="p-3 flex gap-2">
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                                {getInitials(comment.user?.name || comment.clientName || "?")}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium">{comment.user?.name || comment.clientName || "Anonymous"}</p>
                                <p className="text-sm mt-0.5">{comment.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(comment.createdAt)}</p>
                              </div>
                            </div>
                          ))}
                          {/* Reply form */}
                          <div className="p-3 flex gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                              {getInitials(clientName)}
                            </div>
                            <div className="flex-1 flex gap-2">
                              <Textarea
                                placeholder="Reply..."
                                value={replyContent[fb.id] || ""}
                                onChange={(e) => setReplyContent((prev) => ({ ...prev, [fb.id]: e.target.value }))}
                                rows={1}
                                className="resize-none"
                              />
                              <Button
                                size="icon"
                                className="shrink-0 h-9 w-9"
                                disabled={!replyContent[fb.id]?.trim() || submittingReply === fb.id}
                                onClick={() => submitReply(fb.id)}
                              >
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Approval dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approved" ? "Approve project" : "Request changes"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approved"
                ? "Your approval is final and will be recorded with a timestamp."
                : "Let the team know what needs to change."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {approvalAction === "approved" && (
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <p className="text-sm font-medium">Please confirm:</p>
                {APPROVAL_CHECKLIST.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Checkbox
                      id={`check-${i}`}
                      checked={checklist[i]}
                      onCheckedChange={(v) => {
                        const next = [...checklist];
                        next[i] = !!v;
                        setChecklist(next);
                      }}
                    />
                    <Label htmlFor={`check-${i}`} className="text-sm font-normal cursor-pointer">{item}</Label>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="approval-note">
                {approvalAction === "approved" ? "Message (optional)" : "What needs to change? *"}
              </Label>
              <Textarea
                id="approval-note"
                placeholder={approvalAction === "approved" ? "Any final comments..." : "Describe the changes needed..."}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className={cn(
                  "flex-1",
                  approvalAction === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-orange-600 hover:bg-orange-700"
                )}
                onClick={submitApproval}
                disabled={
                  submittingApproval ||
                  (approvalAction === "approved" && !checklist.every(Boolean)) ||
                  (approvalAction === "changes_requested" && !approvalNote.trim())
                }
              >
                {approvalAction === "approved" ? "Confirm approval" : "Send feedback"}
              </Button>
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
