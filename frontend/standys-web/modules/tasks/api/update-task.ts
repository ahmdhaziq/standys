export type UpdateTaskInput = {
  dailyTaskId: number;
  status: "PENDING" | "COMPLETED";
  completedAt: string | null;
};

type UpdateTaskResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; error: string };

export async function updateTask(dto: UpdateTaskInput): Promise<UpdateTaskResult> {
  const res = await fetch("/api/tasks/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  const body = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: body.error ?? (res.status === 401 ? "Unauthorized. Please log in." : "Task update failed"),
    };
  }

  return { ok: true, status: res.status, data: body.data };
}
