import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import api from "../../../../lib/api/server-client";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const response = await api.post<{
    access_token: string;
  }>(
    "/auth/refresh",
    { refresh_token: refreshToken },
    { skipRefresh: true },
  );

  if (!response.ok || !response.data?.access_token) {
    const result = NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
    result.cookies.delete("access_token");
    result.cookies.delete("refresh_token");
    return result;
  }

  const result = NextResponse.json({ message: "Refresh successful" });
  result.cookies.set("access_token", response.data.access_token, {
    httpOnly: true,
    maxAge: 60 * 15,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return result;
}
