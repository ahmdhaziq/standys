# Tasks: Extend Authenticated Session

**Input**: Design documents from `/specs/001-extend-auth-session/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because the backend constitution requires meaningful unit, contract, and
end-to-end coverage for authentication, persistence, authorization, and security behavior.

**Organization**: Tasks are grouped by user story to preserve independently testable delivery.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish configuration and migration inputs used by every story.

- [x] T001 Add separate access-token and refresh-token secret configuration with required environment-backed values in `backend/core/src/modules/auth/constants.ts` and `backend/core/src/modules/auth/auth.module.ts`
- [x] T002 [P] Document access/refresh secret, 15-minute access lifetime, and 7-day refresh lifetime requirements in `backend/core/README.md`
- [x] T003 [P] Add the refresh-session model and user relation with the exact fields `id`, `user_id`, `jti`, `token_hash`, `expires_at`, nullable `revoked_at`, `created_at`, and `updated_at` in `backend/core/prisma/schema.prisma`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the persistence and contract foundation required by both user stories.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T004 Create and verify the Prisma migration for the refresh-session table, including the foreign key to `user.id`, an index for active-session lookup, and the unique refresh `jti` constraint in `backend/core/prisma/migrations/<timestamp>_add_refresh_sessions/migration.sql`
- [x] T005 [P] Generate updated Prisma client types from `backend/core/prisma/schema.prisma` into `backend/core/generated/prisma/`
- [x] T006 Implement refresh-session persistence operations for create, find-by-`jti`, and revoke in `backend/core/src/modules/auth/auth.repository.ts`, storing only `token_hash` and never the raw refresh token
- [x] T007 Register `AuthRepository` and `PrismaModule` wiring in `backend/core/src/modules/auth/auth.module.ts` without exposing Prisma calls to controllers
- [x] T008 [P] Create and validate the refresh request DTO with required `refresh_token` input in `backend/core/src/modules/auth/dto/refresh-token.dto.ts`
- [x] T009 [P] Extend auth token claim types to distinguish access and refresh tokens, including `sub`, `email`, `jti`, token type, and expiration claims in `backend/core/src/modules/auth/types/payload.ts`

**Checkpoint**: Refresh-session storage, token contracts, and module wiring are ready.

---

## Phase 3: User Story 1 - Continue Working Without Reauthentication (Priority: P1) 🎯 MVP

**Goal**: Issue a signed 7-day refresh token at login, keep it in an HttpOnly cookie, and use it
to obtain a new 15-minute access token after access expiry without prompting for credentials.

**Independent Test**: Log in once, advance time beyond 15 minutes but remain within 7 days, call
the frontend refresh route, and successfully call a protected endpoint with the new access token.

### Tests for User Story 1

- [x] T010 [P] [US1] Add auth-service tests proving `login()` issues a 15-minute access token and a signed 7-day refresh token, persists the refresh hash/jti, and never returns a raw token outside the login response in `backend/core/src/modules/auth/auth.service.spec.ts`
- [x] T011 [P] [US1] Add controller contract tests for `POST /auth/refresh` success, missing refresh token, and generic unauthenticated failure responses in `backend/core/src/modules/auth/auth.controller.spec.ts`
- [x] T012 [P] [US1] Add frontend login and refresh route tests verifying both cookies are HttpOnly, `access_token` uses a 15-minute lifetime, `refresh_token` uses a 7-day lifetime, and browser JSON contains no token values in `frontend/standys-web/app/api/auth/login/route.test.ts` and `frontend/standys-web/app/api/auth/refresh/route.test.ts`

### Implementation for User Story 1

- [x] T013 [US1] Extract a shared access-token issuance function and add refresh-token issuance with a separate secret, `jti`, refresh type claim, and 7-day expiry in `backend/core/src/modules/auth/auth.service.ts`
- [x] T014 [US1] Update `AuthService.login()` to create the refresh session through `AuthRepository` and return `access_token` plus `refresh_token` in the existing success envelope in `backend/core/src/modules/auth/auth.service.ts`
- [x] T015 [US1] Implement `AuthService.validateRefreshToken()` to verify the refresh signature/type/expiry, find the active session by `jti`, compare the presented token hash, and issue a new access token only when the session is active in `backend/core/src/modules/auth/auth.service.ts`
- [x] T016 [US1] Add `POST /auth/refresh` with the refresh DTO and delegate to `validateRefreshToken()` while returning one generic unauthenticated error for every invalid refresh case in `backend/core/src/modules/auth/auth.controller.ts`
- [x] T017 [US1] Configure the frontend login route to set HttpOnly `access_token` and `refresh_token` cookies with `SameSite=Lax`, `/` path, production `Secure`, and 15-minute/7-day lifetimes in `frontend/standys-web/app/api/auth/login/route.ts`
- [x] T018 [US1] Add the frontend `/api/auth/refresh` BFF route to read the HttpOnly refresh cookie, call backend `/auth/refresh`, set the renewed access cookie, and clear auth cookies on failure in `frontend/standys-web/app/api/auth/refresh/route.ts`
- [x] T019 [US1] Update the server API client to make one refresh attempt after an expired access response, retry the original protected request once, and stop on refresh failure in `frontend/standys-web/lib/api/server-client.ts`
- [x] T020 [US1] Update authentication middleware to recognize the refreshed access cookie and redirect only after refresh fails in `frontend/standys-web/middleware/auth.middleware.ts`

**Checkpoint**: User Story 1 is independently functional; a user can work past 15 minutes and
renew access without re-entering credentials.

---

## Phase 4: User Story 2 - Reauthenticate After the Session Limit (Priority: P2)

**Goal**: Enforce the 7-day refresh lifetime and explicit revocation so expired, malformed, or
logged-out sessions cannot continue to access protected resources.

**Independent Test**: Attempt refresh with an expired, revoked, wrongly signed, and malformed
refresh token, then log out and confirm the previous refresh session is rejected.

### Tests for User Story 2

- [x] T021 [P] [US2] Add service tests for expired, revoked, wrong-secret, wrong-type, malformed, and hash-mismatched refresh tokens returning the same unauthenticated failure in `backend/core/src/modules/auth/auth.service.spec.ts`
- [x] T022 [P] [US2] Add repository tests for active-session lookup, revocation timestamp updates, and user/session ownership in `backend/core/src/modules/auth/auth.repository.spec.ts`
- [x] T023 [P] [US2] Add backend e2e coverage for login → refresh → protected request and expired/revoked refresh rejection in `backend/core/test/app.e2e-spec.ts`
- [x] T024 [P] [US2] Add frontend logout-route tests verifying both auth cookies are cleared after successful, expired, and already-revoked backend sessions in `frontend/standys-web/app/api/auth/logout/route.test.ts`

### Implementation for User Story 2

- [x] T025 [US2] Add `AuthService.logout()` to validate the presented refresh token enough to identify its session, revoke it through `AuthRepository`, and remain idempotent for expired or already-revoked sessions in `backend/core/src/modules/auth/auth.service.ts`
- [x] T026 [US2] Add `POST /auth/logout` with the refresh DTO and a generic success response that does not reveal session state in `backend/core/src/modules/auth/auth.controller.ts`
- [x] T027 [US2] Add the frontend `/api/auth/logout` BFF route to forward the HttpOnly refresh cookie, clear both auth cookies regardless of backend session state, and return a generic success response in `frontend/standys-web/app/api/auth/logout/route.ts`
- [x] T028 [US2] Ensure the JWT strategy accepts only access-token claims and continues to derive the authenticated user from verified claims in `backend/core/src/modules/auth/strategy/jwt.strategy.ts`
- [x] T029 [US2] Remove token/response logging and prevent refresh values, hashes, and secrets from appearing in auth error paths in `backend/core/src/modules/auth/auth.service.ts`, `frontend/standys-web/app/api/auth/login/route.ts`, and `frontend/standys-web/lib/api/server-client.ts`

**Checkpoint**: User Stories 1 and 2 both work independently; active sessions renew, while expired
or revoked sessions require login.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete flow, documentation, security posture, and regression safety.

- [x] T030 [P] Add explicit refresh-cookie and access-cookie policy documentation, including local HTTP versus production `Secure` behavior, to `docs/architecture-and-technical-outline.md`
- [x] T031 [P] Add a refresh-session cleanup/index review and confirm migration rollback implications in `backend/core/prisma/schema.prisma` and `backend/core/prisma/migrations/<timestamp>_add_refresh_sessions/migration.sql`
- [x] T032 Run backend unit, e2e, build, frontend lint, and frontend build commands from `specs/001-extend-auth-session/quickstart.md` and record any environment-specific prerequisites in `specs/001-extend-auth-session/quickstart.md`
- [x] T033 Run a security review against `specs/001-extend-auth-session/contracts/auth-refresh.md`, checking HttpOnly/Secure/SameSite cookies, separate signing secrets, generic errors, no raw-token persistence, and one-retry behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; configuration and schema preparation can begin immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks both user stories.
- **Phase 3 (US1)**: Depends on Phase 2 and delivers the MVP refresh flow.
- **Phase 4 (US2)**: Depends on Phase 2 and integrates with US1’s refresh-session implementation;
  revocation tests require the refresh flow from US1.
- **Phase 5 (Polish)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on US2.
- **US2 (P2)**: Starts after Phase 2, but its logout/revocation behavior extends the session
  implementation delivered by US1.

### Dependency Graph

```text
Phase 1 → Phase 2 → US1 (MVP) → US2 → Phase 5
                    └───────────────┘
