"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { InlineSpinner } from "@/components/shared/loading-spinner";
import { Share2, Copy, ExternalLink } from "lucide-react";

const schema = z.object({
  label: z.string().optional(),
  expiresAt: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function CreateReviewLinkDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    const res = await fetch(`/api/projects/${projectId}/review-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: data.label || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Failed to create review link");
      return;
    }
    const url = `${window.location.origin}/review/${json.token}`;
    setCreatedUrl(url);
    router.refresh();
  }

  function handleCopy() {
    if (createdUrl) {
      navigator.clipboard.writeText(createdUrl);
      toast.success("Link copied to clipboard");
    }
  }

  function handleClose() {
    setOpen(false);
    setCreatedUrl(null);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Share2 className="h-4 w-4" />
          Share for review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create review link</DialogTitle>
          <DialogDescription>
            Share this link with your client so they can view deliverables, leave visual feedback, and approve.
          </DialogDescription>
        </DialogHeader>

        {!createdUrl ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Label (optional)</Label>
              <Input placeholder="e.g. Round 2 Review, Final Approval..." {...register("label")} />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry date (optional)</Label>
              <Input type="date" {...register("expiresAt")} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <InlineSpinner className="mr-2" />}
                Create link
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">Review link created</p>
              <p className="text-sm font-mono break-all">{createdUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                Copy link
              </Button>
              <Button variant="outline" asChild>
                <a href={createdUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Preview
                </a>
              </Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
