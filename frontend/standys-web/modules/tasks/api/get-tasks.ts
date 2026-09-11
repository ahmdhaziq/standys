export async function getTasks(taskDate: string) {
  const params = new URLSearchParams({ taskDate });
  const res = await fetch(`/api/tasks/list?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

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
      error: errorData.error ?? "Failed to fetch tasks",
    };
  }
  return data;
}
