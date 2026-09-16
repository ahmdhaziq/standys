# Data Model: Overdue Task Sidebar

## Existing persisted entity: `daily_tasks`

| Field | Role in this feature | Rules |
|---|---|---|
| `id` | Identifies the row for carry-forward | Must belong to the JWT user and remain pending when moved. |
| `user_id` | Task-list ownership boundary | Must equal the authenticated user for reads and writes. |
| `task_id` | Optional link to the parent task | When present, the parent task must also belong to the authenticated user. |
| `task_date` | Determines overdue eligibility and target date | A row is overdue when before the current date under existing daily-task date handling; carry-forward changes it to today. |
| `status` | Completion state | Only `PENDING` rows are returned or carried forward. |
| `completed_at` | Completion timestamp | Carry-forward leaves it unchanged; a pending row should have no completion timestamp. |

`tasks` supplies the related title and optional description displayed in the sidebar. Untitled standalone daily-task rows must still render safely using the existing task-list fallback pattern.

## Derived view model: overdue task

| Field | Source | Purpose |
|---|---|---|
| `dailyTaskId` | `daily_tasks.id` | Stable carry-forward target. |
| `taskDate` | `daily_tasks.task_date` | Calculates the group. |
| `status` | `daily_tasks.status` | Defensive client display; expected `PENDING`. |
| `title`, `description` | linked `tasks`, when present | Compact row content. |
| `ageGroup` | Client calculation from task date and local reference date | One of Last 7 Days, Last 30 Days, or Older. |

## State transitions

```text
PENDING on prior local date
  └─ carry forward ─> PENDING on local today

COMPLETED on any date
  └─ not eligible for overdue list or carry forward
```

## Integrity and concurrency rules

- The query always scopes to the authenticated user and preserves linked-task ownership filtering.
- The overdue query and carry-forward target preserve the existing daily-task date conventions.
- Carry-forward must be idempotent: if the row already has the target date, return its current representation without duplication.
- If moving a row conflicts with the existing unique `(task_date, task_id)` constraint, the service must resolve the duplicate safely: retain one canonical today row and return a clear conflict result rather than creating a duplicate.
- Add an index covering `user_id`, `status`, and `task_date`; create it through a Prisma migration.
