import api from "@/lib/api/server-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const response = await api.post("/auth/register", {
    name: body.name,
    email: body.email,
    password: body.password,
  });
  if (!response.ok) {
    return NextResponse.json(
      { message: response.error ?? "Registration failed" },
      { status: response.status },
    );
  }

  return NextResponse.json(
    { message: "Registration successful" },
    { status: response.status },
  );
}
