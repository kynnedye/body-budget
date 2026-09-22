import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  gateCookieName,
  gatePassword,
  isGateRequired,
  isPublicPath,
  isValidGateToken,
} from "@/lib/auth";

function withPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

function toLogin(request: NextRequest) {
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return withPath(request);

  const password = gatePassword();
  if (!password) {
    if (isGateRequired()) return toLogin(request);
    return withPath(request);
  }

  if (await isValidGateToken(request.cookies.get(gateCookieName())?.value)) {
    return withPath(request);
  }

  return toLogin(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
