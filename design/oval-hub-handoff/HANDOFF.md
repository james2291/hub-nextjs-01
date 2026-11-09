# Oval Hub redesign: implementation handoff

This package is the agreed final design for the Oval Hub redesign: 22 pages for a pro rugby club analyst (the reference club is Harlequins). It is a **design reference, not code to copy**. Rebuild each page in the repo's existing framework, components and data layer so it matches the screenshots.

## What's in the package

| Folder | Contents | How to use it |
|---|---|---|
| `screens/` | One PNG per page at 1440px wide | The visual target. Match these. |
| `reference-html/` | Each page rendered to static HTML, with exact CSS values inline | Read it for exact spacing, sizes, colours and copy. Open it in a browser to inspect. |
| `prototype/` | Interactive source files (`.dc.html`) with the runtime `support.js` | Shows the interactive behaviour: tabs, filters, collapse, search. Run `python3 -m http.server` in this folder and open `Home-Hub.dc.html`. |
| `data/` | The real 2025/26 feeds the design was built from | Use it for fixtures, tests and checking numbers. |

Do not ship `support.js`, the `.dc.html` format, or the inline-style approach. Translate them into the repo's own components and styling system.

---

## 1. Design system

### Colour tokens (light theme)

| Token | Value | Use |
|---|---|---|
| `page` | `#F6F6F4` | App background |
| `panel` | `#FFFFFF` | Cards and panels |
| `line` | `#E2E2DD` | Panel borders, grid gaps |
| `line2` | `#EDEDE9` | Row dividers inside tables |
| `subtle` | `#F3F3F0` | Hover and secondary fills |
| `ink` | `#18181B` | Primary text |
| `mute` | `#66665F` | Secondary text, labels |
| `faint` | `#9B9B93` | Tertiary text, placeholders |
| `side` | `#1A1B1E` | Sidebar background |
| `sideAct` | `#2A2B30` | Active sidebar item |
| `sideInk` | `#B8B9BE` | Sidebar text |
| `sideLab` | `#7C7D84` | Sidebar section labels |
| `red` | `#C8102E` | Club accent: primary buttons, "your club" highlight, active states |
| `redTint` | `#FBF3F4` | Highlighted row (your club) |
| `win` | `#1E7A3C` | Wins, positive numbers |
| `loss` | `#B42318` | Losses, negative numbers |
| `amber` | `#A15C07` | Warnings ("Managed", "Return to play") |
| `pitch` / `pitch2` | `#2F6B3F` / `#2A6038` | Pitch graphics |

### Type

- **Fonts:** IBM Plex Sans for UI. IBM Plex Mono for codes, tags, W/L letters and file types.
- **Numbers:** always `font-variant-numeric: tabular-nums`.
- **Sizes:**

  | Element | Size and weight |
  |---|---|
  | Body and tables | 13px |
  | Labels | 11–12px |
  | Panel titles | 13px / 600 |
  | Entity title | 22px / 600 |
  | KPI values | 22–24px / 600 |

### Shape and density

- **Radius:** 4px on panels, 3px on controls.
- **Shadows and gradients:** none. Separation comes from 1px borders only.
- **Tables:** 30px header rows, 34px body rows, 16px horizontal padding.
- **KPI strips:** one bordered box split into equal cells by 1px gaps, not separate cards.
- **Club colour:** a 3px-wide vertical bar beside the club name, used in every list and table.
- **Crests:** a square with a 3-letter code (e.g. `HQ`, `NTN`) on the club colour. Text is dark on light colours, white otherwise.
- **Notes about data** (DATA, DEMO DATA, ILLUSTRATIVE): a dashed-border strip with a red mono label. Keep these until the real feed replaces the content.

### Tone of copy

Plain, sentence case, no exclamation marks. Write numbers with units, e.g. "31 pts", "24.9 per match".

---

## 2. App shell (every page)

Each page is 1440px wide and has three parts.

### Sidebar (200px, dark)

