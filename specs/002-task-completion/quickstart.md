# Quickstart: Validate Daily Task Completion

## Prerequisites

- PostgreSQL is configured for `backend/core`, and the application has daily-task data owned by a
  test user.
- Backend and frontend dependencies are installed.
- Start the backend and frontend with their normal development commands from `backend/core` and
  `frontend/standys-web` respectively.
- Sign in through the frontend so its server-side access-token cookie is available to the BFF.

## Automated validation

From `backend/core`, run the focused daily-task tests, then the project checks:

```sh
npm test -- daily-tasks
npm run build
```

From `frontend/standys-web`, run the route tests and build:

```sh
npm test
npm run build
```

The backend tests must prove controller delegation to `updateCompletionStatus`, both valid
transitions, unchanged-status rejection, ownership-scoped repository queries, and guarded HTTP
behavior. The frontend tests must prove the BFF forwards both contract payloads and preserves
success/error status. See the
[endpoint contract](./contracts/daily-task-completion.md) and [data model](./data-model.md).

## Browser scenario

1. Open Today's Task List as the owner of a daily task whose status is `PENDING`.
2. Select that task's checkbox.
3. Confirm the checkbox is temporarily unavailable while the request runs, then becomes selected
   after the task-list query refetches.
4. Reload or revisit Today's Task List and confirm the task remains `COMPLETED`.
5. Clear the checkbox and confirm the task becomes `PENDING`, has no completion timestamp, and
   remains unchecked after reload.
6. Attempt to submit the current status again and confirm it is rejected without changing the
   task.
7. Sign in as a different user (or call the BFF with a different user's session) and attempt to
   complete the first user's daily task. Confirm an unauthorized response and no data change.

## Expected data outcome

For a successful request, only the selected `daily_tasks` record changes. Completion writes
`status: COMPLETED` and the submitted ISO timestamp; restoration writes `status: PENDING` and
`completed_at: null`. The existing automatic update timestamp advances. The parent task and all
other daily tasks remain unchanged.
