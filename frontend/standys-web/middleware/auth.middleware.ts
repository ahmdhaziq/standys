import api from "@/lib/api/server-client";
import { NextRequest, NextResponse } from "next/server";

export async function authMiddleware(req: NextRequest) {
  const accessCookie = req.cookies.get("access_token");
  const refreshCookie = req.cookies.get("refresh_token");

  if (!accessCookie && !refreshCookie) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const response = await api.get("/auth/me");

  if (response.status === 401) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
  return;
}
