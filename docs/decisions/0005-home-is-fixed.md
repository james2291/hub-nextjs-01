# 0005. Home is always the matchday page

**Status:** Accepted (9 Nov 2026)

## Context

An earlier build let a user make any pinned page their home screen (`PUT /api/v1/user/home`).
It made support harder ("where is the matchday view?") and the redirect cost a round trip.

## Decision

`/` is always the matchday page. Pins are sidebar shortcuts only. `PUT /api/v1/user/home` and
`User.homePath` were removed from the routes and the spec.

## Consequences

Cookies saved with a home page still load; the home value is ignored.
