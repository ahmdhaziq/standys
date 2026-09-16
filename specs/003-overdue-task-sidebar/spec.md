# Feature Specification: Overdue Task Sidebar

**Feature Branch**: `003-overdue-task-sidebar`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "I want to build a sidebar that consists of tasks from before current date that has not been completed yet, the sidebar should be on the right, and are classified into last 7 days, 30 days and others(more than 30 days) these tasks should be allowed to be added into today's tasks"

## Clarifications

### Session 2026-09-16

- Q: When an overdue task is added to today, should the original task be rescheduled to today or kept on its past date as a separate copy? → A: Reschedule the existing incomplete task to today.
- Q: Should this feature add an explicit time-zone parameter or change existing date-query behavior? → A: No; keep the existing date behavior for now.
- Q: How should overdue tasks be available on a mobile screen where a permanent right sidebar is impractical? → A: Show a collapsible "Overdue Tasks" section below today's tasks.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review overdue tasks (Priority: P1)

As a task owner, I can see my incomplete tasks dated before today in a right-hand sidebar so that I can identify work that needs attention without leaving my current task view.

**Why this priority**: Visibility of overdue work is the essential value of the feature.

**Independent Test**: Create incomplete tasks with dates in each age range and verify that the sidebar displays every eligible task in its correct group.

**Acceptance Scenarios**:

1. **Given** the user has incomplete tasks dated before today, **When** the task workspace opens, **Then** a sidebar on the right lists those tasks grouped by their age.
2. **Given** an incomplete task dated one to seven calendar days before today, **When** the sidebar is shown, **Then** the task appears in the "Last 7 Days" group.
3. **Given** an incomplete task dated eight to thirty calendar days before today, **When** the sidebar is shown, **Then** the task appears in the "Last 30 Days" group.
4. **Given** an incomplete task dated more than thirty calendar days before today, **When** the sidebar is shown, **Then** the task appears in the "Older" group.
5. **Given** the task workspace is viewed on a mobile screen, **When** overdue tasks are available, **Then** they are available in a collapsible "Overdue Tasks" section below today's tasks.

---

### User Story 2 - Bring an overdue task into today (Priority: P1)

As a task owner, I can add an overdue task from the sidebar to today's task list so that I can deliberately carry it forward and work on it today.

**Why this priority**: The sidebar must lead directly to an actionable recovery workflow, not just a report of overdue work.

**Independent Test**: Select an overdue task from each group, add it to today's tasks, and verify it is available in today's list while remaining incomplete.

**Acceptance Scenarios**:

1. **Given** an overdue task in the sidebar, **When** the user chooses to add it to today's tasks, **Then** the task is scheduled for today and becomes visible in today's task list.
2. **Given** a task has been added to today's tasks, **When** the sidebar refreshes, **Then** that task no longer appears as an overdue task.

---

### User Story 3 - Understand an empty overdue list (Priority: P2)

As a task owner, I receive clear empty-state feedback when there are no overdue incomplete tasks, so that I know there is nothing pending from earlier dates.

**Why this priority**: Clear feedback prevents an empty sidebar from being mistaken for a loading or data problem.

**Independent Test**: Ensure all historical tasks are completed or absent and verify the sidebar communicates that no overdue tasks are available.

**Acceptance Scenarios**:

1. **Given** the user has no incomplete tasks dated before today, **When** the task workspace opens, **Then** the right-hand sidebar shows a clear empty-state message.

---

### Edge Cases

- A task dated today is not overdue and must not appear in the sidebar.
- A completed task dated before today must not appear in the sidebar, including if it had previously been visible there.
- Tasks dated exactly 7, 8, 30, and 31 calendar days before today are grouped consistently at the correct boundaries.
- A task with no assigned task date is not classified as overdue and is excluded from this sidebar.
- If an attempt to add a task to today's list cannot be saved, the task remains in its original sidebar group and the user receives clear feedback.
- If the current date changes while the task workspace is open, the next refresh uses the new current date and recalculates the groups.
- This feature does not introduce a new time-zone parameter or alter the existing date-query behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display an overdue-task sidebar on the right side of the task workspace on larger screens and a collapsible "Overdue Tasks" section below today's tasks on mobile screens.
- **FR-002**: The system MUST include only the current user's incomplete tasks whose assigned task date is before the current date, using the existing daily-task date-query behavior.
- **FR-003**: The system MUST group eligible tasks into "Last 7 Days" (1–7 days old), "Last 30 Days" (8–30 days old), and "Older" (more than 30 days old).
- **FR-004**: The system MUST show each eligible task in exactly one age group and must not show it more than once.
- **FR-005**: The system MUST keep completed tasks, tasks dated today or later, and tasks without an assigned date out of the overdue sidebar.
- **FR-006**: The system MUST provide an action for each listed overdue task to add that task to today's task list.
- **FR-007**: When a user adds an overdue task to today's task list, the system MUST schedule the existing task for the current date without marking it complete or creating a duplicate task.
- **FR-008**: The system MUST update the overdue sidebar and today's task list to reflect a successful add-to-today action.
- **FR-009**: The system MUST show a clear empty state when the current user has no eligible overdue tasks.
- **FR-010**: The system MUST ensure a user can see and add only their own tasks.
- **FR-011**: The system MUST provide a clear, non-destructive failure message if it cannot load overdue tasks or add a task to today's list.

### Key Entities *(include if feature involves data)*

- **Task**: A user-owned work item with a completion state and an optional assigned task date; it can be rescheduled from a prior date to today.
- **Overdue task group**: A calculated classification of an incomplete, historically dated task based on the number of calendar days between its assigned date and today.
- **Today's task list**: The current user's set of tasks assigned to the current calendar date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a representative set of tasks dated 1, 7, 8, 30, and 31 days in the past, 100% are shown in the correct age group and no task appears in more than one group.
- **SC-002**: In usability testing, at least 90% of users can identify an overdue task and add it to today's tasks on their first attempt without assistance.
- **SC-003**: After a successful add-to-today action, the selected task is visible in today's task list and absent from the overdue sidebar within the same task workspace interaction.
- **SC-004**: When a user has no eligible tasks, 100% of tested empty states clearly communicate that no overdue incomplete tasks are available.

## Assumptions

- The existing task model has an assigned task date, a completion state, and an owner.
- "Current date" retains the existing daily-task date-query behavior; this feature does not add a time-zone input or change those semantics.
- Adding a task to today's tasks reschedules the existing incomplete task to today; it does not copy it, complete it, or retain a separate overdue entry.
- The initial scope covers the task workspace where users manage today's tasks; mobile users access the same overdue task groups through a collapsible section below today's tasks.
- Existing authentication and task ownership rules are reused.
