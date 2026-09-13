import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import api from "../../../../lib/api/server-client";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (refreshToken) {
    await api.post(
      "/auth/logout",
      { refresh_token: refreshToken },
      { skipRefresh: true },
    );
  }

  const result = NextResponse.json({ message: "Logout successful" });
  result.cookies.delete("access_token");
  result.cookies.delete("refresh_token");
  return result;
}