| Section | Items and links |
|---|---|
| Logo | Oval Hub |
| This week | **Home** → Home. **Next opponent** → Next opponent; the right-hand label shows the opponent's short name, e.g. "Exeter". |
| Library | **Matches** → Match overview. **Fixture Card** → Team Fixture Card. |
| Pinned | **Harlequins** → Team overview. **Gallagher PREM** → Competition overview. **Marcus Smith** → Player overview. **Christophe Ridley** → Referee overview. **R18 v Northampton** → Match overview. |
| Footer | User name and club ("James Molyneux · Harlequins · Analysis") |

The active item uses the `sideAct` background.

### Top bar (48px)

From left to right:

- Breadcrumbs.
- Search box (320px, shows ⌘K). It opens the Search modal.
- "Downloads" button with a count. It links to Competition → Feeds.

### Entity header

Used on Competition, Team, Player and Referee pages:

- Crest, title, and one meta line with values separated by " · ".
- Action buttons on the right.
- A tab row underneath. The active tab has a 2px ink underline.

| Entity | Meta line |
|---|---|
| Team | `9th in Gallagher PREM · 31 pts · 6W 0D 12L · Champions Cup round of 16 · Twickenham Stoop · Head coach Danny Wilson · Your club` |
| Competition | `2025/26 · Season complete · Champions Northampton Saints · 18 rounds and play-offs · 93 matches` |
| Referee | `RFU · Elite panel · 14 matches in 2025/26 (PREM 10, Champions Cup 3, Challenge Cup 1)` |

Derive these values from data. Don't hard-code them.

---

## 3. Page inventory

Suggested routes are below. Adapt them to the repo's router and naming.

| # | Section | Page | Prototype file | Suggested route | Data |
|---|---|---|---|---|---|
| 1 | Global | Home (matchday) | `Home-Hub` | `/` | Fixtures feeds + standings |
| 2 | Global | Search (⌘K modal) | `Search` | modal on any page | Competitions, teams, players, referees |
| 3 | Global | Next opponent | `Opposition` | `/opposition/:teamId` | Fixtures feeds, as of "now" |
| 4 | Match | Overview | `Match-Story` | `/matches/:id` | Fixture + **illustrative** event data |
| 5 | Match | Video | `Match` | `/matches/:id/video` | **Illustrative** (clip feed) |
| 6 | Match | Stats | `Match-Map` | `/matches/:id/stats` | **Illustrative** (x/y events) |
| 7 | Competition | Overview | `Comp-Overview` | `/competitions/:id` | Standings + fixtures |
| 8 | Competition | Fixture Card | `Comp-Fixtures` | `/competitions/:id/fixtures` | Fixtures feed |
| 9 | Competition | Table | `Competition` | `/competitions/:id/table` | Standings |
| 10 | Competition | Teams & players | `Comp-People` | `/competitions/:id/people` | Standings (clubs); players **demo** |
| 11 | Competition | Stats | `Comp-Stats` | `/competitions/:id/stats` | Standings |
| 12 | Competition | Feeds | `Comp-Feeds` | `/competitions/:id/feeds` | File/export list (analyst only) |
| 13 | Team | Overview | `Team-Overview` | `/teams/:id` | Standings + fixtures; key players **demo** |
| 14 | Team | Fixture Card | `Team-Fixtures` | `/teams/:id/fixtures` | All 3 fixtures feeds |
| 15 | Team | Squad | `Squad` | `/teams/:id/squad` | **Demo** (team sheets) |
| 16 | Team | Stats | `Team-Stats` | `/teams/:id/stats` | Standings + fixtures |
| 17 | Player | Overview | `Player` | `/players/:id` | Player KPIs **demo**; recent matches real |
| 18 | Player | Fixture Card | `Player-Fixtures` | `/players/:id/fixtures` | Team's fixtures until team sheets exist |
| 19 | Player | Stats | `Player-Percentiles` | `/players/:id/stats` | **Demo** |
| 20 | Referee | Overview | `Referee` | `/referees/:id` | Appointments real; discipline **demo** |
| 21 | Referee | Fixture Card | `Ref-Fixtures` | `/referees/:id/fixtures` | All 3 fixtures feeds |
| 22 | Referee | Stats | `Ref-Stats` | `/referees/:id/stats` | **Demo**, except match count |

