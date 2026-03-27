"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineSpinner } from "@/components/shared/loading-spinner";
import { Send } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "team_member"]),
});
type FormData = z.infer<typeof schema>;

export function InviteTeamForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { role: "team_member" },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Failed to send invitation"); return; }
    toast.success(`Invitation sent to ${data.email}`);
    reset();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Invite team member</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label>Email address</Label>
            <Input type="email" placeholder="colleague@studio.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select onValueChange={(v) => setValue("role", v as "admin" | "team_member")} defaultValue="team_member">
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="team_member">Team member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-6">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <InlineSpinner /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
