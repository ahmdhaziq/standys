# Standys — Architecture and Technical Development Outline

This document is a working architecture guide based on the current repository implementation. Update it when a module, API contract, persistence model, or deployment boundary changes.

## 1. System purpose

Standys is a task-management web application organized around user registration and login, authenticated access to a task workspace, reusable parent tasks, and date-specific daily task instances.

The current implementation is a modular monolith: the frontend and backend are separate applications, while the backend is one NestJS service with one PostgreSQL database.

## 2. High-level architecture

~~~text
Browser
  |
  | same-origin requests to /api/*
  v
Next.js web app
  - App Router pages and layouts
  - route handlers /api/auth/* and /api/tasks/*
  - httpOnly access_token cookie
  - server API client forwards Bearer token
  - React Query for client-side task reads/mutations
  |
  | server-to-server HTTP using NEST_URL
  v
NestJS Core API
  - Auth, User, Tasks, DailyTasks modules
  - global DTO validation
  - Passport local and JWT strategies
  - services coordinate use cases
  - repositories own Prisma queries
  |
  v
Prisma ORM + PostgreSQL
  - user
  - tasks
  - daily_tasks
~~~

| Boundary | Responsibility | Current implementation |
|---|---|---|
| Browser UI | Forms, task list, navigation, interaction state | React 19 / Next.js App Router |
| Next.js web tier | Same-origin API, cookie handling, auth forwarding | Route handlers plus lib/api/server-client.ts |
| Core API | Authentication, validation, business operations | NestJS 11 |
| Persistence | Relational data and migrations | PostgreSQL 15, Prisma 7 |
| Local infrastructure | Development database | backend/core/docker-compose.yml |

## 3. Repository layout

~~~text
standys/
├── backend/core/
│   ├── src/
│   │   ├── infrastructure/prisma/       # PrismaService and module
│   │   ├── modules/auth/                 # register, login, JWT/local auth
│   │   ├── modules/user/                 # user service/repository
│   │   ├── modules/tasks/                # reusable task operations
│   │   ├── modules/daily-tasks/          # date-specific task instances
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/schema.prisma
│   ├── prisma/migrations/
│   └── docker-compose.yml
└── frontend/standys-web/
    ├── app/                              # routes, layouts, route handlers
    ├── modules/auth/                     # auth UI and API functions
    ├── modules/tasks/                    # task UI, schemas, API functions
    ├── components/global/                # shared application UI
    ├── components/ui/                    # reusable UI primitives
    ├── lib/api/                          # server API client and response types
    ├── middleware/auth.middleware.ts
    └── proxy.ts
~~~

## 4. Backend architecture

### Application bootstrap

backend/core/src/main.ts creates the Nest application and configures a global ValidationPipe with whitelist, forbidNonWhitelisted, and transform enabled; permissive CORS; and the HTTP port from PORT, defaulting to 3000. AppModule loads global configuration plus AuthModule, UserModule, TasksModule, and DailyTasksModule.

### Module responsibilities

#### Auth module

Files: backend/core/src/modules/auth/

- AuthController: POST /auth/register, POST /auth/login, GET /auth/me.
- AuthService: duplicate-user check, password hashing, credential validation, JWT creation.
- LocalStrategy: validates email/password for login.
- JwtStrategy: reads a Bearer token and maps its payload to the authenticated user.
- JwtAuthGuard: reusable JWT guard for protected endpoints.
- RegisterDto: backend registration validation and password policy.

The API returns an access token from login. The Next.js route handler stores it in an httpOnly cookie; browser JavaScript does not receive the token directly.

Authentication uses a short-lived access JWT and a separately signed refresh JWT. Access tokens
expire after 15 minutes; refresh tokens expire after 7 days. The frontend BFF stores both in
HttpOnly, SameSite=Lax cookies and uses the refresh token server-side to call `POST /auth/refresh`
when a protected request receives an expired-access response. The backend persists only a hash and
metadata for each refresh session, so logout can revoke the session without storing a usable raw
refresh token. Signing secrets are supplied through `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
environment variables and must not be logged or committed.

#### User module

Files: backend/core/src/modules/user/

This is currently a service/repository module rather than a complete public user API. UserService is the application-facing abstraction; UserRepository owns Prisma queries; UserController is currently empty.

#### Tasks module

Files: backend/core/src/modules/tasks/

This module owns reusable task records. The service supports create, lookup, list-by-user, and update; however, TasksController currently has no routes. Daily-task creation calls TasksService internally.

#### Daily Tasks module

Files: backend/core/src/modules/daily-tasks/

This is the active task workflow:

- POST /daily-tasks/create creates a daily instance for an existing task, or creates a parent task and daily instance in one transaction.
- GET /daily-tasks/list?taskDate=YYYY-MM-DD returns the authenticated user’s daily tasks for a date and includes the related parent task.
- DailyTasksRepository owns date-range queries and persistence.
- DailyTasksService coordinates TasksService, DailyTasksRepository, and Prisma transactions.

### Backend layering rule

~~~text
Controller -> Service/use case -> Repository -> PrismaService -> PostgreSQL
                         \-> other services for cross-module business rules
~~~

Controllers should authenticate, validate, extract the current user, and delegate. Services should enforce business rules. Repositories should contain database access and query shaping. Do not put Prisma queries in controllers or frontend route handlers.

## 5. Frontend architecture

### App Router and layouts

- app/layout.tsx is the root layout and installs React Query providers and the toaster.
- app/(app)/layout.tsx wraps authenticated application pages with the sidebar.
- app/(app)/task/page.tsx is the current task workspace.
- app/auth/login/page.tsx and app/auth/register/page.tsx are authentication pages.

### Browser-to-API pattern

Browser components call same-origin Next.js routes such as /api/auth/login and /api/tasks/create. These route handlers call the NestJS API through lib/api/server-client.ts.

The server client reads access_token from the incoming request cookie, adds Authorization: Bearer <token>, sends requests to NEST_URL or http://localhost:3000, and normalizes responses into ApiResponse<T>. This BFF-style boundary keeps the NestJS API URL and token out of ordinary browser code.

### Feature organization

Feature-specific code belongs under modules/<feature>/ with api/, components/, and schema/ subdirectories. Shared primitives belong under components/ui. Cross-feature API and response behavior belongs under lib/api.

### Authentication protection

proxy.ts applies authMiddleware to /task/:path*. The middleware checks for the cookie and calls /auth/me; missing or invalid authentication redirects to /auth/login. Expand this to the complete authenticated route group and keep API-route behavior consistent with backend JWT validation.

## 6. Persistence model

~~~text
user 1 --------< tasks
  |                |
  +--------------< daily_tasks >---- 0..1 tasks
~~~

### user

Integer primary key, unique email, name, bcrypt password hash, timestamps, and relations to tasks and daily_tasks.

### tasks

Integer primary key, user_id owner, title, nullable description, timestamps, and relation to optional/multiple daily_tasks instances.

### daily_tasks

Integer primary key, user_id owner, nullable task_id parent reference, task_date, free-form status, nullable completed_at, timestamps, and a unique constraint on (task_date, task_id).

The model supports reusable tasks and date-specific instances. Keep that distinction explicit: a task is the durable definition; a daily task is a user/date/status occurrence.

## 7. Main request flows

### Registration

~~~text
RegisterCard -> POST /api/auth/register -> Next.js route handler
  -> POST /auth/register -> AuthService hashes password
  -> UserRepository inserts user -> sanitized response
~~~

### Login

~~~text
LoginCard -> POST /api/auth/login -> Next.js route handler
  -> POST /auth/login -> LocalStrategy/AuthService validates credentials
  -> JWT returned -> Next.js sets httpOnly access_token cookie
  -> browser navigates to /task
~~~

### Create and list today’s tasks

~~~text
CreateTask -> POST /api/tasks/create -> POST /daily-tasks/create
  -> existing task creates daily_tasks row
  -> no taskId transaction creates tasks row and daily_tasks row

TaskListCard -> React Query [tasks, todayDate]
  -> GET /api/tasks/list?taskDate=YYYY-MM-DD
  -> GET /daily-tasks/list with Bearer token
  -> date-range query includes parent task -> list renders rows
~~~

## 8. API contract currently implemented

| Method | Path | Auth | Purpose |
|---|---|---:|---|
| POST | /auth/register | No | Create a user |
| POST | /auth/login | No | Validate credentials and return JWT |
| GET | /auth/me | JWT | Return the authenticated token subject |
| POST | /daily-tasks/create | JWT | Create an instance, optionally with a new parent task |
| GET | /daily-tasks/list?taskDate=YYYY-MM-DD | JWT | List the user’s daily tasks for a date |

### Planned task API

| Method | Suggested path | Purpose |
|---|---|---|
| GET | /tasks | List reusable tasks for the current user |
| GET | /tasks/:id | Read one owned task |
| PATCH | /tasks/:id | Update an owned task |
| DELETE | /tasks/:id | Archive/delete an owned task according to product policy |
| PATCH | /daily-tasks/:id/status | Complete/reopen a daily instance |

## 9. Important current gaps and risks

### Correctness and domain rules

1. Task ownership is not enforced consistently. createDailyTask looks up an arbitrary taskId without verifying ownership. All reads, updates, and deletes must scope by user_id.
2. Status values are inconsistent: backend creation uses PENDING while the frontend checks lowercase completed. Introduce a shared status enum and normalize API values.
3. Date handling needs one explicit policy. Creation uses the current UTC timestamp, while listing builds a UTC day range from a date string. Decide whether dates are UTC or user-local and apply that policy consistently.
4. The list range uses lte for the end boundary. Prefer gte start and lt end to avoid including a record at the next day’s midnight.
5. The unique constraint does not prevent duplicate null-parent daily tasks in PostgreSQL. Define the intended uniqueness rule explicitly.
6. Completion and update operations are not implemented end-to-end. The UI renders checkboxes and an overflow button, but no mutation is wired for completion, editing, or deletion.

### Security

1. Move the JWT secret out of source constants and require it through validated configuration.
2. Restrict CORS to the deployed web origin; origin * with credentials is unsafe and invalid in many browser configurations.
3. Use typed Nest exceptions such as UnauthorizedException and NotFoundException instead of generic Error for API failures.
4. Do not log tokens, response objects, or sensitive request details in production.
5. Decide whether registration returns a sanitized user, a success envelope, or an authenticated session; document the contract.
6. Use secure deployment cookie settings and define an expiration/refresh strategy.
7. Consider short-lived access tokens plus refresh-token rotation before production use.

### Contract and validation

1. Align frontend Zod schemas with backend DTOs. The frontend creates a schema but CreateTask does not currently pass it to react-hook-form.
2. Make optional fields truly optional in TypeScript and avoid sending null unless the backend DTO accepts it.
3. Define one response envelope with stable success, data, error, and meta fields. The frontend meta type is currently incorrectly generic over T.
4. Add typed response models for user, task, and daily-task records.
5. Remove debug logging and add structured request/error logging at the backend boundary.

### Architecture and maintainability

1. Separate frontend and backend package roots have no root-level workspace orchestration. Add documented commands or a workspace tool for install, dev, test, and build.
2. Backend starter tests only assert that providers/controllers are defined. Replace them with service, repository, auth, and HTTP contract tests.
3. Add a database lifecycle strategy for local, test, staging, and production environments; never reuse shared development credentials outside local development.
4. Add API documentation, such as OpenAPI, once endpoint shapes stabilize.
5. Establish naming conventions. Current Prisma names are lower-case plural while TypeScript classes are inconsistent; new code should follow one documented convention.

## 10. Recommended development sequence

### Phase 0 — Stabilize the baseline

- make frontend and backend start commands and environment variables explicit;
- run type-check, lint, unit tests, and a local smoke test;
- remove debug logging;
- fix current compile/runtime errors before adding features;
- introduce a shared status enum and response types;
- add an error-handling policy and typed exceptions.

### Phase 1 — Secure and complete authentication

- validate JWT_SECRET, DATABASE_URL, NEST_URL, and PORT at startup;
- make JWT secret and expiry configurable;
- tighten CORS and cookie settings;
- standardize 401 handling in Next.js route handlers and proxy protection;
- add logout by clearing the cookie;
- add tests for registration, duplicate email, invalid credentials, expired token, and /auth/me.

### Phase 2 — Establish the task domain contract

- define task and daily-task status enums;
- define date/time semantics and a canonical API format;
- enforce ownership in every repository query;
- add NotFoundException and authorization behavior for foreign IDs;
- fix date range boundaries and duplicate-instance rules;
- decide archive/delete semantics for parent tasks and daily instances.

### Phase 3 — Finish the core task workflow

- implement protected TasksController routes;
- implement complete/reopen daily-task status mutation;
- implement edit and delete/archive actions;
- add React Query mutations and cache invalidation;
- add loading, empty, error, and unauthorized UI states;
- add pagination/filtering only when expected data volume requires it.

### Phase 4 — Improve product structure

- replace hard-coded greeting/date with authenticated user and locale-aware date data;
- add a user/session abstraction on the frontend;
- extract task list row and action menu components;
- add reusable form validation/error presentation;
- add accessibility coverage for keyboard use, labels, focus, and status announcements.

### Phase 5 — Production readiness

- define deployment topology and secrets management;
- run migrations as an explicit release step;
- add health/readiness endpoints;
- add structured logs, error tracking, metrics, and database backups;
- add CI for install, type-check, lint, unit tests, e2e tests, migration validation, and production builds;
- perform a security review of auth, cookies, CORS, rate limiting, and input validation.

## 11. Testing strategy

### Backend

- Unit tests: AuthService, DailyTasksService, TasksService, and repositories with mocked Prisma.
- Integration tests: Prisma repositories against an isolated PostgreSQL database.
- HTTP/e2e tests: register -> login -> authenticated daily-task create -> list -> status update.
- Regression cases: foreign task IDs, duplicate dates, invalid date strings, expired JWTs, malformed DTOs, and boundary timestamps.

### Frontend

- validate schemas independently;
- test API functions against mocked route responses;
- test login/register success and error states;
- test task list loading/empty/error states;
- test create, complete, reopen, edit, and delete flows with React Query cache behavior;
- run a browser smoke test for protected-route redirect and cookie-backed requests.

## 12. Definition of done for a new feature

1. Domain behavior and ownership rules are defined.
2. Backend DTOs, service behavior, repository queries, and exceptions are implemented.
3. The API contract and response envelope are documented.
4. Frontend schemas and TypeScript types match the API.
5. Loading, empty, validation, unauthorized, and server-error states are handled.
6. Tests cover the primary path and likely failure paths.
7. Database changes include a migration and a forward-migration plan.
8. Logs do not expose credentials, tokens, or unnecessary personal data.
9. Lint, type-check, tests, and production builds pass.

## 13. Suggested next slice

The highest-value next increment is to complete the daily-task lifecycle:

1. introduce a shared DailyTaskStatus enum;
2. add ownership-safe PATCH /daily-tasks/:id/status;
3. correct date range and date validation;
4. wire the checkbox to a React Query mutation;
5. add service and HTTP tests for complete/reopen and foreign-record rejection;
6. remove current debug logs and fix the frontend form schema hookup.

This slice exercises the full stack—database, repository, service, controller, auth, Next.js proxy, API route, React Query, and UI—and establishes the conventions needed for subsequent task features.