```

### Parallel Opportunities

- T002 and T003 can run in parallel after task scope is confirmed.
- T005, T008, and T009 can run in parallel after the schema shape in T003 is agreed.
- T010–T012 can run in parallel because they target separate test concerns/files.
- T021–T024 can run in parallel because they target separate unit, repository, e2e, and frontend
  test surfaces.
- T030 and T031 can run in parallel with each other after implementation stabilizes.

## Parallel Example: User Story 1

```text
Task T010: AuthService login/refresh issuance tests
Task T011: AuthController refresh contract tests
Task T012: Frontend login/refresh cookie tests
```

These tests can be authored in parallel, then T013–T020 implement the behavior they cover in
dependency order.

## Parallel Example: User Story 2

```text
Task T021: AuthService invalid/revoked-token tests
Task T022: AuthRepository active/revocation tests
Task T023: Backend e2e expiry/revocation tests
Task T024: Frontend logout cookie tests
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tests and implementation.
3. Validate login, 15-minute access expiry, 7-day refresh validity, HttpOnly cookies, and one
   refresh retry.
4. Stop and demo the uninterrupted authenticated workflow.

### Incremental Delivery

1. Deliver US1 as the usable refresh-session MVP.
2. Add US2 revocation, logout, and hostile-token handling.
3. Finish security review, docs, and quickstart validation.

