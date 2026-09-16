---
description: "Actionable task list for the Overdue Task Sidebar feature"
---

# Tasks: Overdue Task Sidebar

**Input**: specs/003-overdue-task-sidebar/{plan,spec,research,data-model,quickstart}.md and contracts/daily-tasks-api.md

**Tests**: Required by the backend constitution: repository, service, controller, BFF, component/query, and end-to-end coverage.

## Phase 1: Setup

- [X] T001 Review specs/003-overdue-task-sidebar/{plan.md,research.md,data-model.md,contracts/daily-tasks-api.md,quickstart.md} and record existing test commands in feature change notes.

---

## Phase 2: Foundational Prerequisites

**Purpose**: Shared persistence support required before overdue queries are introduced.

- [X] T002 Add @@index([user_id, status, task_date]) to backend/core/prisma/schema.prisma and create its Prisma migration under backend/core/prisma/migrations/.

---

## Phase 3: User Story 1 - Review overdue tasks (Priority: P1) MVP

**Goal**: Render the authenticated user's pending historical tasks once in Last 7 Days, Last 30 Days, and Older, as a desktop right rail and mobile collapsible section.

**Independent Test**: Rows dated 1, 7, 8, 30, and 31 days before the current date render in the correct group; completed, today/future, unowned, and undated rows do not render.

### Tests

- [X] T003 [P] [US1] Add incomplete-overdue repository tests in backend/core/src/modules/daily-tasks/daily-tasks.repository.spec.ts covering existing date behavior, PENDING status, authenticated user_id, linked-task ownership, today/future exclusion, and descending overdue order.
- [X] T004 [P] [US1] Add required taskDate service and guarded-controller tests for incomplete-overdue requests in backend/core/src/modules/daily-tasks/daily-tasks.service.spec.ts and backend/core/src/modules/daily-tasks/daily-tasks.controller.spec.ts.
- [X] T005 [P] [US1] Add taskDate forwarding and 200/validation/401 BFF tests in frontend/standys-web/app/api/tasks/incomplete/route.test.ts.
- [X] T006 [P] [US1] Add grouping, loading, error, and responsive-collapsed component tests in frontend/standys-web/modules/tasks/components/IncompleteTasksSidebar.test.tsx.

### Implementation

- [X] T007 [US1] Create backend/core/src/modules/daily-tasks/dto/incomplete-daily-tasks-query.dto.ts requiring taskDate and preserving existing daily-task date behavior.
- [X] T008 [US1] Add the owned PENDING historical query to backend/core/src/modules/daily-tasks/daily-tasks.repository.ts using existing date handling, linked-task ownership filtering, task inclusion, and newest-first ordering.
- [X] T009 [US1] Add getIncompleteDailyTasks in backend/core/src/modules/daily-tasks/daily-tasks.service.ts and expose guarded validated GET /daily-tasks/incomplete in backend/core/src/modules/daily-tasks/daily-tasks.controller.ts.
- [X] T010 [US1] Implement frontend/standys-web/app/api/tasks/incomplete/route.ts to forward taskDate and preserve upstream status and envelope.
- [X] T011 [US1] Add typed incomplete-task fetching and TanStack overdue-query support in frontend/standys-web/modules/tasks/api/get-incomplete-tasks.ts using the existing current-date value.
- [X] T012 [US1] Build the Stitch-aligned rail and mobile collapsible section in frontend/standys-web/modules/tasks/components/IncompleteTasksSidebar.tsx using existing Card/Item primitives, light borders, compact rows, indigo accents, and three age groups.
- [X] T013 [US1] Compose IncompleteTasksSidebar beside the task list on desktop and below it on mobile in frontend/standys-web/app/(app)/task/page.tsx; leave frontend/standys-web/components/global/sidebar.tsx unchanged.

**Checkpoint**: Query, BFF, TanStack state, group boundaries, and responsive display pass focused tests.

---

## Phase 4: User Story 2 - Bring an overdue task into today (Priority: P1)

**Goal**: Reschedule one owned pending overdue row to today without a duplicate.

**Independent Test**: The selected row becomes pending today work and disappears from overdue; repeat/conflict behavior is idempotent or clearly non-destructive.

### Tests

