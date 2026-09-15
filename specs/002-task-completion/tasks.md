---

description: "Implementation tasks for daily-task completion-status toggling"
---

# Tasks: Mark and Restore Daily Task Completion

**Input**: Design documents from `/specs/002-task-completion/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contract](./contracts/daily-task-completion.md), and [quickstart.md](./quickstart.md)

**Tests**: Required by the project constitution. Write test tasks before implementation and confirm the relevant tests fail first.

## Technical Implementation Outline

1. `UpdateDailyTaskDto` accepts `dailyTaskId`, exactly `PENDING` or `COMPLETED`, and `completedAt` as an ISO timestamp or `null`.
2. Repository methods own all Prisma access and scope both lookup and update queries by the daily-task owner and linked-task owner.
3. `updateDailyTasks` is the generic persistence delegator. `updateCompletionStatus` owns authorization, transition validation, timestamp normalization, and delegates to `updateDailyTasks`.
4. Valid transitions are `PENDING → COMPLETED` with a timestamp and `COMPLETED → PENDING` with `completedAt: null`. Same-status and other combinations fail.
5. The guarded controller calls only `updateCompletionStatus`; the BFF forwards either valid payload; the mutation invalidates `['tasks', todayDate]` after success.

## Phase 1: Setup

**Purpose**: Confirm no migration is needed for the two persisted status states.

- [X] T001 Verify in `backend/core/prisma/schema.prisma` that existing `daily_tasks.status` and nullable `completed_at` support `PENDING ↔ COMPLETED` without a migration

---

## Phase 2: Foundational Contract

**Purpose**: Establish the validated request shape shared by both user stories.

- [X] T002 Create `UpdateDailyTaskDto` in `backend/core/src/modules/daily-tasks/dto/update-daily-task.dto.ts` with required numeric `dailyTaskId`, `status` restricted verbatim to `PENDING` or `COMPLETED`, and `completedAt` accepting an ISO 8601 date-time or null; do not accept a user ID

**Checkpoint**: The DTO can represent both valid transitions and rejects unknown fields through the existing validation boundary.

---

## Phase 3: User Story 1 - Complete a Task from the List (Priority: P1) 🎯 MVP

**Goal**: An owner selects an incomplete task's checkbox and sees the server-confirmed completed state after refetch.

**Independent Test**: As the owner of a `PENDING` daily task, select its checkbox and verify only that record becomes `COMPLETED` with a timestamp, then reload and verify it remains checked.

### Tests for User Story 1

- [X] T003 [P] [US1] Extend `backend/core/src/modules/daily-tasks/daily-tasks.repository.spec.ts` with failing expectations that lookup and update Prisma queries scope daily-task ID, daily-task owner, and linked-task owner, and update only `status` and `completed_at`
- [X] T004 [P] [US1] Extend `backend/core/src/modules/daily-tasks/daily-tasks.service.spec.ts` with failing tests that `updateCompletionStatus` accepts `PENDING → COMPLETED` with an ISO timestamp, rejects unchanged/unsupported requests, returns `UnauthorizedException` for inaccessible records, and delegates the normalized patch to `updateDailyTasks`
- [X] T005 [P] [US1] Extend `backend/core/src/modules/daily-tasks/daily-tasks.controller.spec.ts` with a failing test that guarded `POST /daily-tasks/update` passes the DTO and JWT request user to `updateCompletionStatus`, not `updateDailyTasks`
- [X] T006 [P] [US1] Create `frontend/standys-web/app/api/tasks/update/route.test.ts` with failing Vitest cases that forward `COMPLETED` with an ISO timestamp to `/daily-tasks/update` and preserve normalized success, unauthorized, and validation-error statuses
- [ ] T007 [P] [US1] Extend `backend/core/test/app.e2e-spec.ts` with a failing authenticated HTTP test that validates the DTO, completes an owned `PENDING` task, and rejects an inaccessible task without changing it

### Backend Implementation for User Story 1

- [X] T008 [US1] Implement the ownership-scoped daily-task lookup and `updateDailyTasks` Prisma write in `backend/core/src/modules/daily-tasks/daily-tasks.repository.ts`, constraining daily-task ID, `daily_tasks.user_id`, and linked `tasks.user_id` before reading or updating
- [X] T009 [US1] Implement generic `updateDailyTasks` in `backend/core/src/modules/daily-tasks/daily-tasks.service.ts` to delegate only the normalized status/timestamp patch and authenticated user to the repository
- [X] T010 [US1] Implement `updateCompletionStatus` in `backend/core/src/modules/daily-tasks/daily-tasks.service.ts` to reject inaccessible records with `UnauthorizedException`, require `PENDING → COMPLETED` with a valid timestamp, reject unchanged/unsupported requests, then call `updateDailyTasks`
- [X] T011 [US1] Add guarded `POST /daily-tasks/update` in `backend/core/src/modules/daily-tasks/daily-tasks.controller.ts` using `UpdateDailyTaskDto`, `JwtAuthGuard`, and `req.user`, delegating to `updateCompletionStatus`

### Frontend BFF and UI Implementation for User Story 1

- [X] T012 [P] [US1] Create `POST` handler in `frontend/standys-web/app/api/tasks/update/route.ts` that forwards `dailyTaskId`, `status`, and `completedAt` through `@/lib/api/server-client` to `/daily-tasks/update` and returns the established `{ data, meta, error, status, ok }` envelope with the upstream status
- [X] T013 [US1] Create `updateTask` in `frontend/standys-web/modules/tasks/api/update-task.ts` to POST the `COMPLETED` payload to `/api/tasks/update` and preserve the existing success/error and 401 behavior
- [X] T014 [US1] Update `frontend/standys-web/modules/tasks/components/TaskListCard.tsx` to mutate `{ dailyTaskId, status: 'COMPLETED', completedAt: new Date().toISOString() }` when an unchecked checkbox becomes selected, disable the affected checkbox while pending, render uppercase `COMPLETED` as checked, show the established failure toast, and invalidate `['tasks', todayDate]` after success

**Checkpoint**: Completion works end-to-end; the database operation is ownership-scoped and the refetched UI remains checked.

---

## Phase 4: User Story 2 - Restore a Task to Incomplete (Priority: P2)

**Goal**: An owner clears a completed checkbox and sees `PENDING` with no completion date after refetch.

**Independent Test**: As the owner of a completed daily task, clear its checkbox and verify only that record becomes `PENDING` with `completed_at: null`, then reload and verify it remains unchecked.

### Tests for User Story 2

- [X] T015 [P] [US2] Extend `backend/core/src/modules/daily-tasks/daily-tasks.service.spec.ts` with failing tests that `updateCompletionStatus` accepts only `COMPLETED → PENDING` with `completedAt: null`, rejects a `PENDING` timestamp and same-status request, and delegates the cleared timestamp through `updateDailyTasks`
- [X] T016 [P] [US2] Extend `backend/core/src/modules/daily-tasks/daily-tasks.repository.spec.ts` with a failing expectation that the scoped write persists `status: 'PENDING'` and `completed_at: null` only for the selected daily task
- [X] T017 [P] [US2] Extend `frontend/standys-web/app/api/tasks/update/route.test.ts` with a failing Vitest case that forwards `{ status: 'PENDING', completedAt: null }` unchanged and preserves the upstream response status
- [ ] T018 [P] [US2] Extend `backend/core/test/app.e2e-spec.ts` with a failing authenticated HTTP test that restores an owned completed task to `PENDING` with a null completion date

### Implementation for User Story 2

- [X] T019 [US2] Extend `updateCompletionStatus` in `backend/core/src/modules/daily-tasks/daily-tasks.service.ts` to require `COMPLETED → PENDING` with `completedAt: null`, normalize that patch, and call `updateDailyTasks`
- [X] T020 [US2] Extend `updateTask` in `frontend/standys-web/modules/tasks/api/update-task.ts` so its input type and error handling accept `PENDING` plus null completion date without coercion
- [X] T021 [US2] Extend `frontend/standys-web/modules/tasks/components/TaskListCard.tsx` so clearing a checked checkbox mutates `{ dailyTaskId, status: 'PENDING', completedAt: null }`, disables the affected checkbox while pending, shows the established failure toast, and invalidates `['tasks', todayDate]` after success

**Checkpoint**: Completion restoration clears the persisted timestamp and the refetched UI remains unchecked.

---

## Phase 5: Polish & Cross-Cutting Validation

**Purpose**: Verify both transitions, contracts, ownership boundaries, and production build quality.

- [X] T022 Run focused Jest tests, E2E tests, linting, and the NestJS build from `backend/core/package.json`, resolving failures in `backend/core/src/modules/daily-tasks/` and `backend/core/test/app.e2e-spec.ts`
- [X] T023 Run Vitest, linting, and the production build from `frontend/standys-web/package.json`, resolving failures in `frontend/standys-web/app/api/tasks/update/route.ts` and `frontend/standys-web/modules/tasks/components/TaskListCard.tsx`
- [ ] T024 Execute the complete-and-restore, repeat-request, reload, failure, and cross-user scenarios in `specs/002-task-completion/quickstart.md`; verify `backend/core/src/modules/daily-tasks/` and `frontend/standys-web/app/api/tasks/update/` never accept or expose caller-supplied user IDs or credentials

---

## Dependencies & Execution Order

```text
T001 → T002 → {T003, T004, T005, T006, T007} → T008 → T009 → T010 → T011
                                                       ↘ T012 → T013 → T014
{T010, T011, T014} → {T015, T016, T017, T018} → T019 → T020 → T021 → T022, T023 → T024
```

- T008 is the single repository implementation task; it precedes both service methods, eliminating the former duplicate repository task and ordering contradiction.
- US1 is the MVP. US2 extends the same service, BFF client, and component only after US1 is complete.
- T003–T007, T012, T015–T018, and T022/T023 are the identified parallel opportunities.

## Parallel Examples

```text
Task: "T003 repository tests in backend/core/src/modules/daily-tasks/daily-tasks.repository.spec.ts"
Task: "T004 service tests in backend/core/src/modules/daily-tasks/daily-tasks.service.spec.ts"
Task: "T005 controller tests in backend/core/src/modules/daily-tasks/daily-tasks.controller.spec.ts"
Task: "T006 BFF tests in frontend/standys-web/app/api/tasks/update/route.test.ts"
Task: "T007 E2E tests in backend/core/test/app.e2e-spec.ts"
```

## Implementation Strategy

1. Complete T001–T002 and write the US1 tests.
2. Complete T008–T014 to deliver secure task completion and validate the US1 checkpoint.
3. Complete T015–T021 to add task restoration.
4. Run T022–T024 before implementation is complete.

## Notes

- All tasks use the required checklist format, exact paths, and story labels for user-story work.
- `updateCompletionStatus` is the controller-facing business method; `updateDailyTasks` remains its generic persistence delegate.
