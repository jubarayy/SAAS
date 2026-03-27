"use client";
import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "group toast",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
    />
  );
}
