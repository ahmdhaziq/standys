# Implementation Plan: Extend Authenticated Session

**Branch**: `001-extend-auth-session` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-extend-auth-session/spec.md`

## Summary

Replace the current 15-minute-only login experience with a two-token session flow. Login will
issue the existing short-lived access JWT plus a separately signed refresh JWT with a 7-day
lifetime. The frontend server boundary will keep both values in HttpOnly cookies. When the access
token expires, the frontend boundary will call the backend `/auth/refresh` endpoint; the auth
service will verify the refresh JWT, compare its identifier and hash with an active persisted
refresh session, and issue a new access JWT without asking the user to log in again.

The refresh token will not be returned to browser JavaScript. Only its hash and session metadata
will be persisted server-side. Logout/revocation is included so a stolen or superseded refresh
session can no longer be used.

The requested 7-day refresh-token lifetime supersedes the earlier specification’s provisional
30-day session assumption. In this implementation slice, reauthentication is required when the
7-day refresh session expires or is revoked; extending sessions beyond that point is out of scope.

## Technical Context

**Language/Version**: TypeScript on Node.js; existing NestJS project configuration

**Primary Dependencies**: NestJS Passport/JWT modules, Prisma ORM, PostgreSQL, Next.js route
handlers and server-side cookie APIs

**Storage**: PostgreSQL through Prisma; add a refresh-session table related to `user`

**Testing**: Jest unit tests for auth service/controller and repository; backend e2e contract
tests; frontend route-handler tests for cookie and refresh behavior

**Target Platform**: NestJS HTTP API with the existing Next.js web BFF

**Project Type**: Web application with a backend web service

**Performance Goals**: Refresh requests complete within the existing authentication request
latency budget and do not add a refresh request while the access token remains valid

**Constraints**: Access JWT remains short-lived at 15 minutes; refresh JWT expires after 7 days;
refresh values are HttpOnly and never exposed to browser JavaScript; raw refresh values are not
stored in the database or logs; protected user identity and authorization behavior remain
unchanged

**Scale/Scope**: One refresh session per login/device is supported; this feature covers login,
refresh, cookie relay, expiry, revocation, and authentication regression tests, not account
management or password recovery

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Modular Feature Ownership**: PASS — backend changes remain within the `auth` module, with
  persistence details isolated in an auth repository/session repository.
- **Controller-Service-Repository Flow**: PASS — `/login`, `/refresh`, and `/logout` controllers
  delegate to auth services; Prisma access remains in repositories.
- **Prisma as the Persistence Boundary**: PASS — refresh-session state is modeled in Prisma and
  delivered through a migration; token validation and persistence checks are service/repository
  responsibilities.
- **Explicit Contracts and Defensive Boundaries**: PASS — refresh input is validated, cookies
  are HttpOnly, secrets are separated, and user identity comes from verified claims and persisted
  session state.
- **Simple, Testable, Observable Design**: PASS — the design uses the existing JWT flow with one
  narrowly scoped refresh-session entity and tests expiry, revocation, replay, and ownership.

No constitution violations require a complexity exception.

## Project Structure

### Documentation (this feature)

```text
specs/001-extend-auth-session/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-refresh.md
└── tasks.md                 # created by $speckit-tasks
```

### Source Code (repository root)

```text
backend/core/
├── prisma/
│   ├── schema.prisma
│   └── migrations/<timestamp>_add_refresh_sessions/migration.sql
├── src/modules/auth/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.repository.ts                 # new persistence boundary
│   ├── constants.ts
│   ├── dto/refresh-token.dto.ts            # new validated request contract
│   ├── strategy/jwt.strategy.ts
│   ├── types/payload.ts
│   └── *.spec.ts
└── src/modules/user/
    └── ...                                 # unchanged user ownership boundary

frontend/standys-web/
├── app/api/auth/login/route.ts
├── app/api/auth/refresh/route.ts            # new HttpOnly-cookie relay
├── app/api/auth/logout/route.ts             # revoke and clear cookies
├── lib/api/server-client.ts
└── middleware/auth.middleware.ts
```

**Structure Decision**: Keep the existing backend module/infrastructure layout and the existing
Next.js BFF boundary. The refresh-session repository belongs to `auth` because it persists auth
state, while Prisma remains the shared infrastructure dependency. No separate auth service or
new application layer is introduced.

## Implementation Mapping

- Update `AuthService.login()` to issue the existing 15-minute access JWT and a signed 7-day
  refresh JWT with a unique session identifier, then persist the refresh-session hash through the
  auth repository.
- Add `AuthService.validateRefreshToken()` to verify the refresh signature and token type, locate
  the matching active session, compare the presented token hash, and reject expired or revoked
  sessions with one generic unauthenticated error.
- Add a focused access-token issuance function in `AuthService` so login and refresh share the same
  claims and signing behavior without duplicating JWT construction.
- Add `POST /auth/refresh` to `AuthController` with a validated refresh-token DTO, and add
  `POST /auth/logout` to revoke the session used by the request.
- Update the frontend login route to set both HttpOnly cookies, add the frontend refresh relay, and
  update the server API client/middleware to refresh once on an expired access response before
  redirecting to login.

## Complexity Tracking

No constitution violations. The dedicated refresh-session entity is required to compare a refresh
token against active server-side state, support logout/revocation, and avoid storing raw tokens.
