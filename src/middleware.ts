import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/magic-link", "/pricing", "/review"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user;

  // Allow review portal without auth
  if (pathname.startsWith("/review/")) return NextResponse.next();

  // Allow invite accept without auth  
  if (pathname.startsWith("/invite/")) return NextResponse.next();

  // Allow public API routes
  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  if (pathname.startsWith("/api/magic-link")) return NextResponse.next();
  if (pathname.startsWith("/api/review")) return NextResponse.next();

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    const isPublic = PUBLIC_PATHS.some((p) =>
      p === pathname || (p !== "/" && pathname.startsWith(p))
    );
    if (!isPublic && !pathname.startsWith("/api/")) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
