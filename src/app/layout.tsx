import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "MarkupFlow — Visual Feedback & Design Approval",
    template: "%s | MarkupFlow",
  },
  description:
    "Collect visual client feedback on websites and designs. Centralize approvals, reduce revision chaos, and keep a clean sign-off trail.",
  keywords: ["visual feedback", "design approval", "client feedback", "website review", "design review"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <Providers>
          {children}
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
