import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionCookieName, verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/files")) {
    return NextResponse.next();
  }

  const needsAdmin = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const needsStudent = pathname.startsWith("/campus");

  if (!needsAdmin && !needsStudent) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.redirect(new URL(needsAdmin ? "/admin/login" : "/login", request.url));
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.redirect(new URL(needsAdmin ? "/admin/login" : "/login", request.url));
  }

  if (needsAdmin && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (needsStudent && session.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/campus/:path*"],
};