### Tabs per entity

| Entity | Tabs |
|---|---|
| Match | Overview · Video · Stats |
| Competition | Overview · Fixture Card · Table · Teams & players · Stats · Feeds (analyst only) |
| Team | Overview · Fixture Card · Squad · Stats |
| Player | Overview · Fixture Card · Stats |
| Referee | Overview · Fixture Card · Stats |

The old **Matches** tab is replaced by **Fixture Card** everywhere.

---

## 4. Key page behaviour

### Home (`Home-Hub`), the FotMob-style matchday page

- **Layout:** centre column with a day strip and grouped match list; the full league table in a 430px right column. There is no left competitions column and no other right-hand panels.
- **Day strip:**
  - Shows dates around "today".
  - Today is a filled dark pill.
  - Previous and next arrows.
  - Selecting a day changes the list.
- **Match list:**
  - **Groups:** one group per competition the user has access to. The group header shows a crest, the competition name (links to the competition overview), the round, and a "N matches" count with a chevron that collapses the group.
  - **Each match row:** home team (right-aligned) with its colour bar, kick-off time (or score once played), away team with its colour bar, a play icon, and a follow star. The whole row links to the match page. The user's club row is highlighted with `redTint` and red text.
- **Removed:** no All / Harlequins / Following / By time tabs, and no "your match today" hero card.
- **Table:**
  - **Columns:** #, Club, P, W, D, L, PD, BP, Pts, Last 5.
  - **Rows:** the user's club is highlighted. The top-4 play-off line is shown under 4th.
  - **Links:** club names link to that team's page. The next opponent links to Next opponent.
  - **Last 5:** W/L letters in mono, coloured with `win`/`loss`, newest on the right.
- **Data note:** in the prototype, URC and Top 14 groups carry an "Example data" tag. Real data should only show competitions in the user's feeds.

### Fixture Card (Competition, Team, Player, Referee)

- **Columns:** Date and KO (UK time); Home; Result with HT underneath; Away; Round with the competition underneath; Venue with attendance underneath; Referee; asset checkboxes (TX, Report CSV, Team XML, Events XML); and a Match Centre arrow.
- **Rows:** newest first.
- **Filters:** competition (Team/Player/Referee pages only), result (W/D/L for Team/Player), an "Assets" preset dropdown, free-text search (team, venue or referee), and Clear.
- **Download button:** greyed out until assets are ticked.
- **Team-perspective pages:** the result is green or red from the club's side, and the club name is red.
- **Footer:** count and summary, e.g. "23 matches · 9 won, 0 drawn, 14 lost", plus the source.
- **Missing score:** show "No score in feed" (e.g. Cheetahs v Ulster, 11 Jan, Challenge Cup).

### Search (⌘K)

- **Opening:** a modal over a dimmed page.
- **Tabs with counts:** All · Competitions · Teams · Players · Referees.
- **Results:** grouped by type. Each result has an icon, a name, detail underneath, and meta on the right.
- **Keyboard:** ↑↓ to move, ↵ to open, Tab to switch type, Esc to close. The first result is highlighted.

### Next opponent (`Opposition`)

- **Header:** "as of now": kick-off, last meeting, the opponent's record in the competition, and the referee with their record.
- **Comparison:** "Season so far" table comparing the two clubs.
- **Preview pack:** a "Build the preview pack" checklist and button.
- **Recent form:** both clubs' last 6 matches across all competitions.

### Competition Stats

- Ranking bars with buttons for: Points, Points difference, Tries for, Tries against, Bonus points, Losing bonus points.
- Each bar shows a league-average marker, and the user's club is in red.
- A season totals panel sits alongside.

### Team Stats

- Each measure is shown against the league average, with the club's rank ("8th of 10") and the best club in that measure.
- A home/away split panel.

---

## 5. Data rules

### Feeds (see `data/`)

