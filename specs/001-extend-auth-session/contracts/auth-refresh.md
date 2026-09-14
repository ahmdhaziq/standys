# Authentication Refresh Contracts

All endpoints are exposed by the backend under `/auth` and are relayed by the existing frontend
BFF where browser cookie handling is required.

## `POST /auth/login`

Existing credential validation remains unchanged. A successful response includes both signed
credentials in the success data so the frontend server route can set HttpOnly cookies.

```json
{
  "status": "success",
  "data": {
    "access_token": "<15-minute access JWT>",
    "refresh_token": "<7-day refresh JWT>"
  },
  "meta": null
}
```

The backend response is consumed server-to-server by the frontend route; browser code must not
receive these values directly.

## `POST /auth/refresh`

Request body:

```json
{
  "refresh_token": "<7-day refresh JWT>"
}
```

Successful response:

```json
{
  "status": "success",
  "data": {
    "access_token": "<new 15-minute access JWT>"
  },
  "meta": null
}
```

The backend MUST return an unauthenticated error for a missing, malformed, wrongly signed,
wrong-type, expired, revoked, or non-matching refresh token. The response MUST NOT identify which
validation check failed.

## Frontend BFF refresh route

`POST /api/auth/refresh` reads the HttpOnly `refresh_token` cookie, forwards it to backend
`POST /auth/refresh`, sets the returned access token cookie, and returns a generic success result.
On failure it clears both auth cookies and returns `401`.

## `POST /auth/logout`

The backend accepts the refresh token from the server-side BFF, revokes the matching active
session, and returns a generic success response. The frontend BFF clears both cookies regardless
of whether the backend session was already expired or revoked.

## Cookie policy

| Cookie | Lifetime | HttpOnly | Secure | SameSite | Path |
|---|---:|---:|---:|---|---|
| `access_token` | 15 minutes | yes | production only | `Lax` | `/` |
| `refresh_token` | 7 days | yes | production only | `Lax` | `/` |

The production-only `Secure` setting is a deployment configuration choice; local development may
use HTTP. Neither cookie is readable by browser JavaScript.
