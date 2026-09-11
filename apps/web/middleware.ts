import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPreview = request.nextUrl.searchParams.has("preview");
  const hasAccessToken = request.cookies.has("access_token") || isPreview;

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
  if (isPreview && !request.cookies.has("access_token")) {
    response.cookies.set("access_token", "preview-token", { path: "/" });
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
