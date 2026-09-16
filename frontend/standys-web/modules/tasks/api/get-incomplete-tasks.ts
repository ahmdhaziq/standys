export type IncompleteTask = {
  id: number;
  task_date: string;
  status: string;
  task: { title: string; description: string | null } | null;
};

export async function getIncompleteTasks(taskDate: string): Promise<{ ok: boolean; status: number; data?: IncompleteTask[]; error?: string }> {
  const res = await fetch(`/api/tasks/incomplete?${new URLSearchParams({ taskDate })}`);
  const data = await res.json();
  if (!res.ok) return { ok: false, status: res.status, error: data.error ?? "Failed to fetch overdue tasks" };
  return data as { ok: boolean; status: number; data: IncompleteTask[]; error?: string };
}
