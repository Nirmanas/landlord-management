import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.cookies.has("auth")) {
    if (
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register") &&
    !request.cookies.has("refresh")
  ) {
    return NextResponse.next();
  }

  const renew = new URL("/renew", request.url);
  renew.searchParams.set(
    "redirect",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(renew);
}

export const config = {
  matcher: ["/login", "/register"],
};
