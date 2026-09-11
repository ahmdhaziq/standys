import { CreateTaskInput } from "../schema/create-task.schema";

export async function createTask(dto: CreateTaskInput) {
  const res = await fetch("/api/tasks/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    if (res.status === 401) {
      return {
        ok: false,
        status: 401,
        error: "Unauthorized. Please log in.",
      };
    }
    const errorData = await res.json();
    return {
      ok: false,
      status: res.status,
      error: errorData.error ?? "Task creation failed",
    };
  }
  return {
    ok: true,
    status: res.status,
    res,
  };
}
