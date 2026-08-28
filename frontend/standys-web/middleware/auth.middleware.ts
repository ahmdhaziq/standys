import { NextRequest, NextResponse } from "next/server";

export function authMiddleware(req: NextRequest) {
  const cookie = req.cookies.get("access_token");

  if (!cookie) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return;
}
