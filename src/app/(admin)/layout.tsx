import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Users, Building2, Activity, Settings, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.platformRole !== "platform_admin") redirect("/dashboard");

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex h-full w-52 flex-col border-r bg-slate-900 text-slate-100">
        <div className="flex h-14 items-center gap-2 border-b border-slate-700 px-4">
          <Shield className="h-5 w-5 text-red-400" />
          <span className="font-semibold text-sm">Platform Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: "/admin", label: "Overview", icon: Activity },
            { href: "/admin/workspaces", label: "Workspaces", icon: Building2 },
            { href: "/admin/users", label: "Users", icon: Users },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-3">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors">
            Back to app
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
