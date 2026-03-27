import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function InlineSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} />
  );
}
