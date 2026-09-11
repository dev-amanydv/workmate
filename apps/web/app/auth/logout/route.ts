import { NextResponse, type NextRequest } from "next/server";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ data: { ok: true } });

  response.cookies.set("access_token", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
  });

  response.cookies.set("refresh_token", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
  });

  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set("access_token", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
  });

  response.cookies.set("refresh_token", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
  });

  return response;
}