## Notes

- Every task uses the required `- [ ] [TaskID] [P?] [Story?]` checklist form.
- `[P]` appears only where tasks target independent files or concerns with no incomplete dependency.
- The feature intentionally does not rotate refresh tokens in this slice; rotation and reuse
  detection are documented as a future security enhancement in `research.md`.

## Implementation Status Notes

- T012, T024, and T032 were completed during Phase 6 after adding Vitest, fixing the e2e VM-module
  launch configuration, and recording the full quickstart validation results.

---

## Phase 6: Convergence

**Purpose**: Close the remaining validation and frontend test-harness gaps identified by
`$speckit-converge`.

- [x] T034 [P] Add a frontend test runner and test script in `frontend/standys-web/package.json` with the minimal configuration needed to import Next route handlers and mock server-side cookies/API calls.
- [x] T035 [P] [US1] Add executable login and refresh route tests covering HttpOnly cookies, 15-minute access lifetime, 7-day refresh lifetime, token-free browser JSON, refresh success, and refresh failure cleanup in `frontend/standys-web/app/api/auth/login/route.test.ts` and `frontend/standys-web/app/api/auth/refresh/route.test.ts`.
- [x] T036 [P] [US2] Add executable logout route tests covering successful, expired, and already-revoked refresh sessions and clearing both auth cookies in `frontend/standys-web/app/api/auth/logout/route.test.ts`.
- [x] T037 Configure the backend e2e Jest environment to load the ESM `@nestjs/config` dependency and project path aliases, then run the database-backed scenarios from `backend/core/test/app.e2e-spec.ts` with documented test database prerequisites in `backend/core/test/jest-e2e.json` and `specs/001-extend-auth-session/quickstart.md`.
- [x] T038 Run the complete quickstart validation after T034–T037, including backend unit/e2e/build/Prisma checks and frontend test/lint/build checks, and record the final results in `specs/001-extend-auth-session/quickstart.md`.
