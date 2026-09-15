import api from "@/lib/api/server-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const response = await api.post("/daily-tasks/update", {
    dailyTaskId: body.dailyTaskId,
    status: body.status,
    completedAt: body.completedAt,
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
