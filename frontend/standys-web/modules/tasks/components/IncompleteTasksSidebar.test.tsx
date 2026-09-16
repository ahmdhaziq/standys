import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { groupIncompleteTasks } from "./IncompleteTasksSidebar";
import IncompleteTasksSidebar from "./IncompleteTasksSidebar";

const task = (id: number, task_date: string) => ({
  id,
  task_date,
  status: "PENDING",
  task: { title: `Task ${id}`, description: null },
});

describe("IncompleteTasksSidebar grouping", () => {
  it("places boundary dates in the specified groups", () => {
    const groups = groupIncompleteTasks(
      [
        task(1, "2026-09-15T00:00:00.000Z"),
        task(7, "2026-09-09T00:00:00.000Z"),
        task(8, "2026-09-08T00:00:00.000Z"),
        task(30, "2026-08-17T00:00:00.000Z"),
        task(31, "2026-08-16T00:00:00.000Z"),
      ],
      "2026-09-16",
    );
    expect(groups["Last 7 Days"].map((item) => item.id)).toEqual([1, 7]);
    expect(groups["Last 30 Days"].map((item) => item.id)).toEqual([8, 30]);
    expect(groups.Older.map((item) => item.id)).toEqual([31]);
  });

  it("does not classify today or future rows", () => {
    const groups = groupIncompleteTasks(
      [task(0, "2026-09-16T00:00:00.000Z"), task(2, "2026-09-17T00:00:00.000Z")],
      "2026-09-16",
    );
    expect(Object.values(groups).flat()).toHaveLength(0);
  });

  it("renders a permanent desktop rail and the mobile empty state", () => {
    const date = new Date().toISOString().split("T")[0];
    const client = new QueryClient();
    client.setQueryData(["incomplete-tasks", date], { ok: true, status: 200, data: [] });
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={client}><IncompleteTasksSidebar /></QueryClientProvider>,
    );
    expect(markup).toContain("Overdue Tasks");
    expect(markup).toContain("No overdue tasks.");
    expect(markup).toContain("md:sticky");
    expect(markup).toContain("md:top-0");
    expect(markup).toContain("md:h-screen");
    expect(markup).toContain("overflow-y-auto");
    expect(markup).toContain("md:hidden");
  });

  it("renders retry and carry-forward affordances from query states", () => {
    const date = new Date().toISOString().split("T")[0];
    const client = new QueryClient();
    client.setQueryData(["incomplete-tasks", date], { ok: false, status: 500, error: "failed" });
    const errorMarkup = renderToStaticMarkup(<QueryClientProvider client={client}><IncompleteTasksSidebar /></QueryClientProvider>);
    expect(errorMarkup).toContain("Retry");

    client.setQueryData(["incomplete-tasks", date], { ok: true, status: 200, data: [task(1, "2026-09-15T00:00:00.000Z")] });
    const rowMarkup = renderToStaticMarkup(<QueryClientProvider client={client}><IncompleteTasksSidebar /></QueryClientProvider>);
    expect(rowMarkup).toContain("Add to today");
  });
});
