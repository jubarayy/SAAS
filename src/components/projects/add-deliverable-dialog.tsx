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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InlineSpinner } from "@/components/shared/loading-spinner";
import { Plus } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["url", "figma", "loom", "other_link", "file"]),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const TYPE_LABELS: Record<string, string> = {
  url: "Website / Staging URL",
  figma: "Figma Link",
  loom: "Loom Video",
  other_link: "Other Link",
  file: "File (coming soon)",
};

export function AddDeliverableDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "url" },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch(`/api/projects/${projectId}/deliverables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Failed to add deliverable");
      return;
    }
    toast.success("Deliverable added");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add deliverable
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add deliverable</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input placeholder="Homepage, Figma Design, v2 Mockup..." {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select onValueChange={(v) => setValue("type", v as FormData["type"])} defaultValue="url">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} disabled={value === "file"}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>URL</Label>
            <Input type="url" placeholder="https://..." {...register("url")} />
            {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea placeholder="Any notes about this deliverable..." rows={2} {...register("notes")} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <InlineSpinner className="mr-2" />}
              Add deliverable
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
