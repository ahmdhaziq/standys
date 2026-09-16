# Research: Overdue Task Sidebar

## Decisions

### Preserve the existing exact-date list contract

**Decision**: Add a dedicated incomplete-overdue query and endpoint instead of changing `GET /daily-tasks/list`.

**Rationale**: The existing list endpoint is an exact-date daily-task lookup. Preserving it avoids a contract change for current callers and keeps its established date behavior intact. The dedicated endpoint makes overdue behavior explicit.

**Alternatives considered**:

- Branch the current `getDailyTasks` method on whether the requested date is today: rejected because it changes an established date-list contract.
- Fetch every historical daily task and filter in the browser: rejected because status and ownership filtering belong in the repository and it transfers unnecessary data.

### Use a user-scoped pending-task repository query

**Decision**: Query daily-task rows where `user_id` matches the JWT user, `status` is exactly `PENDING`, `task_date` is before the local start of the reference date, and linked parent tasks are either absent or owned by the same user. Include the related parent task and order newest overdue dates first.

**Rationale**: This exactly implements the eligibility rules while preserving the module's existing ownership filter. The client receives enough information (`id`, `task_date`, status, parent-task title/description) to render and group rows.

**Alternatives considered**:

- Filter only by daily-task owner: rejected because the current repository also protects against incorrectly linked parent tasks.
- Return server-computed groups: deferred; client grouping is appropriate because the UI owns the three visible sections and has the reference date already.

### Carry overdue work forward by rescheduling one row

**Decision**: Add a dedicated guarded carry-forward command that moves one owned, pending daily-task row to the supplied local today rather than creating another row or changing completion status.

**Rationale**: The completion endpoint intentionally permits only `PENDING ↔ COMPLETED`, so reusing it would weaken transition validation. A focused command keeps the pending state and avoids duplicates.

**Alternatives considered**:

- Reuse the status update endpoint: rejected because it accepts no date and protects completion-only state transitions.
- Create a new daily-task row: rejected by the clarified specification because it duplicates work.

### Preserve existing date handling

**Decision**: Do not introduce an IANA time-zone parameter or new local-day-boundary conversion. The incomplete-overdue query and carry-forward command use the existing daily-task date handling.

**Rationale**: This keeps the established API and date behavior unchanged while delivering the sidebar workflow. Explicit device-local time-zone behavior can be planned as a separate future enhancement.

**Alternatives considered**:

- Add a device-supplied IANA time-zone parameter now: deferred to avoid changing the existing list contract and date semantics in this feature.

### Reuse the Stitch dashboard's right-rail visual language

**Decision**: Add a feature-local `IncompleteTasksSidebar` beside `TaskListCard` on desktop and a collapsible inline section below it on mobile. Use existing card/item primitives, light neutral surfaces, compact bordered rows, indigo emphasis, and task-type headings from the referenced Stitch screen.

**Rationale**: The Stitch reference shows a narrow right rail adjacent to the main task card, with lightweight sections and compact task entries. Keeping the component local avoids changing the application-wide navigation sidebar.

**Alternatives considered**:

- Add overdue tasks to `components/global/sidebar.tsx`: rejected because it is persistent global navigation rather than task-workspace content.
- Use a mobile drawer: rejected by the clarification selecting an inline collapsible section.

### Cache and mutation handling

**Decision**: Use TanStack Query with an overdue key containing the current date under existing daily-task date handling. After carry-forward succeeds, invalidate both the overdue key and the today's-task key (or the established broad task key) so both views refetch.

**Rationale**: The action changes membership in two independently rendered lists. Targeted invalidation prevents stale overdue rows and stale today's tasks.

**Alternatives considered**:

- Local-only removal/addition: rejected because server conflict handling and timestamps can make the client state diverge.
- A separate state management library: rejected because React Query is already configured and used for daily tasks.
