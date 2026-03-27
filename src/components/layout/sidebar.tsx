"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FolderOpen, Bell, Settings,
  ChevronDown, LogOut, CreditCard, Shield, Layers
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/feedback", label: "Feedback", icon: Layers },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

interface SidebarProps {
  user: { id: string; name?: string | null; email: string; image?: string | null; platformRole?: string };
  workspaceName: string;
  workspaceSlug: string;
  unreadCount?: number;
}

export function Sidebar({ user, workspaceName, workspaceSlug, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-sidebar">
      {/* Logo + Workspace */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">M</div>
          <span className="font-semibold text-sm text-foreground">MarkupFlow</span>
        </Link>
      </div>

      {/* Workspace selector */}
      <div className="border-b px-3 py-2">
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-xs font-semibold shrink-0">
            {getInitials(workspaceName)}
          </div>
          <span className="flex-1 text-left font-medium text-sm truncate">{workspaceName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Settings */}
        <div className="mt-4 border-t pt-4">
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/settings")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                Settings
              </Link>
            </li>
            <li>
              <Link
                href="/billing"
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/billing")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <CreditCard className="h-4 w-4 shrink-0" />
                Billing
              </Link>
            </li>
            {user.platformRole === "platform_admin" && (
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* User menu */}
      <div className="border-t px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-accent transition-colors">
              <Avatar className="h-7 w-7">
                {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
                <AvatarFallback className="text-xs">{getInitials(user.name || user.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-medium truncate">{user.name || user.email}</p>
                {user.name && <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
