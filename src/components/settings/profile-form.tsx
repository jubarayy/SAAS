"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineSpinner } from "@/components/shared/loading-spinner";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
});
type FormData = z.infer<typeof schema>;

export function ProfileForm({ user }: { user: { id: string; name: string; email: string } }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    defaultValues: { name: user.name, email: user.email },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Failed to update profile");
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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
