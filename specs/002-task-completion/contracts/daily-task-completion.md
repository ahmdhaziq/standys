# Contract: Complete a Daily Task

## Backend endpoint

`POST /daily-tasks/update`

The endpoint requires a valid JWT access token. The authenticated user is taken from that token;
the request body must not contain a user identifier.

### Request body

```json
{
  "dailyTaskId": 42,
  "status": "COMPLETED",
  "completedAt": "2026-09-15T09:30:00.000Z"
}
```

| Field | Required | Rules |
| --- | --- | --- |
| `dailyTaskId` | Yes | Numeric ID of the target daily task. |
| `status` | Yes | Must be `COMPLETED` or `PENDING`. |
| `completedAt` | Yes | Valid ISO 8601 date-time for `COMPLETED`; `null` for `PENDING`. |

To restore a task to incomplete, submit:

```json
{
  "dailyTaskId": 42,
  "status": "PENDING",
  "completedAt": null
}
```

### Successful response

Returns HTTP 200 using the application's existing envelope:

```json
{
  "status": "success",
  "data": {
    "id": 42,
    "status": "COMPLETED",
    "completedAt": "2026-09-15T09:30:00.000Z"
  },
  "meta": null
}
```

The implementation may include other safe daily-task fields already used by the list response,
but it must not return credentials or other sensitive information.

### Error behavior

| Condition | HTTP status | Result |
| --- | --- | --- |
| Missing or invalid access token | 401 | JWT guard rejects the request. |
| Daily task is inaccessible or its linked task is not owned by requester | 401 | Ownership-scoped lookup results in `UnauthorizedException`, as requested. |
| Invalid/missing fields, invalid status/timestamp combination, or unsupported transition | 400 | No record is changed. |
| Requested status equals current status | 400 | No record is changed. |

## Frontend BFF endpoint

`POST /api/tasks/update`

This route accepts either valid transition body, forwards it with the server client to
`/daily-tasks/update`, and returns the normalized BFF envelope:

```json
{
  "data": {},
  "meta": null,
  "error": null,
  "status": 200,
  "ok": true
}
```

For errors, it preserves the upstream HTTP status and returns `ok: false` with the normalized
error string. The browser calls only this BFF endpoint; backend JWT forwarding remains inside the
server client.
