# Changelog

Newest first. Earlier entries describe the state at the time; paths may have moved since
(`design/oval-hub-handoff/` is now `docs/design/HANDOFF.md`, the shadcn UI kit and
`src/lib/link.tsx` were removed on 16 Nov 2026).

## 16 Nov 2026: production handover

- **CI** (`.github/workflows/ci.yml`): typecheck, lint, unit tests, contract and routing checks,
  build, then the Playwright suite. Node pinned to 22 (`.nvmrc`, `engines`).
- **Playwright suite** (`e2e/`): every key page renders without console errors, internal link
  crawl, axe WCAG 2 A/AA on core pages, no sideways scroll at phone width, pins API, Live XML
  503/429, security headers, legacy 307s. Three accessible-name issues it found are fixed.
- **Security:** env validated at start-up (`src/server/env.ts`); production refuses to start
  without `HUB_COOKIE_SECRET`; the shared upstream token is development-only; CSP, HSTS and the
  other security headers; `X-Powered-By` off.
- **`proxy.ts`:** legacy tab slugs are HTTP 307s again; Live XML is limited to one request per 5 s
  per client and match (per instance); a documented hook for Cognito (`AUTH_MODE`).
- **`GET /api/health`**, one JSON log line per upstream call, and `instrumentation.ts`: the
  server exits at start-up on invalid env and logs unhandled request errors as JSON.
- **Typed API client** `src/api/client.ts` (openapi-fetch), used by the pins provider.
- **Cleanup:** unused shadcn components, hooks, images and 40 packages removed; zod 4.6 and
  Vitest 5; inline colours moved to tokens; `TEMPORARY HOLD` on every stand-in; design assets and
  `roadmap.md` moved out (see `docs/design/HANDOFF.md`).
- **Docs:** this changelog, a short README, `docs/data-reality.md`, `docs/decisions/`.

## 16 Nov 2026: Match page changes and production review

