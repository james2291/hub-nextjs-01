# Production review

What a developer needs to do to take this proof of concept to production, ordered by what
blocks a launch first. First written 16 Nov 2026; updated the same day after the handover work.
Each item names its files so it can be picked up on its own.

`grep -rn "TEMPORARY HOLD"` lists every stand-in in the code.

## Done in the handover

| Item                     | Where                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| CI on every pull request | `.github/workflows/ci.yml`: typecheck, lint, unit, contract, routing, build, Playwright       |
| Node pinned              | `.nvmrc` (22), `package.json` `engines`                                                       |
| Playwright suite         | `e2e/`: page smoke, link crawl, axe WCAG 2 A/AA, phone width, pins API, Live XML, headers     |
| Env validation           | `src/server/env.ts`; production refuses to start without `HUB_COOKIE_SECRET` (32+ chars)      |
| Shared upstream token    | `OVAL_UPSTREAM_AUTHORIZATION` ignored in production unless `ALLOW_SHARED_UPSTREAM_TOKEN=1`    |
| Security headers         | `next.config.ts`: CSP, HSTS, nosniff, `X-Frame-Options`/`frame-ancestors`, Referrer-Policy    |
| Legacy URLs as 307s      | `proxy.ts` + `src/lib/legacy-routes.ts` (unit tested); pages only know current slugs          |
| Live XML rate limit      | `proxy.ts`: 1 request / 5 s per client and match, 429 with `Retry-After` (per instance)       |
| Health endpoint          | `GET /api/health`: status, version, demo mode, which upstreams are configured                 |
| Start-up check           | `instrumentation.ts`: server exits if env is invalid; request errors logged as JSON           |
| Upstream logging         | `src/server/upstream/client.server.ts`: one JSON line per call (host, path, status, ms)       |
| Typed API client         | `src/api/client.ts` (openapi-fetch over the generated types); the pins provider uses it       |
| Dependencies             | 40 unused packages removed; zod 4.6, Vitest 5; `npm audit --omit=dev` reports 0               |
| Unused code              | shadcn kit (bar `button`), `src/lib/link.tsx`, unused hooks and images removed                |
| Colour tokens            | Inline hex moved to tokens in `src/styles.css`                                                |
| Docs                     | Short README, `docs/CHANGELOG.md`, `docs/data-reality.md`, `docs/decisions/`                  |
| Repo weight              | Design screens/prototype and `roadmap.md` removed (recovery note in `docs/design/HANDOFF.md`) |

## 1. Must do before real users

1. **Sign-in (Cognito).** Not built: it needs a user pool. Every page and `/api/v1/*` route is
   open, and `src/lib/user.ts` hard-codes the user and club.
   - `proxy.ts` has the hook (`requireSession`, enabled with `AUTH_MODE=cognito`): verify the id
     token from the session cookie against the pool's JWKS (`jose` works in proxy), redirect pages
     to the hosted UI, answer `/api/v1/*` with 401, and forward the token as `Authorization`.
   - Check access in route handlers too; the proxy can be skipped by a matcher change
     (`docs/decisions/0006-proxy-for-redirects-and-limits.md`).
   - Replace `CURRENT_USER` with the session and build `GET /api/v1/user`.
2. **Pins storage.** Not built: it needs a database. Replace `readPins`/`writePins` in
   `src/server/user-pins.ts` with a table keyed by the Cognito `sub`
   (`docs/decisions/0002-pins-in-a-signed-cookie.md`). Nothing else changes.
3. **Shared rate limit.** The Live XML limit is in memory. Before running more than one instance,
   move it to Redis/Upstash or API Gateway usage plans, and consider limits on the rest of
   `/api/v1/*`.
4. **Error reporting.** Errors still go to the console. Add Sentry (or similar) in
   `instrumentation.ts` and the `error.tsx` boundaries; ship the JSON upstream logs to your log
   store.

## 2. Data: the biggest piece of remaining work

See `docs/data-reality.md` for what is real, demo and illustrative on each page.

- **Reshapers.** 32 of the 33 routed `/api/v1/*` endpoints still pass v2 payloads through
  unshaped (`npm run check:contract`). Not built here: they need real payloads, and field names
  are not guessed. For each endpoint: capture a payload into `fixtures/upstream/<operationId>/`
  (run with `OVAL_API_GATEWAY_URL` and a Cognito token), write the reshaper in
  `src/server/contract/reshape.ts` (its return type is the spec's 200 body, so `tsc` catches wrong
  fields), and `check:contract` validates it.
- **Slug ↔ id map** (`docs/decisions/0001-slugs-and-ids.md`) is needed before reshaped endpoints
  can take slugs.
- **Switch the feeds.** Point each function in `src/server/feeds/index.ts` at its endpoint,
  keeping the return shapes; the pages take plain props and don't change. Then delete
  `src/data/hub.ts`, `src/lib/match-illustrative.ts` and `src/lib/seeded.ts` as their consumers go
  live. Delete, don't hide behind `HUB_DEMO`.
- **Match Centre** renders v2 payloads generically (`match-centre/upstream-view.tsx`). Replace
  with purpose-built panels as each reshaper lands.
- **Video player.** When it's built, add the Xeatre media host to `media-src` in the CSP
  (`next.config.ts`).

## 3. Performance

- The root layout is `force-dynamic` (it reads the hub clock and the pins cookie), so every page
  renders per request. Move the clock- and user-dependent parts of the shell behind `<Suspense>`,
  then cache Competition, Team and Referee pages (`revalidate` or `"use cache"`, keyed by the feed
  update) once data is live.
- Not-found pages answer 200 (they stream behind `loading.tsx`) with `noindex`. If a real 404 status
  matters, check the id before the segment's loading boundary, e.g. in `proxy.ts` or the layout.

## 4. Tidy-up still open

- `fixture-card.tsx` (557 lines) holds the desktop table, phone cards, filters and URL state; split
  into those parts when it next changes. `upstream/catalog.ts` would read better as one file per
  resource.
- Simple tables are div grids with ARIA roles; real `<table>` elements would be simpler.
- `npm audit` reports 8 moderate advisories in dev-only tooling (minimatch via eslint); not in
  the production bundle.
- CSP uses `'unsafe-inline'` for scripts (Next's bootstrap). Move to nonces in `proxy.ts` if a
  stricter policy is required
  (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`).
- Decide the deploy target (Vercel, or a Dockerfile for a Node 22 host) and add preview deploys
  per pull request.

## Suggested order

1. Sign-in and pins storage (section 1), with error reporting.
2. Slug ↔ id map, then reshapers and live data endpoint by endpoint, deleting demo and
   illustrative code as each lands.
3. Caching, shared rate limit, then scale out.
