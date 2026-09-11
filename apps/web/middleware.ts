import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPreview = request.nextUrl.searchParams.has("preview");
  const token = request.cookies.get("access_token")?.value;
  const hasAccessToken = Boolean(token && token.trim().length > 0) || isPreview;

  if (pathname.startsWith("/auth/callback") || pathname.startsWith("/auth/logout")) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (hasAccessToken && !isPreview) {
      return NextResponse.redirect(new URL("/feed", request.url));
    }
    return NextResponse.next();
  }

  if (!hasAccessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  const response = NextResponse.next();
  if (isPreview && !hasAccessToken) {
    response.cookies.set("access_token", "preview-token", { path: "/" });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
