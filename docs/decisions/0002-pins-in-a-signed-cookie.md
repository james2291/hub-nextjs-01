# 0002. Pins live in a signed cookie until sign-in

**Status:** Accepted, temporary (9 Nov 2026)

## Context

User Pinned (`GET`/`POST /api/v1/user/pins`, `DELETE /api/v1/user/pins/{pinId}`) needs a store
keyed by user. There is no sign-in and no database yet.

## Decision

`src/server/user-pins.ts` keeps a user's pins in an HMAC-signed, httpOnly, `SameSite=Lax` cookie
(key `HUB_COOKIE_SECRET`). The endpoints already follow the contract (201/409/422, 204/404,
max 20), so the client and the spec do not change when storage does.

## Consequences

- Pins follow the browser, not the person. Clearing cookies resets them to the five defaults.
- Without `HUB_COOKIE_SECRET` in production, pins are read-only (the defaults; changes answer 503) and `/api/health` reports it. Rotating the key resets everyone's pins.
- When Cognito lands, replace `readPins`/`writePins` with a table keyed by the Cognito `sub`;
  nothing else changes. Optionally import a valid cookie on first sign-in.
