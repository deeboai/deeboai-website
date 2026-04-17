import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  buildAdminHostnameRedirectUrl,
  buildPrimaryHostnameRedirectUrl,
  isAdminHostname,
  isInternalAdminPathname,
  isKnownVisibleAdminPath,
  isLocalHostname,
  toInternalAdminPath,
  toVisibleAdminPath,
} from "@/lib/admin-routing";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const hostname = nextUrl.hostname;

  if (isAdminHostname(hostname)) {
    if (nextUrl.pathname === "/admin" || nextUrl.pathname.startsWith("/admin/")) {
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = toVisibleAdminPath(nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (isKnownVisibleAdminPath(nextUrl.pathname)) {
      const rewriteUrl = nextUrl.clone();
      rewriteUrl.pathname = toInternalAdminPath(nextUrl.pathname);
      return updateSession(request, rewriteUrl);
    }

    return NextResponse.redirect(buildPrimaryHostnameRedirectUrl(nextUrl));
  }

  if (!isLocalHostname(hostname) && isInternalAdminPathname(nextUrl.pathname)) {
    return NextResponse.redirect(buildAdminHostnameRedirectUrl(nextUrl));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|favicon/|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|mov|webmanifest)$).*)",
  ],
};
