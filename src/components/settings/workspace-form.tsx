"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InlineSpinner } from "@/components/shared/loading-spinner";

const schema = z.object({
  name: z.string().min(2),
  website: z.string().url().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export function WorkspaceForm({ workspace }: { workspace: { id: string; name: string; slug: string; website: string } }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    defaultValues: { name: workspace.name, website: workspace.website },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch(`/api/workspaces/${workspace.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Failed to update workspace"); return; }
    toast.success("Workspace updated");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workspace settings</CardTitle>
        <CardDescription>Workspace slug: <code className="text-xs bg-muted px-1 py-0.5 rounded">{workspace.slug}</code></CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Workspace name</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input type="url" placeholder="https://yourstudio.com" {...register("website")} />
          </div>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <InlineSpinner className="mr-2" />}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
