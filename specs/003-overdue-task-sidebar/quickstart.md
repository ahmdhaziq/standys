# Quickstart: Validate the Overdue Task Sidebar

## Prerequisites

- Backend and frontend dependencies are installed according to their existing project instructions.
- A user can sign in to the task workspace.
- Seed or create owned daily tasks at local dates 1, 7, 8, 30, and 31 days before today; keep them `PENDING`.
- Also create a completed historical task, a task dated today, a future task, and a task owned by a different user.

## Validation scenarios

1. Start the backend and frontend with their existing development commands, then open the authenticated task workspace.
2. On desktop, confirm the task card has a right-hand incomplete-tasks rail styled consistently with the Stitch **Today Dashboard with Inline Add Task** reference.
3. Confirm the rail shows the pending owned tasks exactly once in these groups: Last 7 Days (1–7), Last 30 Days (8–30), and Older (>30). Confirm completed, today, future, unowned, and undated tasks are absent.
4. On a mobile viewport, confirm the same content appears below today's tasks in a collapsible **Overdue Tasks** section.
5. Select a pending overdue row and choose **Add to today**. Confirm it appears in today's task list, disappears from the overdue list, remains `PENDING`, and no duplicate is created.
6. Repeat the action or attempt it against a task that already has a current-day record. Confirm the result is idempotent or presents the defined non-destructive conflict feedback.
7. Refresh the workspace after the current date changes and confirm overdue membership and grouping are recalculated using the existing daily-task date behavior. Carry a row forward and confirm it appears in today's list.
8. Run the focused backend repository/service/controller tests, backend e2e coverage, BFF route tests, and frontend component/query tests. Confirm failures surface as the established toast/error state and no stale list remains after a successful carry-forward.

## Expected HTTP checks

- An authenticated request to the incomplete BFF route forwards its supplied `taskDate` and returns only `PENDING` historical rows.
- An unauthenticated or invalid request preserves the upstream failure response.
- A successful carry-forward BFF request returns the rescheduled row and causes both the today and overdue queries to refetch.

## Validation record

- 2026-09-16: `prisma validate` and `prisma generate` passed. The feature preserves the existing date-query behavior; no new time-zone boundary behavior is introduced.
- 2026-09-16: Daily-task Jest suites passed (13 tests), backend e2e passed (6 tests), frontend Vitest passed (14 tests), and the webpack production build passed. Coverage includes ownership, validation, carry-forward, age boundaries, empty state, responsive markup, and error/retry states.
