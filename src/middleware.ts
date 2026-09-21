import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { gateCookieName, gatePassword, isValidGateToken } from "@/lib/auth";

function withPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!gatePassword()) return withPath(request);

  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return withPath(request);
  }

  if (await isValidGateToken(request.cookies.get(gateCookieName())?.value)) {
    return withPath(request);
  }

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
