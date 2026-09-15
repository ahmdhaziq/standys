# Implementation Plan: Mark Daily Task Complete

**Branch**: `002-task-completion` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-task-completion/spec.md` plus the requested backend, BFF, and UI update flow.

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Allow an authenticated user to toggle a daily task between incomplete and complete from the task
list. The browser submits the requested status and completion date through a Next.js BFF route to
a guarded NestJS endpoint. `updateCompletionStatus` owns transition validation, timestamp
normalization, and authorization; it delegates the final persistence operation to the reusable
`updateDailyTasks` service method, which uses an ownership-scoped Prisma repository update.
TanStack Query invalidates the existing date-specific task-list query so the UI always presents
the server-confirmed status.

This delivery supports exactly `PENDING → COMPLETED` and `COMPLETED → PENDING`. The first requires
a valid completion timestamp; the second clears it to `null`.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.7 (backend) and TypeScript 5 (frontend)

**Primary Dependencies**: NestJS 11, class-validator/class-transformer, Prisma 7, Next.js 16.3,
React 19, TanStack Query 5, Base UI checkbox

**Storage**: PostgreSQL through Prisma; existing `daily_tasks` model

**Testing**: Jest (backend unit/controller/repository tests); Vitest (frontend route tests); manual
browser validation for the client mutation

**Target Platform**: NestJS HTTP service and Next.js web application

**Project Type**: Web application with backend API and frontend BFF

**Performance Goals**: The confirmed task state is visible within 2 seconds for at least 99% of
successful changes, per SC-002.

**Constraints**: JWT guard required; identity derives only from the request; status must change;
only `PENDING ↔ COMPLETED` transitions are valid; `COMPLETED` requires an ISO timestamp and
`PENDING` requires `completedAt: null`; the target daily task and its linked task (when present)
must belong to that identity; every repository query must enforce this ownership boundary; no
schema migration; use the existing BFF/server-client and `['tasks', taskDate]` query convention.

**Scale/Scope**: Two completion-status transitions, their protected API/BFF path, task-list
mutation and refetch, focused unit/route coverage, and backend E2E coverage. Creation, deletion,
reordering, and filtering remain out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-design gate: PASS**

- **Module ownership**: The backend change stays in `src/modules/daily-tasks`, with its DTO,
  controller, service, repository, and colocated tests.
- **Controller → service → repository**: The controller handles route, guard, DTO binding, and
  request identity; `updateCompletionStatus` handles completion-specific transition, timestamp,
  and authorization decisions; `updateDailyTasks` delegates the normalized patch; the repository
  owns ownership-scoped Prisma reads and updates.
- **Persistence boundary**: PostgreSQL access remains in `DailyTasksRepository` through
  `PrismaService`. Existing fields support the work, so no migration is needed.
- **Defensive boundary**: The DTO has explicit, whitelist-compatible validation. The controller
  obtains the user only from the JWT-authenticated request; it never accepts a user ID in the body.
- **Testing and observability**: Add focused unit tests for controller delegation, both service
  methods, repository ownership-scoped data access, BFF forwarding, and guarded backend E2E
  behavior. Do not log tokens or task payloads unnecessarily.

**Post-design gate: PASS** — the artifacts below preserve these boundaries and do not introduce a
new module, persistence technology, or undocumented exception.

## Project Structure

### Documentation (this feature)

```text
specs/002-task-completion/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
backend/
└── core/
    ├── prisma/schema.prisma                              # Existing daily_tasks model; no migration
    └── src/modules/daily-tasks/
        ├── dto/update-daily-task.dto.ts                  # New request validation contract
        ├── daily-tasks.controller.ts                     # POST /daily-tasks/update
        ├── daily-tasks.service.ts                        # State and ownership validation
        ├── daily-tasks.repository.ts                     # Prisma lookup and update
        ├── daily-tasks.controller.spec.ts
        ├── daily-tasks.service.spec.ts
        └── daily-tasks.repository.spec.ts

frontend/
└── standys-web/
    ├── app/api/tasks/update/route.ts                    # New browser-facing BFF route
    ├── app/api/tasks/update/route.test.ts                # BFF forwarding/error contract test
    ├── modules/tasks/api/update-task.ts                  # Client-side BFF caller
    └── modules/tasks/components/TaskListCard.tsx         # Checkbox mutation and query invalidation
```

**Structure Decision**: Use the existing web-application layout. No module or package is added:
the backend extension belongs to `daily-tasks`, while the frontend extension stays in the existing
`tasks` app-route/BFF/module API/component layers.
