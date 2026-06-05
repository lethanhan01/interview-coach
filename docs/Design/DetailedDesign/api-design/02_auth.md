# API Design — Auth

Reference: [01_overview.md](01_overview.md) · [HLD §7.1](../../ArchitecturalDesign/HLD_InterviewAI_v1.0.md) · [ADR-003](../../ArchitecturalDesign/ADRs/ADR-003_supabase-database-auth.md)

## Endpoints

| Method | Path | Auth | MVP |
|--------|------|------|-----|
| GET | /api/v1/auth/google | No | Yes |
| GET | /api/v1/auth/google/callback | No | Yes |
| POST | /api/v1/auth/refresh | HttpOnly Cookie | Yes |
| POST | /api/v1/auth/logout | Bearer | Yes |

---

### GET /api/v1/auth/google

**Auth**: No  
**MVP**: Yes

**Purpose**: Initiate Google OAuth flow — redirects browser to Google consent page.

**Request**

No headers, query params, or body required.

**Response**

```
HTTP 302 Found
Location: https://accounts.google.com/o/oauth2/v2/auth?...
Set-Cookie: state=<csrf-token>; HttpOnly; Secure; SameSite=Strict
```

This endpoint never returns a JSON body. The browser follows the redirect.

**Notes**

- `state` cookie is set server-side to mitigate CSRF during OAuth handshake.
- Redirect target is built by NestJS Passport `AuthGuard('google')` using `GOOGLE_CALLBACK_URL` env var.

---

### GET /api/v1/auth/google/callback

**Auth**: No (Google provides `code` + `state`; Passport validates)  
**MVP**: Yes

**Purpose**: Receive OAuth callback from Google, upsert user in Supabase, issue tokens, redirect to app.

**Request**

Query params (provided by Google, not client-controlled):

| Param | Type | Description |
|-------|------|-------------|
| code | string | Authorization code from Google |
| state | string | Anti-CSRF token matching the cookie set in `/auth/google` |

No request body.

**Response — success (new user)**

```
HTTP 302 Found
Location: https://interviewcoach.vn/onboarding?access_token=<jwt>
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Response — success (existing user)**

```
HTTP 302 Found
Location: https://interviewcoach.vn/sessions/new?access_token=<jwt>
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Response — error**

```
HTTP 302 Found
Location: https://interviewcoach.vn/auth/error?reason=<code>
```

Possible `reason` values:

| reason | When |
|--------|------|
| `oauth_failed` | Google returned an error or code exchange failed |
| `state_mismatch` | `state` param does not match the cookie (CSRF) |
| `upsert_failed` | Supabase user upsert failed |

**Notes**

- Access token is a Supabase JWT, expiry 1h. It is passed as a query param so the SPA can store it in memory — not localStorage.
- `refreshToken` cookie max-age is 7 days (604800 seconds).
- User is classified as "new" when the Supabase user record was created during this callback (no prior session).

---

### POST /api/v1/auth/refresh

**Auth**: HttpOnly Cookie (`refreshToken`)  
**MVP**: Yes

**Purpose**: Exchange a valid refresh token for a new access token. Rotates the refresh token.

**Request**

No body. The refresh token is read from the `refreshToken` cookie automatically by the browser.

**Response — 200 OK**

```json
{
  "success": true,
  "data": {
    "access_token": "<jwt>",
    "expires_in": 3600
  }
}
```

A new `refreshToken` cookie is issued. The previous refresh token is invalidated in Supabase.

```
Set-Cookie: refreshToken=<new-token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Response — 401 Unauthorized**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Refresh token expired or invalid."
  }
}
```

**Errors**

| Code | HTTP | When |
|------|------|------|
| UNAUTHORIZED | 401 | Cookie absent, expired, or revoked |
| INTERNAL_ERROR | 500 | Supabase token rotation failed |

**Notes**

- Client should call this endpoint proactively before the access token expires (e.g., ~55 minutes into the 1h window).
- On 401, the client must redirect the user to `/auth/google` to re-authenticate.

---

### POST /api/v1/auth/logout

**Auth**: Bearer  
**MVP**: Yes

**Purpose**: Revoke the active Supabase session and clear the refresh token cookie.

**Request**

```
Authorization: Bearer <access_token>
```

No body.

**Response — 200 OK**

```json
{
  "success": true,
  "data": null
}
```

```
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

**Errors**

| Code | HTTP | When |
|------|------|------|
| UNAUTHORIZED | 401 | Bearer token missing or malformed |

**Notes**

- Returns 200 even if the JWT is already expired — logout is best-effort.
- Calls `supabase.auth.signOut()` server-side to revoke the session in Supabase.
- Cookie is cleared by setting `Max-Age=0`.