- [X] T014 [P] [US2] Add refactored updateDailyTasks and carry-forward tests in backend/core/src/modules/daily-tasks/daily-tasks.repository.spec.ts and backend/core/src/modules/daily-tasks/daily-tasks.service.spec.ts for ownership, pending-only eligibility, unchanged completion state, idempotency, and unique (task_date, task_id) conflict.
- [X] T015 [P] [US2] Add valid/invalid/unauthorized carry-forward controller and end-to-end tests in backend/core/src/modules/daily-tasks/daily-tasks.controller.spec.ts and backend/core/test/app.e2e-spec.ts.
- [X] T016 [P] [US2] Add POST /api/tasks/carry-forward proxy tests in frontend/standys-web/app/api/tasks/carry-forward/route.test.ts.
- [X] T017 [P] [US2] Add selected-row disabling, success invalidation, and error-feedback tests in frontend/standys-web/modules/tasks/components/IncompleteTasksSidebar.test.tsx.

### Implementation

- [X] T018 [US2] Create backend/core/src/modules/daily-tasks/dto/carry-forward-daily-task.dto.ts validating positive dailyTaskId and taskDate under existing daily-task date behavior.
- [X] T019 [US2] Refactor the existing updateDailyTasks method in backend/core/src/modules/daily-tasks/daily-tasks.repository.ts without renaming it; always scope id/user/linked-task ownership and accept atomic expected-status/before-date predicates plus a narrow changes payload.
- [X] T020 [US2] Update updateCompletionStatus and add carryForwardDailyTask in backend/core/src/modules/daily-tasks/daily-tasks.service.ts so each owns its business rule while both call updateDailyTasks; expose guarded POST /daily-tasks/carry-forward in backend/core/src/modules/daily-tasks/daily-tasks.controller.ts.
- [X] T021 [US2] Implement POST /api/tasks/carry-forward in frontend/standys-web/app/api/tasks/carry-forward/route.ts and the client helper in frontend/standys-web/modules/tasks/api/carry-forward-task.ts.
- [X] T022 [US2] Add the carry-forward TanStack mutation, today/overdue invalidation, selected-action disablement, and existing toast/redirect failure behavior in frontend/standys-web/modules/tasks/components/IncompleteTasksSidebar.tsx.

**Checkpoint**: Carry-forward reschedules, never duplicates, and refetches both visible task lists.

---

## Phase 5: User Story 3 - Understand an empty overdue list (Priority: P2)

**Goal**: Render a clear, accessible empty state distinct from loading and retrieval failure.

**Independent Test**: With no eligible rows, desktop and mobile show a useful empty state while a failed request remains distinguishable.

- [X] T023 [US3] Add desktop/mobile empty-state accessibility assertions in frontend/standys-web/modules/tasks/components/IncompleteTasksSidebar.test.tsx.
- [X] T024 [US3] Refine no-results, loading, and failed-retrieval rendering in frontend/standys-web/modules/tasks/components/IncompleteTasksSidebar.tsx with accessible collapsed-section semantics and a consistent retry affordance.

---

## Phase 6: Polish & Cross-Cutting Validation

- [X] T025 [P] Run Prisma generation/migration checks and focused daily-task suites from backend/core/package.json; record date-boundary findings in specs/003-overdue-task-sidebar/quickstart.md.
- [X] T026 [P] Run route/component/query tests plus lint/build from frontend/standys-web/package.json; fix only feature-scoped regressions in plan.md-listed files.
- [X] T027 Execute every desktop, mobile, authorization, conflict, date-boundary, and error scenario in specs/003-overdue-task-sidebar/quickstart.md and record the outcome there.

## Dependencies & Execution Order

    T001 -> T002 -> US1 (T003-T013) -> { US2 (T014-T022), US3 (T023-T024) } -> T025-T027

- **US1** supplies the query and reusable sidebar required by US2 and US3.
- **US2** and **US3** can proceed in parallel after US1; US3 does not depend on carry-forward behavior.

## Parallel Opportunities

- T003-T006 are parallel test tasks in separate backend, BFF, and component files.
- T014-T017 are parallel test tasks in distinct backend, BFF, and component files.
- After the US1 contract is stable, US2 backend work (T018-T020) and BFF work (T021) can proceed in parallel; T022 follows.
- After US1, US3 work (T023-T024) can proceed alongside US2.

## Implementation Strategy

1. Complete T001-T002, then deliver and validate US1 as the MVP.
2. Add US2 to make overdue work actionable.
3. Add US3 and run T025-T027 for full validation.

## Notes

- All tasks use the required checklist, sequential ID, user-story label where applicable, and concrete target path.
- The existing exact-date daily-task list is unchanged; no time-zone parameter or local-date helper is introduced by this feature.
- Retain the updateDailyTasks repository method name while expanding it into one scoped persistence primitive; completion and carry-forward remain separate service operations.
