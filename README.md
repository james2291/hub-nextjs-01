# Oval Hub (Next.js)

Oval Hub v2 prototype, ported from TanStack Start (Lovable) to **Next.js 16.4.5 App Router**. Same pages, same URLs, same look.

> **Temporary holds.** Three parts of this codebase stand in for APIs that aren't built yet:
> - **Data:** pages read static data from `src/data/hub.ts` until the Hub API (`docs/openapi.yaml`) is built.
> - **AI insights:** `POST /api/v1/insights` returns labelled placeholder text until the AWS Oval Insights API is live. Set `INSIGHTS_API_URL` to switch it on; no other code changes.
> - **Upstream routing:** `GET /api/v1/*` passes Oval Hub v2 upstream payloads through unchanged (`contract: "upstream-passthrough"`) until each endpoint is reshaped to `docs/openapi.yaml`. Pages don't call it yet.
>
> AI text is generated and stored by the AWS Oval Insights API; the Hub only reads it.

## Run it

```sh
npm install
cp .env.example .env.local   # INSIGHTS_API_URL / INSIGHTS_API_KEY, or leave empty for placeholders
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npm run typecheck && npm run lint
```

With no environment variables set, every page works and AI insight cards show labelled placeholder text. Upstream routes answer 503 until `OVAL_API_GATEWAY_URL` is set.

## Oval Hub v2 API routing

Pages still read `src/data/hub.ts`. `GET /api/v1/*` (other than the insights route) calls the same upstreams as Oval Hub v2 and returns those payloads unchanged. They are not yet mapped onto `docs/openapi.yaml`.

`GET /api/v1/routing` lists every binding, including calls v2 never had. RugbyViz goes to `{OVAL_API_GATEWAY_URL}/oval-proxy/`. Event search uses `RUGBYVIZ_API_URL`. Video uses Xeatre. See `.env.example`.

Ids must be numeric RugbyViz ids. `season=2025-26` is sent as season id `202501`. Check the map without a server:

```sh
npx tsx scripts/check-v2-routing.ts
```

## Layout

```
app/                         Next.js routes (server components: metadata, redirects, params)
  layout.tsx                 html shell, fonts, React Query provider
  page.tsx                   Home (/)
  next-opponent/page.tsx     server redirect to the next opponent's Head-to-head
  matches/[matchId]/[tab]/   match workspace (7 tabs)
  competitions|teams|players|referees/[id]/
    layout.tsx               entity header + tab bar (was TanStack <Outlet/>)
    page.tsx                 redirect to /match-room
    [tab]/page.tsx           tab content, per-tab metadata, legacy-slug redirects
  api/v1/insights/route.ts   AI insights: forwards to the AWS Oval Insights API (temporary placeholder until it exists)
  api/v1/[...path]/route.ts  Oval Hub v2 upstream routing (see below)
src/
  views/                     client page bodies for the non-entity pages
  components/oval/           product components (unchanged apart from "use client" + imports)
  components/oval/entity-navigation.ts   tab definitions, server-safe
  components/ui/             shadcn/Radix (unchanged)
  lib/link.tsx               router compatibility layer (see below)
  lib/ai-insights.ts         shared insight types + wire schema
  server/insights/client.server.ts  AWS Oval Insights API client + placeholder (server-only)
  server/upstream/           v2 call map and server-only upstream client
  data/hub.ts                static prototype data (TEMPORARY HOLD until the Hub API exists)
public/assets/               images (were imported from src/assets)
docs/openapi.yaml            API spec for every endpoint not yet built (OpenAPI 3.1)
```

## What changed in the port

