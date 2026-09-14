# Quickstart: Validate Refresh-Token Authentication

## Prerequisites

- PostgreSQL is running and `DATABASE_URL` is configured for `backend/core`.
- Separate access and refresh signing secrets are configured through environment-backed settings.
- Backend and frontend dependencies are installed.
- Backend e2e tests use Node’s `--experimental-vm-modules` mode because the installed
  `@nestjs/config` package is ESM; the `backend/core` `test:e2e` script includes this flag.

## Automated validation

From `backend/core`:

```bash
npm test -- --runInBand
npm run build
npm run test:e2e -- --runInBand
npm exec prisma validate
```

From `frontend/standys-web`:

```bash
npm test
npm run lint
npm run build
```

The frontend package does not currently define a test script. The route-handler scenarios below
remain required and may initially be exercised through the backend e2e suite or a later frontend
integration-test harness.

## End-to-end scenarios

1. Register a test user and log in through `/api/auth/login`.
2. Confirm the response does not expose token values in the browser payload and that both
   `access_token` and `refresh_token` cookies are HttpOnly.
3. Use the access cookie to call a protected route and confirm success.
4. Advance time beyond 15 minutes while keeping the refresh session inside 7 days.
5. Call the frontend refresh route and confirm it returns success and replaces only the access
   cookie with a newly issued access JWT.
6. Call a protected route with the renewed access cookie and confirm the same user is returned.
7. Submit a malformed, wrongly signed, expired, and revoked refresh token; each attempt returns
   the generic unauthenticated response and does not issue an access token.
8. Log out, then attempt refresh with the old refresh cookie; confirm the session is rejected and
   both frontend cookies are cleared.
9. Repeat refresh with two simultaneous requests near access expiry; confirm the frontend makes
   at most one retry per original request and does not loop after a failed refresh.

See [auth-refresh.md](./contracts/auth-refresh.md) for response shapes and cookie policy, and
[data-model.md](./data-model.md) for persistence and state rules.

## Latest validation result

Validated on 2026-09-13:

- Backend lint: passed.
- Backend unit tests: 12 suites, 19 tests passed.
- Backend e2e tests: 1 suite, 3 tests passed using the `test:e2e` VM-module launch mode.
- Prisma schema validation: passed.
- Backend build: passed.
- Frontend Vitest tests: 3 files, 6 tests passed.
- Frontend lint: passed.
- Frontend Webpack production build: passed.
