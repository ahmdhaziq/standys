# Data Model: Extend Authenticated Session

## Refresh Session

Represents one login/device session that is allowed to exchange a valid refresh JWT for new
access JWTs.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `id` | integer | yes | Primary key. |
| `user_id` | integer | yes | References `user.id`; indexed for user/session lookup. |
| `jti` | string | yes | Unique refresh-token identifier from the signed JWT. |
| `token_hash` | string | yes | One-way hash of the raw refresh JWT; never returned. |
| `expires_at` | datetime | yes | Exactly 7 days after login for this feature. |
| `revoked_at` | datetime | no | Set on logout or administrative revocation; active means null. |
| `created_at` | datetime | yes | Session creation timestamp. |
| `updated_at` | datetime | yes | Last metadata update timestamp. |

### Relationships

- Each refresh session belongs to exactly one `user`.
- A user may have multiple refresh sessions, one per login/device.
- Refresh sessions do not grant access by themselves; the presented JWT must also have a valid
  signature, expiry, token type, subject, and matching `jti`/hash.

### Validation and state transitions

1. **Created**: login verifies credentials, signs the refresh JWT, hashes it, and persists an
   active session before returning the token pair.
2. **Active**: refresh verifies the signed token, finds the matching session, checks `revoked_at`
   is null and `expires_at` is in the future, then issues a new access JWT.
3. **Revoked**: logout sets `revoked_at`; subsequent refresh attempts return unauthenticated.
4. **Expired**: once `expires_at` has passed, refresh attempts return unauthenticated. Cleanup of
   old rows may be handled later and is not required for the feature.

### Security invariants

- `token_hash` and raw token values MUST NOT appear in logs or ordinary API responses.
- Refresh verification MUST use a refresh-only signing secret and a refresh-token type claim.
- The session user id MUST come from the verified refresh claims and the matching persisted row,
  never from caller-provided user input.
- Database writes for session creation and revocation MUST remain inside the auth repository.
