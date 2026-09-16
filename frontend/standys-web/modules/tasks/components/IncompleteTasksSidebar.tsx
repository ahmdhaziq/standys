"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  getIncompleteTasks,
  IncompleteTask,
} from "../api/get-incomplete-tasks";
import { carryForwardTask } from "../api/carry-forward-task";
import { toast } from "@/components/ui/toast";
import { CalendarClock, ChevronDown } from "lucide-react";

function today() {
  return new Date().toISOString().split("T")[0];
}

export function groupIncompleteTasks(tasks: IncompleteTask[], date: string) {
  const groups = {
    "Last 7 Days": [] as IncompleteTask[],
    "Last 30 Days": [] as IncompleteTask[],
    Older: [] as IncompleteTask[],
  };
  for (const task of tasks) {
    const age = Math.floor(
      (Date.parse(`${date}T00:00:00Z`) - Date.parse(task.task_date)) / 86400000,
    );
    if (age >= 1 && age <= 7) groups["Last 7 Days"].push(task);
    else if (age >= 8 && age <= 30) groups["Last 30 Days"].push(task);
    else if (age > 30) groups.Older.push(task);
  }
  return groups;
}

export default function IncompleteTasksSidebar() {
  const date = today();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["incomplete-tasks", date],
    queryFn: () => getIncompleteTasks(date),
  });
  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => carryForwardTask(id, date),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.add({ type: "error", description: result.error });
        return;
      }
      client.invalidateQueries({ queryKey: ["incomplete-tasks", date] });
      client.invalidateQueries({ queryKey: ["tasks", date] });
    },
    onError: (error: Error) =>
      toast.add({
        type: "error",
        description: error.message || "Failed to add task to today",
      }),
  });
  const groups = groupIncompleteTasks(query.data?.data ?? [], date);
  const content = query.isLoading ? (
    <p className="text-sm text-muted-foreground">Loading overdue tasks…</p>
  ) : query.isError || query.data?.ok === false ? (
    <div>
      <p className="text-sm text-red-600">Unable to load overdue tasks.</p>
      <Button
        className="mt-2"
        size="sm"
        variant="outline"
        onClick={() => query.refetch()}
      >
        Retry
      </Button>
    </div>
  ) : Object.values(groups).every((items) => items.length === 0) ? (
    <p className="text-sm text-muted-foreground">No overdue tasks.</p>
  ) : (
    Object.entries(groups).map(([name, items]) =>
      items.length ? (
        <section key={name} className="space-y-2">
          <h3 className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {name}
          </h3>
          {items.map((item) => (
            <div
              key={item.id}
              className="group/item flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {item.task?.title ?? "Untitled task"}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {item.task?.description || "Carry this task into today"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 rounded-md border-indigo-100 bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-700 shadow-none hover:border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800"
                disabled={
                  mutation.isPending && mutation.variables?.id === item.id
                }
                onClick={() => mutation.mutate({ id: item.id })}
              >
                Add to today
              </Button>
            </div>
          ))}
        </section>
      ) : null,
    )
  );
  return (
    <>
      <aside className="w-full border-t border-slate-200 bg-white pt-4 md:hidden">
        <details open className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between border-b border-slate-200 py-3 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-md bg-indigo-50 text-indigo-600">
                <CalendarClock className="size-4" />
              </span>
              Overdue Tasks
            </span>
            <ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-6 py-4">{content}</div>
        </details>
      </aside>
      <aside className="hidden bg-white md:sticky md:top-0 md:flex md:h-screen md:w-72 md:shrink-0 md:self-start md:flex-col md:border-l md:border-slate-200 md:pl-5">
        <div className="shrink-0 border-b border-slate-200 py-3 text-sm font-semibold text-slate-900 md:border-0 md:py-5">
          <span className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-indigo-50 text-indigo-600">
              <CalendarClock className="size-4" />
            </span>
            Overdue Tasks
          </span>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pb-6 pr-1 pt-1">
          {content}
        </div>
      </aside>
    </>
  );
}
