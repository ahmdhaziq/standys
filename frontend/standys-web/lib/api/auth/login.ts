import { NextResponse } from "next/server";
import api from "../client";

export async function login(request: Request) {
  const body = await request.json();
  const response = await api.post("/auth/login", {
    email: body.email,
    password: body.password,
  });
  if (!response.ok) {
    return NextResponse.json(
      { message: response.error ?? "Login failed" },
      { status: response.status },
    );
  }

  const res = NextResponse.json(
    { message: "Login successful" },
    { status: response.status },
  );

  res.cookies.set("access_token", response.data.access_token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: "lax",
    path: "/",
  });

  return res;
}
