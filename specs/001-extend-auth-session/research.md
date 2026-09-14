# Research: Extend Authenticated Session

## Decision 1: Use separate signed access and refresh JWTs

**Decision**: Keep the access JWT at 15 minutes and issue a refresh JWT signed with a separate
secret and an explicit refresh-token type claim. Set the refresh JWT lifetime to 7 days.

**Rationale**: A short access lifetime limits the impact of an exposed access token, while a
separate refresh secret prevents an access token from being accepted as a refresh credential.
Explicit token type and subject claims prevent cross-use between strategies.

**Alternatives considered**: Extending the access JWT to 7 days was rejected because it increases
the exposure window of a bearer credential and provides no server-side revocation point.

## Decision 2: Persist refresh-session state, but never the raw refresh JWT

**Decision**: Add one persisted refresh-session record per login/device containing the user id,
token identifier, a one-way token hash, expiry, revocation timestamp, and audit timestamps. Store
only the hash (and optionally a token identifier) in PostgreSQL. Compare the presented token after
signature verification and reject records that are expired or revoked.

**Rationale**: JWT signatures prove that a token was issued by the service but do not provide
revocation. Persisted state enables logout and active-token comparison without making a database
leak immediately reveal usable refresh credentials. A session table also avoids forcing one login
to invalidate every other device.

**Alternatives considered**: Storing the raw token on `user` was rejected because it is exposed
if the database is read and cannot represent multiple devices cleanly. A stateless refresh JWT
was rejected because it cannot support immediate logout/revocation.

## Decision 3: Keep tokens in HttpOnly cookies at the web boundary

**Decision**: The Next.js login route sets separate HttpOnly cookies for the access and refresh
tokens. Use `Secure` in production, `SameSite=Lax`, an explicit `/` path, and cookie lifetimes
matching the token lifetimes. Browser JavaScript never reads either cookie. The Next.js server
route reads the refresh cookie and forwards it to the backend refresh endpoint.

**Rationale**: HttpOnly cookies reduce token theft through client-side script access. The existing
BFF already owns cookie handling and can relay the refresh request without exposing the refresh
credential to browser code.

**Alternatives considered**: Local storage was rejected because JavaScript-accessible bearer
tokens are more exposed to XSS. A refresh token in a browser-readable response was rejected for
the same reason.

## Decision 4: Use stable refresh tokens for the requested 7-day session, with revocation

**Decision**: Login creates the refresh session once. Each valid refresh issues a new access JWT
but does not rotate the refresh JWT in this feature. Logout revokes the persisted session and
clears both cookies. Refresh-token rotation with reuse detection remains a follow-up security
enhancement.

**Rationale**: This matches the requested flow: the refresh token is issued at login, remains
active for 7 days, and is used to obtain new access tokens. It keeps the first implementation
small while retaining server-side revocation.

**Alternatives considered**: Rotating refresh tokens on every refresh offers stronger replay
protection but requires atomic replacement, cookie replacement, and reuse-detection behavior that
was not requested for this slice.

## Decision 5: Refresh through the frontend BFF and retry once

**Decision**: When a protected frontend request receives an expired-access response, the server
client calls the frontend refresh route, which forwards the HttpOnly refresh cookie to backend
`POST /auth/refresh`, stores the new access token cookie, and retries the original request once.
If refresh fails, clear both cookies and return the normal unauthenticated result.

**Rationale**: The browser does not need access to either token, and a single retry prevents
infinite refresh loops. Middleware and server-side API calls share one cookie policy.

**Alternatives considered**: Having browser JavaScript call the backend directly was rejected
because it would require exposing the refresh token or weakening the HttpOnly boundary.
