export async function carryForwardTask(dailyTaskId: number, taskDate: string) {
  const res = await fetch("/api/tasks/carry-forward", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dailyTaskId, taskDate }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, status: res.status, error: data.error ?? "Failed to add task to today" };
  return data;
}
