import api from "@/lib/api/server-client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskDate = searchParams.get("taskDate");
  const response = await api.get("/daily-tasks/incomplete", {
    params: { taskDate: taskDate || undefined },
  });
  return NextResponse.json(
    { data: response.data, meta: response.meta, error: response.error, status: response.status, ok: response.ok },
    { status: response.status },
  );
}
