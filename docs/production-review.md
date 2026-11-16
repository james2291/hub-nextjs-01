# Production review (16 Nov 2026)

A review of this codebase for a developer taking it to production. Ordered by what blocks a
launch first. File paths are given so each item can be picked up on its own.

## 1. Must fix before real users

1. **No sign-in.** There is no `proxy.ts`/auth layer; every page and `/api/v1/*` route is open.
   `src/lib/user.ts` hard-codes the user and club. Add Cognito (planned), protect all routes, and
   replace `CURRENT_USER` with the session.
2. **Shared upstream token.** `app/api/v1/[...path]/route.ts` falls back to
   `OVAL_UPSTREAM_AUTHORIZATION` when a request has no `Authorization` header, so anyone who can
   reach the site reads v2 data with that one token. Remove the fallback once sign-in exists (keep
   it for local development only).
3. **Pins cookie secret.** `src/server/user-pins.ts` falls back to a built-in development key when
   `HUB_COOKIE_SECRET` is unset, and only warns. Fail startup in production instead. Move pins to
   a database keyed by user when sign-in lands.
4. **Dependency advisories.** `npm audit --omit=dev` reports 2 (zod, high; fast-uri, moderate).
   Upgrade and re-run the checks.
5. **No rate limiting or security headers.** Add limits on `/api/v1/*` (the spec already asks for
   1 request / 5 s on live XML) and headers (CSP, HSTS, `X-Content-Type-Options`, frame options)
   in `next.config.ts`.

## 2. Data: the biggest piece of remaining work

- Pages read bundled 2025/26 JSON (`src/server/feeds/2025-26/`) and demo data
  (`src/data/hub.ts`, still imported by 17 files). Nothing updates when a match is played.
- 32 of the 33 routed `/api/v1/*` endpoints still pass v2 payloads through unshaped
  (`npm run check:contract`). Capture real payloads into `fixtures/upstream/`, write the reshapers
  in `src/server/contract/reshape.ts`, then switch `src/server/feeds/index.ts` functions from the
  JSON files to those endpoints. The page components don't need to change: they take plain props.
- Hub ids are slugs (`harlequins`); v2 needs numeric ids. The feeds module maps them today; the
  API layer needs the same mapping.
- Illustrative figures (`src/lib/match-illustrative.ts`, `src/lib/seeded.ts`, momentum, try map)
  must be deleted, not left behind a flag, once the event feed is connected.
- The Match Centre renders v2 payloads generically (`match-centre/upstream-view.tsx`). Replace
  with purpose-built panels as each reshaper lands.

## 3. Make it safe to change

- **No CI.** There is no `.github/workflows`. Add one job: `npm ci`, `typecheck`, `lint`, `test`,
  `check:contract`, `check:routing`, `build`.
- **Thin tests.** 23 unit tests cover the feed derivations and the pins cookie only. The browser
  checks used during the build (link crawl, axe accessibility audit, phone-width overflow) were
  one-off scripts; turn them into a Playwright suite in the repo.
- **Pin the toolchain.** Add `engines`/`.nvmrc` (Node 22 was used) and decide on a deploy target
  (Dockerfile or host config); none is in the repo.
- **Observability.** Errors go to `console.error` only. Add error reporting and request logging
  for the upstream calls (status, duration, endpoint).

## 4. Performance

- The root layout is `force-dynamic` (it reads the hub clock and the pins cookie), so every page
  renders per request. Move the clock- and user-dependent parts of the shell behind `<Suspense>`
  so Competition, Team and Referee pages can be cached.
- Legacy-URL redirects run in page code and, since `loading.tsx` was added, resolve in the browser
  rather than as HTTP 307s. Move them to `proxy.ts` or `next.config.ts` redirects.

## 5. Tidy-up (low risk, do early)

- **Unused code.** 42 of the 46 shadcn components in `src/components/ui/` are unused, as are the
  dependencies `@hookform/resolvers` and `date-fns` (and most Radix packages with them).
  `src/lib/link.tsx` (the TanStack compatibility layer) can go once nothing imports it.
- **Repo weight.** `design/oval-hub-handoff/` (7.3 MB of screens and prototype) and `roadmap.md`
  are reference material; move them out of the app repo or to a docs repo.
- **README.** It is a 227-line change log. Split into a short README (run, configure, deploy) and
  `docs/CHANGELOG.md`.
- **Large files.** `fixture-card.tsx` (559 lines) holds the desktop table, phone cards, filters
  and URL state; split into those parts. `upstream/catalog.ts` (665 lines) would read better as
  one file per resource.
- **Styling.** About 30 hex colours are written inline in components (`#55554F`, `#A8A8A0`,
  `#F9FAFB`…). Add them as tokens in `src/styles.css`.
- **Tables.** Tables are div grids with ARIA roles. Real `<table>` elements would be simpler and
  more robust for the simple ones.
- **Naming.** "Team sheets", "Hub API", "v2" and "feeds" are used consistently in code comments;
  keep the "TEMPORARY HOLD" comment convention for anything that is a stand-in, so
  `grep -rn "TEMPORARY HOLD"` lists what must be replaced.

## Suggested order

1. CI, toolchain pin, dependency upgrades, tidy-up (a day or two; makes everything after safer).
2. Sign-in and the security items in section 1.
3. Reshapers and live data, endpoint by endpoint, deleting demo/illustrative code as each lands.
4. Playwright suite, observability, caching.
