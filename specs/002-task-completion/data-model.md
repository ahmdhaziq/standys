# Data Model: Mark Daily Task Complete

## Existing entity changed

### DailyTask (`daily_tasks`)

| Field | Type | Role in this feature |
| --- | --- | --- |
| `id` | integer | Identifies the daily-task record targeted by the update. |
| `user_id` | integer | Must equal the authenticated user's ID. |
| `task_id` | integer or null | When present, its linked task must also belong to the authenticated user. |
| `status` | string | Existing `PENDING` or `COMPLETED`; this delivery permits only transitions between those values. |
| `completed_at` | date-time or null | Contains a validated timestamp for `COMPLETED` and is cleared to null for `PENDING`. |
| `task_date` | date-time | Determines the existing task-list query date; it is not changed. |
| `updated_at` | date-time | Existing automatic update timestamp. |

No database migration is required: `status` and `completed_at` already exist.

## Related entity

### Task (`tasks`)

| Field | Type | Role in this feature |
| --- | --- | --- |
| `id` | integer | May be referenced by `daily_tasks.task_id`. |
| `user_id` | integer | Must equal the authenticated user's ID for a linked daily task. |

## Input model

### UpdateDailyTaskDto

| Field | Validation | Notes |
| --- | --- | --- |
| `dailyTaskId` | Required numeric identifier | Targets a daily-task record; caller does not submit a user ID. |
| `status` | Required value `PENDING` or `COMPLETED` | Only supported target statuses. |
| `completedAt` | ISO 8601 date-time or null | Required valid timestamp for `COMPLETED`; must be null for `PENDING`. |

The application-wide validation pipe rejects unrecognized fields, transforms the numeric ID, and
validates types at the controller boundary.

## State transition

```text
PENDING --(authenticated owner submits COMPLETED with ISO completedAt)--> COMPLETED
COMPLETED --(authenticated owner submits PENDING with completedAt null)--> PENDING
same current/requested status --------------------------------------------> reject: status unchanged
any other current status or timestamp combination ------------------------> reject: unsupported transition
```

`updateCompletionStatus` evaluates the transition and normalizes the patch before calling
`updateDailyTasks`. Repository reads and writes scope the daily-task and linked-task ownership in
the Prisma query. Inaccessible records return the requested `UnauthorizedException`; they are
never updated.
