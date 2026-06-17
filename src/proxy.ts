import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const roleRoutes: Record<string, string[]> = {
  "/prestataire/": ["PRESTATAIRE"],
  "/admin/": ["ADMIN"],
  "/moderateur/": ["MODERATEUR", "ADMIN"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  for (const [prefix, allowed] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(prefix)) {
      if (!req.auth) {
        return NextResponse.redirect(new URL("/connexion", req.url));
      }
      if (role && !allowed.includes(role)) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|jam-).*)"],
};
