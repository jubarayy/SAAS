"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { InlineSpinner } from "@/components/shared/loading-spinner";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  clientId: z.string().min(1, "Client is required"),
  name: z.string().min(1, "Project name is required").max(200),
  description: z.string().optional(),
  type: z.enum(["website", "landing_page", "web_app", "mobile_app", "design_mockup", "branding", "other"]),
  dueDate: z.string().optional(),
  internalNote: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function NewProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Array<{ id: string; name: string; company: string | null }>>([]);

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients).catch(() => {});
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: searchParams.get("clientId") || "",
      type: "website",
    },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Failed to create project");
      return;
    }
    toast.success("Project created");
    router.push(`/projects/${json.id}`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>
        <PageHeader title="New project" description="Set up a project to share with your client for review" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Project details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select onValueChange={(v) => setValue("clientId", v)} defaultValue={searchParams.get("clientId") || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.company ? ` — ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
              <Link href="/clients/new" className="text-xs text-primary hover:underline">+ Add new client</Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Project name *</Label>
                <Input id="name" placeholder="Website Redesign, Landing Page V2..." {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Project type</Label>
                <Select onValueChange={(v) => setValue("type", v as FormData["type"])} defaultValue="website">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="landing_page">Landing Page</SelectItem>
                    <SelectItem value="web_app">Web App</SelectItem>
                    <SelectItem value="mobile_app">Mobile App</SelectItem>
                    <SelectItem value="design_mockup">Design Mockup</SelectItem>
                    <SelectItem value="branding">Branding</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" type="date" {...register("dueDate")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Brief description of the project..." rows={3} {...register("description")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="internalNote">Internal notes</Label>
                <Textarea id="internalNote" placeholder="Private notes for your team only..." rows={2} {...register("internalNote")} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <InlineSpinner className="mr-2" />}
                Create project
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/projects">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense>
      <NewProjectForm />
    </Suspense>
  );
}
