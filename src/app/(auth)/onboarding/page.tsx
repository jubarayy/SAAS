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
import { InlineSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";

const steps = ["workspace", "first-client", "done"] as const;
type Step = typeof steps[number];

const workspaceSchema = z.object({
  workspaceName: z.string().min(2, "Name must be at least 2 characters"),
});

const clientSchema = z.object({
  clientName: z.string().min(2, "Client name required"),
  clientEmail: z.string().email().optional().or(z.literal("")),
  projectName: z.string().min(2, "Project name required"),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;
type ClientFormData = z.infer<typeof clientSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("workspace");
  const [workspaceSlug, setWorkspaceSlug] = useState("");

  const workspaceForm = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
  });

  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  async function handleWorkspace(data: WorkspaceFormData) {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.workspaceName }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Failed to create workspace");
      return;
    }
    setWorkspaceSlug(json.slug);
    setStep("first-client");
  }

  async function handleClient(data: ClientFormData) {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.clientName,
        email: data.clientEmail || null,
        projectName: data.projectName,
      }),
    });
    if (!res.ok) {
      toast.error("Failed to create client");
      return;
    }
    setStep("done");
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  const stepIndex = steps.indexOf(step);

  return (
    <div className="w-full max-w-md mx-auto py-12 px-4">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          {steps.slice(0, -1).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                i < stepIndex ? "bg-primary text-primary-foreground" :
                i === stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {i < stepIndex ? "✓" : i + 1}
              </div>
              {i < steps.length - 2 && (
                <div className={cn("h-0.5 w-12", i < stepIndex ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>
      </div>

      {step === "workspace" && (
        <div>
          <h1 className="text-2xl font-bold">Name your workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">This is your studio or freelance business name</p>
          <form onSubmit={workspaceForm.handleSubmit(handleWorkspace)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="workspaceName">Workspace name</Label>
              <Input
                id="workspaceName"
                placeholder="e.g. Rivera Studio, Pixel & Co."
                {...workspaceForm.register("workspaceName")}
              />
              {workspaceForm.formState.errors.workspaceName && (
                <p className="text-xs text-destructive">{workspaceForm.formState.errors.workspaceName.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={workspaceForm.formState.isSubmitting}>
              {workspaceForm.formState.isSubmitting && <InlineSpinner className="mr-2" />}
              Continue
            </Button>
          </form>
        </div>
      )}

      {step === "first-client" && (
        <div>
          <h1 className="text-2xl font-bold">Add your first client</h1>
          <p className="mt-1 text-sm text-muted-foreground">Let's set up a client and your first project</p>
          <form onSubmit={clientForm.handleSubmit(handleClient)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="clientName">Client name</Label>
              <Input id="clientName" placeholder="e.g. Acme Corp or John Smith" {...clientForm.register("clientName")} />
              {clientForm.formState.errors.clientName && (
                <p className="text-xs text-destructive">{clientForm.formState.errors.clientName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientEmail">Client email <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="clientEmail" type="email" placeholder="client@company.com" {...clientForm.register("clientEmail")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="projectName">First project name</Label>
              <Input id="projectName" placeholder="e.g. Website Redesign, Landing Page" {...clientForm.register("projectName")} />
              {clientForm.formState.errors.projectName && (
                <p className="text-xs text-destructive">{clientForm.formState.errors.projectName.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={clientForm.formState.isSubmitting}>
              {clientForm.formState.isSubmitting && <InlineSpinner className="mr-2" />}
              Create project
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => router.push("/dashboard")}>
              Skip for now
            </Button>
          </form>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">You're all set!</h2>
          <p className="mt-2 text-muted-foreground">Taking you to your dashboard...</p>
        </div>
      )}
    </div>
  );
}
