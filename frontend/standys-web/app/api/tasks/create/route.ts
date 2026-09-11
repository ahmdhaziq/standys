import api from "@/lib/api/server-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const response = await api.post("/daily-tasks/create", {
    taskId: body.taskId || null,
    title: body.title || null,
    description: body.description || null,
  });
  return NextResponse.json(
    {
      data: response.data,
      meta: response.meta,
      error: response.error,
      status: response.status,
      ok: response.ok,
    },
    { status: response.status },
  );
}
