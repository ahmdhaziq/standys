import { NextResponse } from "next/server";
import api from "../../../../lib/api/server-client";

type LoginData = {
  access_token: string;
  refresh_token: string;
};

export async function POST(request: Request) {
  const body = await request.json();
  const response = await api.post<LoginData>("/auth/login", {
    email: body.email,
    password: body.password,
  });
  if (!response.ok || !response.data) {
    return NextResponse.json(
      { message: response.error ?? "Login failed" },
      { status: response.status },
    );
  }

  const loginData = response.data;

  const res = NextResponse.json(
    { message: "Login successful" },
    { status: response.status },
  );

  res.cookies.set("access_token", loginData.access_token, {
    httpOnly: true,
    maxAge: 60 * 15,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.cookies.set("refresh_token", loginData.refresh_token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res;
}
