import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const refresh = searchParams.get("refresh");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url),
    );
  }

  const response = NextResponse.redirect(new URL("/feed", request.url));

  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set("access_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });

  if (refresh) {
    response.cookies.set("refresh_token", refresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
  }

  return response;
}
