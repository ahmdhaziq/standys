# Implementation Plan: Overdue Task Sidebar

**Branch**: `003-overdue-task-sidebar` | **Date**: 2026-09-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification plus user-provided backend, BFF, TanStack Query, and Stitch design direction.

## Summary

Show each user's pending daily tasks dated before today in a right-hand desktop rail and a collapsible mobile section. The existing exact-date list remains unchanged; a new guarded overdue-list query and carry-forward action use the existing daily-task date behavior to reschedule one existing row to today. The Next.js BFF will proxy the new read and mutation; TanStack Query will fetch, mutate, and invalidate today's and overdue task state. The visual treatment follows Stitch's **Today Dashboard with Inline Add Task** screen: a narrow, white right rail with light borders, compact task rows, section headings, and indigo action accents.

The repository retains the `updateDailyTasks()` method name, refactoring it into one ownership-scoped persistence primitive. Completion and carry-forward remain separate service operations with their own business-rule validation.

## Technical Context

**Language/Version**: TypeScript; NestJS backend; Next.js 16.3.3 and React 19.2.8 frontend

**Primary Dependencies**: Prisma, PostgreSQL, class-validator, JWT guards; TanStack React Query 5.102.8, Tailwind CSS 4, Base UI, Lucide

**Storage**: PostgreSQL `daily_tasks` and related `tasks` records through Prisma

**Testing**: Backend Jest unit/controller/repository and e2e tests; frontend route-handler tests and component/query tests using the repository's existing tooling

**Target Platform**: Authenticated web task workspace, responsive desktop and mobile browsers

**Project Type**: Web application with NestJS API, Next.js BFF, and browser UI

**Performance Goals**: Overdue list and carry-forward state update become visible in the active workspace interaction; the initial feature targets a user's normal task history, with query filtering and ordering performed in persistence.

**Constraints**: Authenticated user identity is derived only from the JWT; the feature preserves the existing daily-task date-query behavior and adds no time-zone input; completed tasks and today/future tasks are excluded from the overdue list; carry-forward is idempotent and must not duplicate a daily task.

**Scale/Scope**: One user-scoped overdue list, three client-presented age groups (1–7, 8–30, and >30 days), one carry-forward action per row, desktop rail and mobile collapsible section. No changes to global navigation or parent task content are in scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-design gate: PASS**

- Daily-task behavior remains within the existing `daily-tasks` module and preserves controller → service → repository flow.
- Prisma remains the only persistence boundary. The overdue filter uses user ownership and linked-task ownership inside the repository query.
- Both new endpoints use the existing JWT guard; the controller derives the user from the request and never accepts a caller-supplied user ID.
- Query parameters and mutation input use DTO validation. The carry-forward transition is explicit and does not reuse the status-only completion contract.
- Tests cover repository scope/date/status behavior, service transition rules, guarded controller contracts, BFF proxy behavior, and UI state transitions.

**Post-design gate: PASS**

The design adds no cross-module shortcut, direct database access, or unscoped user query. An index on `(user_id, status, task_date)` is included in the planned Prisma migration to keep the historical pending-task read bounded.

## Project Structure

### Documentation (this feature)

```text
specs/003-overdue-task-sidebar/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)

```text
backend/
└── core/
    ├── prisma/schema.prisma
    ├── src/modules/daily-tasks/
    │   ├── dto/
    │   ├── daily-tasks.controller.ts
    │   ├── daily-tasks.service.ts
    │   ├── daily-tasks.repository.ts
    │   └── *.spec.ts
    └── test/app.e2e-spec.ts

frontend/standys-web/
├── app/(app)/task/page.tsx
├── app/api/tasks/
│   ├── incomplete/route.ts
│   └── carry-forward/route.ts
├── modules/tasks/
│   ├── api/
│   └── components/
└── app/api/tasks/**/*.test.ts
```

**Structure Decision**: Keep the existing modular NestJS daily-tasks backend and the Next.js task module. The page composes a task-list main column with a feature-local overdue component; it does not alter the persistent global sidebar.

## Complexity Tracking

No constitution violations or exceptions are required.
