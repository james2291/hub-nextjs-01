# Oval Hub

Rugby analysis hub for club analysts: competitions, teams, players, referees and matches, with
Fixture Cards, a per-match Match Centre, Live XML and event files. **Next.js 16 App Router**,
React 19, Tailwind 4, React Query, zod.

This is a proof of concept handed over for production. Real 2025/26 RugbyViz feeds drive the
fixtures, results and tables; player, officiating, team-sheet and event data are demo or
illustrative and labelled on the page. Start with:

- [`docs/production-review.md`](docs/production-review.md): what is done and what is left, in order.
- [`docs/data-reality.md`](docs/data-reality.md): which figures on each page are real, demo or illustrative.
- [`docs/decisions/`](docs/decisions/): why things are the way they are.
- [`docs/openapi.yaml`](docs/openapi.yaml): the Hub API contract. [`docs/CHANGELOG.md`](docs/CHANGELOG.md): history.

> **This is not the Next.js in most tutorials.** Middleware is `proxy.ts`, `error.tsx` receives
> `retry`, `cookies()` is async. Read `node_modules/next/dist/docs/` before using an API (see
> `AGENTS.md`).

## Run it

Node 22 (`.nvmrc`).

```sh
npm ci
cp .env.example .env.local
npm run dev                                       # http://localhost:3000
HUB_NOW=2026-05-16T14:30:00+01:00 npm run dev     # match the design screenshots (mid-season)
```

With no settings every page works: upstream routes answer 503 and AI cards show labelled
placeholder text. In production `HUB_COOKIE_SECRET` is required (the server refuses to start
without it). All settings are documented in `.env.example` and validated by `src/server/env.ts`.

## Checks

CI (`.github/workflows/ci.yml`) runs all of these on every pull request.

```sh
npm run typecheck && npm run lint
npm test                  # Vitest: feed derivations, handoff check values, pins cookie, redirects
npm run check:contract    # catalog vs spec; reshapers vs captured fixtures
npm run check:routing     # v2 upstream call map
npm run build
npm run test:e2e          # Playwright against the build: pages, links, axe, phone width, API
```

The first `test:e2e` on a new machine needs `npx playwright install chromium`.

## Layout

```
proxy.ts                     runs before every request: legacy 307s, Live XML rate limit, sign-in hook
next.config.ts               security headers, fixed redirects
app/                         routes; server components read data and pass plain props
  api/health                 liveness + which upstreams are configured
  api/v1/[...path]           Hub API: v2 upstream pass-through, reshaped to the contract per endpoint
  api/v1/user/pins           User Pinned (cookie store until sign-in and a database exist)
  api/v1/insights            AI insights from the AWS Oval Insights API (placeholder until live)
src/
  components/oval/           product UI, by area (match/, match-centre/, team/, ...)
  views/                     page bodies for Home and Search
  server/feeds/              bundled 2025/26 feeds behind plain functions (TEMPORARY HOLD)
  server/upstream/           v2 call catalog and upstream client (server only)
  server/contract/           reshapers: upstream payload -> docs/openapi.yaml body
  server/env.ts              validated environment
  api/openapi.d.ts, client.ts  generated types (npm run gen:api) and typed fetch client
  data/hub.ts                demo data (TEMPORARY HOLD)
  lib/                       clock, URL state, pins provider, legacy routes, shared types
e2e/                         Playwright suite
docs/                        API spec, production review, decisions, design spec, changelog
```

`grep -rn "TEMPORARY HOLD"` lists every stand-in that must be replaced before launch.

## Deploying

Any Node 22 host that runs `next start` (or Vercel). Set `HUB_COOKIE_SECRET`, the upstream
settings in `.env.example`, and point the load balancer's health check at `/api/health`. The Live
XML rate limit is per instance; see `docs/production-review.md` before running more than one.