| TanStack Start | Next.js |
| --- | --- |
| `src/routes/*.tsx` file routes (27) | `app/**/page.tsx` + `layout.tsx` |
| `head()` | `metadata` / `generateMetadata()` |
| `beforeLoad` + `redirect()` | `redirect()` in server pages; fixed URL in `next.config.ts` |
| `<Outlet />` in entity/match layouts | `children` in `layout.tsx` |
| `<Link to params search activeProps>` | `@/lib/link` renders `next/link` with the same props (47 call sites unchanged) |
| `useRouterState`, `useNavigate` | `usePathname`, `useSearchParams`, `useRouter` |
| `createServerFn` + `useServerFn` (Lovable AI + cache table) | `POST /api/v1/insights` route handler reading the AWS Oval Insights API |
| `import.meta.env.VITE_*` keys | Removed; only `INSIGHTS_API_URL` / `INSIGHTS_API_KEY` (server-only) |
| `import img from "@/assets/x.jpg"` | `"/assets/x.jpg"` from `public/` |
| Vite + `@lovable.dev/vite-tanstack-config` | Next.js + `@tailwindcss/postcss` (Tailwind 4 unchanged) |

Removed: `src/router.tsx`, `src/start.ts`, `src/server.ts`, `routeTree.gen.ts`, Lovable error capture, the Lovable AI gateway and the prototype's backend client. Sign-in is proposed as AWS Cognito, added in `proxy.ts` when it's built (plan Phase 0).

**Lovable:** this project can no longer be edited in Lovable.

## Verified

- `next build` and `tsc --noEmit` pass; `eslint` has 0 errors.
- All 280 URLs (every competition, team, player and referee tab, every match tab, legacy redirects) were loaded in both the original and this port: same final URL, same `<h1>`, same page text, no console errors. Screenshots of 8 key pages at desktop and mobile differ by under 0.3% of pixels.

## Fixes made during the port

- Active entity tab now shows its underline and bold (the original's classes clashed with the defaults, so only the colour changed).
- `MatchCentre` called hooks after an early return (rules-of-hooks bug).
- `/matches/:id` with no tab now redirects to the Overview tab (was blank).
- `/api/v1/insights` never fails the whole batch: each card gets `ready`, `pending`, `unavailable` or `placeholder`.
- The browser no longer sends prompt data for AI insights; it sends only subject, scope and season.

## Pages removed (8 Oct 2026)

The Matches library (`/matches`), Downloads (`/downloads`) and the pre-redesign legacy pages (`/reports`, `/event-search`, `/video-library`, `/teams-players`, `/competitions` index) were removed and now return 404. Match workspaces (`/matches/:id/:tab`) and competition workspaces (`/competitions/:id/:tab`) are unchanged. The remaining 273 URLs were re-verified: all load with no console errors.

## V3 upstream routing (8 Oct 2026)

Added `app/api/v1/[...path]/route.ts`, `src/server/upstream/` and `scripts/check-v2-routing.ts`.

- `next build` failed on two `noPropertyAccessFromIndexSignature` errors in `client.server.ts`; fixed (`headers["Authorization"]`).
- The routing check reports 35 routed reads, 11 with no v2 source (501) and 6 v2 calls deliberately not routed.
- Responses: `/routing` 200, missing env 503, slug instead of numeric id 422, no v2 source 501, unknown path 404. The Cognito id token is forwarded without the `Bearer ` prefix, as v2 does.

## Team availability removed (8 Oct 2026)

Team availability is out of scope. Removed: the Home Availability panel, the "Squad available" stat, player status (Available / Managed / Return to play) on squad lists, player headers and Cohesion, the `/teams/{teamId}/availability` routing gap, and from `docs/openapi.yaml` the availability endpoint, the `AvailabilityStatus` type and the squad `status` / `statusNote` fields.

## Next.js security update (9 Nov 2026)

`next` and `eslint-config-next` upgraded from 16.4.0 to 16.4.5: `next build` on 16.4.0 now stops with a known-vulnerability warning. Build, typecheck and lint pass on 16.4.5.

## Next steps (from the build plan)

1. Reshape each `/api/v1/*` pass-through response to its `docs/openapi.yaml` schema (`GET /api/v1/routing` lists them).
2. Replace `src/data/hub.ts` imports with React Query hooks in `src/api/` per endpoint (build plan section 6).
3. Move read-only sections to server components with `<Suspense>` as their endpoints land.
4. Migrate `@/lib/link` call sites to plain `next/link` + `buildHref()` / a typed `routes` helper over time.
5. 13 lint warnings are prototype patterns (setState in effects, `<img>`); fix as each component is wired to the API.
