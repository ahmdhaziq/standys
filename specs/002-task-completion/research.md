# Research: Mark Daily Task Complete

## Decisions

### Use one guarded daily-task update endpoint

**Decision**: Add `POST /daily-tasks/update` to `DailyTasksController`, protected by the existing
`JwtAuthGuard`, accepting an `UpdateDailyTaskDto` and passing `req.user` to the service.

**Rationale**: Existing daily-task routes use the same controller, guard, authenticated-request
shape, and service delegation. It keeps transport, business logic, and persistence separate.

**Alternatives considered**:

- Add the endpoint under the parent tasks module — rejected because the completion fields and
  lifecycle belong to `daily_tasks`.
- Accept a user ID in the request body — rejected because identity must derive from the JWT.

### Support explicit two-way completion transitions

**Decision**: The DTO accepts a daily-task ID, `status: 'PENDING' | 'COMPLETED'`, and a nullable
completion timestamp. The service permits only `PENDING → COMPLETED` with a valid ISO timestamp
and `COMPLETED → PENDING` with `completedAt: null`.

**Rationale**: Users must be able to correct an accidental completion. Explicit transitions retain
the same-status protection while preventing arbitrary values in the current string column.

**Alternatives considered**:

- Allow every arbitrary status string — rejected because it bypasses business validation.
- Preserve the earlier one-way scope — rejected because it fails the specified uncheck scenario.

### Separate completion orchestration from generic persistence delegation

**Decision**: Keep `DailyTasksService.updateDailyTasks` as the generic service method that delegates
a normalized status/timestamp patch to the repository. Add `updateCompletionStatus` as the
endpoint-facing method; it validates ownership and status transitions, normalizes the timestamp,
then calls `updateDailyTasks`.

**Rationale**: Completion rules remain cohesive and do not make a reusable update delegation
method responsible for UI-specific toggle semantics.

**Alternatives considered**:

- Have the controller call `updateDailyTasks` — rejected because it would mix completion business
  rules into the generic method.
- Add a second controller endpoint for unchecking — rejected because one status-update contract
  supports both valid transitions.

### Enforce ownership before the update

**Decision**: Repository lookup and update queries scope the daily-task ID by the JWT user's ID and
the linked task's owner when present. `updateCompletionStatus` rejects an inaccessible scoped
record with `UnauthorizedException`; `updateDailyTasks` repeats the ownership scope for the final
write.

**Rationale**: This follows the requested behavior and the constitution's requirement that
repository queries themselves enforce ownership and relational boundaries.

**Alternatives considered**:

- Check only `daily_tasks.user_id` — rejected because the linked task must also belong to the user.
- Fetch a daily task without user scope, then check it in the service — rejected because it violates
  the repository ownership-boundary requirement.

### Standardize status casing at the feature boundary

**Decision**: Use existing database creation status `PENDING` and new completion status
`COMPLETED` consistently in backend, BFF payload, and checkbox rendering.

**Rationale**: The current list UI tests lowercase `"completed"` while creation persists uppercase
`"PENDING"`; this prevents a persisted completion from being rendered checked.

**Alternatives considered**:

- Preserve the UI's lowercase comparison — rejected because it conflicts with persisted values.
- Migrate to a database enum — rejected because a string field already supports this small,
  constrained transition and no schema change is needed.

### Invalidate the date-specific task-list query after either toggle mutation

**Decision**: `TaskListCard` uses one TanStack Query mutation calling the new task BFF API. Checking
sends `COMPLETED` plus `new Date().toISOString()`; unchecking sends `PENDING` plus `null`. On a
successful response, invalidate `['tasks', todayDate]`; while pending, disable that checkbox.

**Rationale**: It matches the existing `useQuery` key, fetches the server-confirmed state, and
prevents rapid duplicate requests without adding an optimistic-cache rollback path.

**Alternatives considered**:

- Optimistically update the cache — rejected for this first change because an invalidation is
  simpler and guarantees the final UI reflects authorization and server business rules.
- Refresh the whole page — rejected because it is a poorer task-list interaction and duplicates
  TanStack Query's responsibility.

### Use consistent service method names

**Decision**: Use `updateDailyTasks` for generic persistence delegation and
`updateCompletionStatus` for completion-specific orchestration.

**Rationale**: The consistent spelling corrects the apparent `updateDailtyTasks` typo and makes
the separate responsibilities discoverable.