- Match Overview: the lineup has a home/away toggle and is drawn front row at the top, back three at the bottom. Match momentum is a line chart (click a five-minute block for its reading).
- Match Stats is laid out like Player Stats: a match profile with bars (home side against the away side's marker), a scoring summary with the event list, then the try & kick map full width. Illustrative figures are shared with the Overview (`src/lib/match-illustrative.ts`).
- `docs/production-review.md`: what a developer needs to do to take this to production, in order.

## 10 Nov 2026: Sidebar tidy

- Removed the Library section (Matches and Fixture Card). Fixture Cards are on each competition, team, player and referee page.
- "Next opponent" no longer gets squashed: the label stays on one line and the opponent's name truncates beside it. With no next fixture (out of season) nothing is shown beside it; the "Season over" text is gone.

## 10 Nov 2026: Fixture Card trimmed

- Columns are now Date · KO, Home, Result, Away, Round, the asset ticks and Match Centre. Removed: Live XML (it's in each fixture's Match Centre and on Competition → Feeds), Referee, and Venue with attendance. The phone cards and search follow (search is by team).
- Round shows just the number ("18"); pool games show the round number with the pool under it ("Champions Cup · Pool 3"); knockouts keep their name ("Semi-final"). The Round filter uses the same labels.

## 10 Nov 2026: Match Centre per fixture

- The Match Centre is now a tab on each match page (`/matches/{id}/match-centre`: Overview · Match Centre · Video · Stats) instead of a competition tab. It keeps the Summary, Lineups, Kicking, Quarters, Player data and Live XML views and the Live XML / Event XML / Event CSV downloads, for that fixture only.
- The Fixture Card's Match Centre arrow opens the fixture's Match Centre. Live XML is not on the Fixture Card: it's in each fixture's Match Centre and on Competition → Feeds.
- Old links redirect: `/competitions/{id}/match-centre?match={matchId}` → `/matches/{matchId}/match-centre`, and without a match to the competition's Fixture Card. The prototype's `/matches/{id}/player-data` now goes to the Match Centre.
- Since the loading skeletons (`loading.tsx`) were added, these redirects (and the other legacy-slug redirects) happen in the browser after the page streams, not as HTTP 307s. Moving them to `proxy.ts` would restore 307s if crawlers or link checkers need them.

## 9 Nov 2026: Home is fixed

- Users can no longer make a pinned page their home screen: Home is always the matchday page. Removed the sidebar's "Set as home" buttons, the redirect to a chosen page and the pinned page's name beside Home.
- Removed `PUT /api/v1/user/home` (route and spec) and `homePath` from the `User` schema and the pins cookie. Cookies saved with a home page still load; the home page in them is ignored. Pins stay as sidebar shortcuts.

## 9 Nov 2026: Match Centre and Live XML

- **Competition → Match Centre** (`/competitions/{id}/match-centre`, since moved to each match; see below): a fixture browser (completed/upcoming, team, round; `?match=` selects a fixture) and, for the selected fixture, Summary, Lineups, Kicking, Quarters, Player data and Live XML views. Score and match facts come from the fixtures feed; the views read the Hub's v2 routes (`/api/v1/matches/{id}/stats`, `/lineups`, `/player-stats`, `/live-xml`), the same RugbyViz widgets the v2 Match Centre used (catalogued in `src/server/upstream/catalog.ts`). Until those responses are reshaped, the views lay out the v2 payload generically and say so.
- **Every fixture** has a Match Centre link on the Fixture Card; Live XML downloads from the fixture's Match Centre and from Feeds (not the Fixture Card).
- **`GET /api/v1/matches/{matchId}/live-xml` meets its contract:** `application/xml`, `ETag`, `304` on `If-None-Match`, `Cache-Control: no-store`; add `?download=1` to save `{matchId}-live.xml`. Event XML/CSV (`download/{kind}`) are served as files the same way.
- Without `OVAL_API_GATEWAY_URL` the views say the data service isn't connected. The wiring was tested end to end against a local mock of the gateway.
- The prototype zip supplied for reference had no APIs (static demo data); it was used only for the Match Centre's layout and views. Discipline and Turnovers from the prototype need v2 parameters (event ids) that aren't in the catalogue yet, so they're not shown.

## 9 Nov 2026: UI/UX pass

- **Phones and tablets:** KPI strips go 2 → 3 → all columns; panels stack below the lg breakpoint; table panels scroll sideways (`Section minWidth`) with the league table's club column pinned; the Fixture Card becomes match cards with "Select assets"; tab rows fade at the edge; the match header stacks.
- **Accessibility:** `faint` and sidebar-label colours meet 4.5:1; visible focus ring on every control; ARIA table semantics for the league table, Fixture Card and shared rows; spoken labels for W/L form and coloured scores; Search returns focus on close; the phone menu is a modal dialog. axe-core (WCAG 2 A/AA) reports no violations on the main pages.
- **Unconnected actions** (reports, compare, publish, download, preview pack, clips, playlists) use `ComingSoonButton`: they look unavailable and say what they need.
- **Data:** league table columns sort (with `aria-sort`); the Fixture Card's filters, search and date order, Home's day and the Stats measure live in the URL (`useUrlState`), so views can be shared; bars show value, average and rank on hover.
- **States:** out of season, Home opens on the nearest matchday and says the season is complete; each section has a loading skeleton and an in-page error panel with Try again (shell and header stay).
- **Payload:** the search index loads when Search first opens (`/api/hub/search-index`), and match pages name themselves in the breadcrumb, so the shell data sent with every page shrank by about 15 KB.

Not done: pages are still rendered per request (the shell reads the hub clock and the pins cookie), so Competition, Team and Referee pages aren't cached yet.

## 9 Nov 2026: User API and pins

- Every `me` path in `docs/openapi.yaml` is now `user`: `GET /api/v1/user`, `GET`/`POST /api/v1/user/pins`, `DELETE /api/v1/user/pins/{pinId}`, `PUT /api/v1/user/home` (operationIds `get_user`, `get_user_pins`, …; schema `User`). The routing catalog and generated types follow.
- The User Pinned endpoints are built (`app/api/v1/user/`) to the contract: 201/409/422 on pin, 204/404 on unpin, max 20 pins. **Temporary hold:** with no sign-in or database yet, pins live in a signed httpOnly cookie (`src/server/user-pins.ts`, key `HUB_COOKIE_SECRET`), so they persist per browser, not across devices. Only that module changes when Cognito and storage arrive.
- The sidebar and Pin button read pins on the server and change them through the API, with optimistic updates that roll back on failure. Pins saved in the browser before this change are not carried over.

## 9 Nov 2026: Oval Hub redesign

Built from the design handoff in `design/oval-hub-handoff/` (spec `HANDOFF.md`, 22 screens). All 22 pages are rebuilt in the repo's own components; the prototype's `support.js` and inline styles are not used.

- **Tokens and type:** the handoff colours are theme tokens in `src/styles.css` (`bg-page`, `border-line`, `text-mute`, `bg-side`, `text-club`, `text-win`…); IBM Plex is self-hosted from `app/fonts/`.
- **Shell:** in the root layout (`src/components/oval/app-shell.tsx`, data from `src/server/shell.ts`). The Pin button stays alongside Downloads (User Pinned); the handoff's five pins are the defaults.
- **Routes:** entity Overview is the root (`/teams/harlequins`); tabs are `fixtures`, `table`, `people`, `stats`, `feeds`, `squad`. Matches are `/matches/{RugbyViz id}` with `video` and `stats`. Next opponent is `/opposition/{team}`; `/next-opponent` redirects. Old tab slugs redirect to the nearest tab.
- **"Now":** the real clock, or `HUB_NOW`. Home's day strip, the sidebar's next opponent, Next opponent and match states follow it. With the real clock after June 2026 the season is over, so Home opens on an empty day and Next opponent falls back to the Fixture Card.
- **Check values:** every figure in `HANDOFF.md` section 5 is a test in `src/server/feeds/feeds.test.ts`.
- **Links:** a crawl of 189 internal links from every page returned no errors.

Where the build differs from the screens on purpose:

- Team availability (Managed / Return to play, the Squad availability view) is left out: it was taken out of scope on 8 Oct.
- Home shows only competitions in the feeds, so the URC and Top 14 example groups are gone.
- Harlequins' crest reads "HQ" everywhere (the screens mix HQ and HAR).
- Player percentiles aren't invented: season figures show without percentiles until the player feed exists.
- Illustrative match data (momentum, stats, try and kick map) is tied to the real score so it never contradicts it; unplayed matches say so instead.
- Copy that guessed a player's or referee's pronouns uses neutral wording.

Feeds still needed for the demo and illustrative areas:

| Area                                                                                   | Feed                                |
| -------------------------------------------------------------------------------------- | ----------------------------------- |
| Player figures, percentiles, heatmap, clips; competition player list; team key players | Player stats feed                   |
| Squad selection, matchday 23, minutes per match                                        | Team sheets                         |
| Referee penalties, cards, set piece, advantage                                         | Officiating feed                    |
| Match momentum, top stats, timeline events, try and kick map                           | Event feed with x/y coordinates     |
| Match video, clips, key moments                                                        | Clip / video feed                   |
| Exports list, Downloads count                                                          | Exports API                         |
| Pool tables for the cups; standings by round                                           | EPCR standings; per-round standings |

## 9 Nov 2026: Contract layer

Groundwork for reshaping the 33 routed spec endpoints (the "Map v2 source" set) onto `docs/openapi.yaml`. No endpoint is reshaped yet: there are no captured v2 payloads to map from, and field names are not guessed.

- `src/api/openapi.d.ts` is generated from the spec (`npm run gen:api`). A reshaper's return type is the operation's 200 body, so a wrong field name fails `tsc`.
- `src/server/contract/reshape.ts` holds reshapers by operationId. With one present, the route returns the contract body. If any upstream call fails, the route returns an `ApiError` instead. Without one, the route stays pass-through.
- `scripts/check-contract.ts` checks that every `spec: true` catalog route exists in the spec with the derived operationId, and that every reshaper has a routed spec route. It then runs each fixture in `fixtures/upstream/<operationId>/` through its reshaper and validates the result against the 200 schema (Ajv, JSON Schema 2020-12). See `fixtures/upstream/README.md` to capture one.
- `GET /api/v1/routing` now gives each route's `operationId` and `contract`, plus `progress` (33 routed spec endpoints, 0 reshaped).
- Pass-through bodies now include `request.params` / `request.query`, so a saved response is a complete fixture.
- Fixed: error bodies now match `ApiError`. The no-v2-source 501 used `code: "not_implemented"` (not in the enum) plus a top-level `hub` key (`additionalProperties: false`). It now sends `upstream_unavailable` with `details.reason: "no_v2_source"`. Reshaped endpoints map upstream 401/403/404/429 to their codes and anything else to 502. They never pass the upstream body through.
- Fixed: the catalog marked `GET user/home` as in the spec. The spec only has `PUT /user/home`, and the home page comes from `GET /user` (`homePath`).

- `docs/openapi.yaml`: the pin endpoints (`GET`/`POST /user/pins`, `DELETE /user/pins/{pinId}`, `PUT /user/home`) now sit in their own **User Pinned** section. The rest of the old "Session, pins and search" section is now "Session and search" (`GET /user` session info and `GET /search`).

Blocked before mapping can start:

1. **Upstream payloads.** Run with `OVAL_API_GATEWAY_URL` and a Cognito id token, then capture each endpoint into `fixtures/upstream/`.
2. **Hub id → RugbyViz id.** The spec takes slugs (`gallagher-prem`), but upstreams need numeric ids, so `/competitions/gallagher-prem/standings` answers 422 today. A slug ↔ `compId`/`teamId`/`playerId`/`officialId` source is needed (likely `list-competitions` / `returnteams` / `returnofficials`; confirm from payloads).
3. **Current season default.** The spec defaults `season` to the current season. The catalog needs it passed explicitly.

## 9 Nov 2026: Next.js security update

`next` and `eslint-config-next` upgraded from 16.4.0 to 16.4.5: `next build` on 16.4.0 now stops with a known-vulnerability warning. Build, typecheck and lint pass on 16.4.5.

## 8 Oct 2026: Team availability removed

Team availability is out of scope. Removed: the Home Availability panel, the "Squad available" stat, player status (Available / Managed / Return to play) on squad lists, player headers and Cohesion, the `/teams/{teamId}/availability` routing gap, and from `docs/openapi.yaml` the availability endpoint, the `AvailabilityStatus` type and the squad `status` / `statusNote` fields.

## 8 Oct 2026: V3 upstream routing

Added `app/api/v1/[...path]/route.ts`, `src/server/upstream/` and `scripts/check-v2-routing.ts`.

- `next build` failed on two `noPropertyAccessFromIndexSignature` errors in `client.server.ts`; fixed (`headers["Authorization"]`).
- The routing check reports 35 routed reads, 11 with no v2 source (501) and 6 v2 calls deliberately not routed.
- Responses: `/routing` 200, missing env 503, slug instead of numeric id 422, no v2 source 501, unknown path 404. The Cognito id token is forwarded without the `Bearer ` prefix, as v2 does.

## 8 Oct 2026: Pages removed

The Matches library (`/matches`), Downloads (`/downloads`) and the pre-redesign legacy pages (`/reports`, `/event-search`, `/video-library`, `/teams-players`, `/competitions` index) were removed and now return 404. Match workspaces (`/matches/:id/:tab`) and competition workspaces (`/competitions/:id/:tab`) are unchanged. The remaining 273 URLs were re-verified: all load with no console errors.

## Port from TanStack Start: what changed

| TanStack Start                                              | Next.js                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/routes/*.tsx` file routes (27)                         | `app/**/page.tsx` + `layout.tsx`                                               |
| `head()`                                                    | `metadata` / `generateMetadata()`                                              |
| `beforeLoad` + `redirect()`                                 | `redirect()` in server pages; fixed URL in `next.config.ts`                    |
| `<Outlet />` in entity/match layouts                        | `children` in `layout.tsx`                                                     |
| `<Link to params search activeProps>`                       | `@/lib/link` renders `next/link` with the same props (47 call sites unchanged) |
| `useRouterState`, `useNavigate`                             | `usePathname`, `useSearchParams`, `useRouter`                                  |
| `createServerFn` + `useServerFn` (Lovable AI + cache table) | `POST /api/v1/insights` route handler reading the AWS Oval Insights API        |
| `import.meta.env.VITE_*` keys                               | Removed; only `INSIGHTS_API_URL` / `INSIGHTS_API_KEY` (server-only)            |
| `import img from "@/assets/x.jpg"`                          | `"/assets/x.jpg"` from `public/`                                               |
| Vite + `@lovable.dev/vite-tanstack-config`                  | Next.js + `@tailwindcss/postcss` (Tailwind 4 unchanged)                        |

Removed: `src/router.tsx`, `src/start.ts`, `src/server.ts`, `routeTree.gen.ts`, Lovable error capture, the Lovable AI gateway and the prototype's backend client. Sign-in is proposed as AWS Cognito, added in `proxy.ts` when it's built (plan Phase 0).

**Lovable:** this project can no longer be edited in Lovable.

### Port verified

- `next build` and `tsc --noEmit` pass; `eslint` has 0 errors.
- All 280 URLs (every competition, team, player and referee tab, every match tab, legacy redirects) were loaded in both the original and this port: same final URL, same `<h1>`, same page text, no console errors. Screenshots of 8 key pages at desktop and mobile differ by under 0.3% of pixels.

### Fixes made during the port

- Active entity tab now shows its underline and bold (the original's classes clashed with the defaults, so only the colour changed).
- `MatchCentre` called hooks after an early return (rules-of-hooks bug).
- `/matches/:id` with no tab now redirects to the Overview tab (was blank).
- `/api/v1/insights` never fails the whole batch: each card gets `ready`, `pending`, `unavailable` or `placeholder`.
- The browser no longer sends prompt data for AI insights; it sends only subject, scope and season.
