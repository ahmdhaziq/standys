# Daily Tasks API Contract

All backend endpoints require the existing JWT authentication guard. User identity comes exclusively from that token.

## List incomplete overdue tasks

`GET /daily-tasks/incomplete?taskDate=YYYY-MM-DD`

| Input | Required | Validation |
|---|---:|---|
| `taskDate` | Yes | Valid calendar date in `YYYY-MM-DD` form, interpreted with existing daily-task date behavior. |

**Behavior**

- Returns only the authenticated user's `PENDING` daily-task rows dated before `taskDate` using existing daily-task date behavior.
- Excludes completed, today/future, and unauthorized linked tasks.
- Returns rows ordered by newest overdue task date first, with parent-task display data when present.

**Success response**

```json
{
  "status": "success",
  "data": [
    {
      "id": 42,
      "task_date": "2026-09-09T16:00:00.000Z",
      "status": "PENDING",
      "task": { "id": 7, "title": "Prepare standup", "description": null }
    }
  ],
  "meta": null
}
```

## Carry one overdue task forward

`POST /daily-tasks/carry-forward`

```json
{
  "dailyTaskId": 42,
  "taskDate": "2026-09-16"
}
```

| Input | Required | Validation |
|---|---:|---|
| `dailyTaskId` | Yes | Positive integer for a user-owned daily task. |
| `taskDate` | Yes | Valid `YYYY-MM-DD` target date using existing daily-task date behavior. |

**Behavior**

- Moves only an owned `PENDING` row from before the target day to the target day.
- Does not create another daily-task row or modify completion status.
- Is idempotent when already moved to the target date.
- Returns an authorization-safe not-found response for rows not owned by the caller, and a clear conflict response if the unique task/day constraint would produce duplicate work.

**Success response**

```json
{
  "status": "success",
  "data": { "id": 42, "taskDate": "2026-09-16", "status": "PENDING" },
  "meta": null
}
```

## Next.js BFF routes

| Browser route | Upstream endpoint | Notes |
|---|---|---|
| `GET /api/tasks/incomplete?taskDate=...` | `GET /daily-tasks/incomplete` | Proxy the date query and preserve upstream status/envelope. |
| `POST /api/tasks/carry-forward` | `POST /daily-tasks/carry-forward` | Proxy validated JSON body and preserve upstream status/envelope. |
