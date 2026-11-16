# 0006. Legacy redirects and rate limits in proxy.ts

**Status:** Accepted (16 Nov 2026)

## Context

Old tab slugs (`/teams/x/players`, `/matches/1/lineups`, ...) were redirected inside the page
components. Once `loading.tsx` was added, a page-level `redirect()` streams a 200 and redirects in
the browser, so link checkers and crawlers saw 200s, and every page carried legacy logic. The
spec also asks for one Live XML request per 5 s.

## Decision

`proxy.ts` answers legacy slugs with HTTP 307 using a plain map (`src/lib/legacy-routes.ts`,
unit tested) and applies the Live XML limit. Redirects that need data or the clock
(`/next-opponent`, `/competitions/{id}/match-centre?match=`) stay in their route files. The proxy
imports no feeds data or React.

## Consequences

- The rate limit is in memory, so it is per instance and resets on deploy. With more than one
  instance, move it to a shared store or API Gateway usage plans.
- `proxy.ts` is also where Cognito session checks go (`AUTH_MODE=cognito`); route handlers must
  still check access themselves, since a matcher change can silently skip the proxy.
