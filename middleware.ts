import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { canAccessPath } from "@/lib/permissions";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isLoginPage = nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isLoggedIn) {
    const role = (req.auth as { user?: { role?: string } })?.user?.role;
    if (!canAccessPath(role, nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
