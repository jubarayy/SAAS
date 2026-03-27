"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { InlineSpinner } from "@/components/shared/loading-spinner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  company: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewClientPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email || null,
        company: data.company || null,
        website: data.website || null,
        phone: data.phone || null,
        notes: data.notes || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Failed to create client");
      return;
    }
    toast.success("Client created");
    router.push(`/clients/${json.id}`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to clients
        </Link>
        <PageHeader title="Add client" description="Create a new client to associate projects with" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Client details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="John Smith or Acme Corp" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="client@company.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Company name" {...register("company")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="+1 555 000 0000" {...register("phone")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" placeholder="https://company.com" {...register("website")} />
                {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">Internal notes</Label>
                <Textarea id="notes" placeholder="Notes visible only to your team..." rows={3} {...register("notes")} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <InlineSpinner className="mr-2" />}
                Create client
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/clients">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
