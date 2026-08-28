import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "./middleware/auth.middleware";

export function proxy(request: NextRequest) {
  console.log("🔥 PROXY:", request.nextUrl.pathname);

  const authResult = authMiddleware(request);
  if (authResult) {
    return authResult;
  }

  return NextResponse.next();
}
export const config = {
  matcher: ["/task/:path*"],
};