| File | Contains |
|---|---|
| `10xx_202501_fixturesresults.json` | Fixtures and results. `competition.id`: 1011 = Gallagher PREM, 1008 = Investec Champions Cup, 1026 = EPCR Challenge Cup. |
| `1001_202501_standings.json` | Standings. `groups[]` holds one row per club (position, points, won/drawn/lost, pointsFor/Against/Diff, triesFor/Against, triesBonus, losingBonus, bonus). `form[]` holds each club's last matches (`matchId`, `matchDate`, `result`). |

### Fixtures fields used

- `dateTime` (UTC; show in Europe/London)
- `round`, `roundTypeId`, `title`
- `homeTeam` and `awayTeam`: `{name, shortName, abbreviatedName, teamColour, score.finalScore, score.htScore}`
- `venue.name`, `attendance`
- `officials[]` (`role == "referee"`)
- `matchStatus`

### Rules

- **Club colour:** `teamColour` is the kit worn in that match, not the club colour. Use the club's most common **home** `teamColour` across all feeds, or a proper club-colour field if the API has one.
- **Short codes:** crest codes come from `abbreviatedName` in upper case, falling back to the first 3 letters of `shortName`.
- **Times:** all times are UK local.
- **"Now" for Home and Next opponent:** this comes from the real clock. The prototype is pinned to Sat 16 May 2026, 14:30, so you can check it against the screenshots: next match Harlequins v Exeter Chiefs, Round 16, 16:00, Allianz Stadium, referee Matthew Carley.
- **Standings timing:** the standings feed is end-of-season only. An "as of date" table needs per-round standings, so flag this rather than recomputing it (the feed has no tries per match).

### Check values (from the feeds)

- **Harlequins:** 9th, 31 pts, 6W 0D 12L, PF 448, PA 589, PD −141, tries 64 for / 90 against, bonus 7.
- **Harlequins in the Champions Cup:** 3W 2L, lost 17–26 to Sale in the round of 16.
- **PREM final:** Northampton 26–17 Exeter, Allianz Stadium, 20 Jun 2026.
- **PREM semi-finals:** Northampton 45–31 Leicester; Bath 26–27 Exeter.
- **Christophe Ridley:** 14 matches (PREM 10, Champions Cup 3, Challenge Cup 1).

---

## 6. Content that is still demo or illustrative

Build the layout with real components, but keep the labelled note until a feed exists:

| Area | Needs |
|---|---|
| Player figures, percentiles, heatmap, clips, competition players table, team key players | Player stats feed |
| Squad selection / matchday 23 | Team sheets |
| Referee penalties, cards, set piece, advantage | Officiating feed |
| Match momentum, timeline, top stats, kick map, try origins | Event feed with x/y coordinates |
| Match video and clips | Clip/video feed |

---

## 7. Links (every one must work)

| From | Goes to |
|---|---|
| Any match row or result | That match's Overview |
| Any club name (tables, lists, cards) | That team's Overview (the next opponent goes to Next opponent) |
| Any competition name | That competition's Overview |
| Referee name | That referee's Overview |
| Player name | That player's Overview |
| "Full table", "Fixture Card", "Stats" panel links | The matching tab |

---

## 8. Suggested build order

1. Tokens, fonts, and the app shell (sidebar, top bar, entity header, tabs, data-note strip).
2. Shared table, KPI strip, crest and colour-bar components.
3. The Fixture Card component, built once and used on 4 pages.
4. Home, the league table component, then Search.
5. The Competition pages, then Team, Referee and Player.
6. The Match pages (layout only, with labelled illustrative data).
7. Next opponent.

## 9. Acceptance checks

- Each page matches its PNG in `screens/` at 1440px. Spacing, type and colours match `reference-html/`.
- No Matches tab remains; Fixture Card is used everywhere.
- The figures in "Check values" appear correctly when the 2025/26 feeds are loaded.
- Every link in section 7 navigates correctly.
- Demo and illustrative areas carry their note.
- Existing tests pass. Add tests for the derived figures (club colour, record, points per match, ranks).
