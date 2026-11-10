"use client";

// Fixture Card (HANDOFF.md section 4, without the referee and venue columns and with round
// numbers only, as asked after the handoff), built once and used on Competition, Team, Player and
// Referee pages. Rows are feed fixtures, newest first. Asset availability isn't in the feeds yet,
// so every asset can be ticked; Download hands the selection to the exports API once it exists.
import { ArrowRight, Download, RotateCcw, Search } from "lucide-react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useClubHref } from "@/components/oval/app-shell";
import { ComingSoonButton } from "@/components/oval/coming-soon";
import { withCellRoles } from "@/components/oval/primitives";
import { Button } from "@/components/ui/button";
import { recordFor, resultFor, ukDate, ukTime, type Fixture, type ResultLetter } from "@/lib/rugby";
import { useUrlState } from "@/lib/url-state";
import { cn } from "@/lib/utils";

const PRESETS = {
  Default: ["TX", "Report CSV", "Team XML", "Events XML"],
  Videos: ["TX", "Tight", "Wide"],
  Reports: ["Report CSV", "Report PDF"],
  Files: ["Team XML", "Events XML", "Events CSV", "Events JSON"],
} as const;
type Preset = keyof typeof PRESETS;

export type FixtureCardProps = {
  title: string;
  description: string;
  fixtures: Fixture[];
  /** Team and Player pages: results and names are coloured from this club's side. */
  perspective?: string;
  /** Which filters to show. Competition pages filter by round, the others by competition. */
  filters: { competition?: boolean; result?: boolean; round?: boolean };
  /** Extra source note, e.g. "Premiership Rugby Cup isn't in these feeds." */
  sourceNote?: string;
};

const ALL = "all";

export function FixtureCard({
  title,
  description,
  fixtures,
  perspective,
  filters,
  sourceNote,
}: FixtureCardProps) {
  const clubHref = useClubHref();
  // Filters live in the URL so a filtered Fixture Card can be shared and survives Back.
  const router = useRouter();
  const pathname = usePathname();
  const [competition, setCompetition] = useUrlState<string>("competition", ALL);
  const [round, setRound] = useUrlState<string>("round", ALL);
  const [result, setResult] = useUrlState<ResultLetter | typeof ALL>("result", ALL, [
    ALL,
    "W",
    "D",
    "L",
  ]);
  const [preset, setPreset] = useUrlState<Preset>("assets", "Default", [
    "Default",
    "Videos",
    "Reports",
    "Files",
  ]);
  const [order, setOrder] = useUrlState<"newest" | "oldest">("order", "newest", [
    "newest",
    "oldest",
  ]);
  const [urlQuery, setUrlQuery] = useUrlState<string>("q", "");
  const [query, setQuery] = useState<string>(urlQuery);
  useEffect(() => {
    if (query === urlQuery) return;
    const timer = window.setTimeout(() => setUrlQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query, urlQuery, setUrlQuery]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAssets, setShowAssets] = useState(false);

  const competitions = useMemo(
    () => [...new Map(fixtures.map((f) => [f.competition.slug, f.competition])).values()],
    [fixtures],
  );
  const rounds = useMemo(() => {
    const seen: string[] = [];
    for (const fixture of [...fixtures].reverse())
      if (!seen.includes(roundLabel(fixture))) seen.push(roundLabel(fixture));
    return seen;
  }, [fixtures]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = fixtures.filter((fixture) => {
      if (competition !== ALL && fixture.competition.slug !== competition) return false;
      if (round !== ALL && roundLabel(fixture) !== round) return false;
      if (result !== ALL && perspective && resultFor(fixture, perspective) !== result) return false;
      if (!q) return true;
      return [fixture.home.club.name, fixture.away.club.name].some((text) =>
        text.toLowerCase().includes(q),
      );
    });
    return order === "oldest" ? [...filtered].reverse() : filtered;
  }, [fixtures, competition, round, result, perspective, query, order]);

  const columns = PRESETS[preset];
  const key = (fixtureId: number, asset: string) => `${fixtureId}:${asset}`;
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleColumn = (asset: string) =>
    setSelected((current) => {
      const ids = rows.map((fixture) => key(fixture.id, asset));
      const allOn = ids.every((id) => current.has(id));
      const next = new Set(current);
      for (const id of ids) {
        if (allOn) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  const clear = () => {
    setQuery("");
    setSelected(new Set());
    router.replace(pathname, { scroll: false });
  };

  const grid = `104px minmax(0,1.3fr) 76px minmax(0,1.3fr) 140px ${columns.map(() => "64px").join(" ")} 84px`;
  const summary = perspective
    ? summaryFor(rows, perspective)
    : `${rows.length} ${rows.length === 1 ? "match" : "matches"}`;

  return (
    <>
      <div>
        <h2 className="text-[19px] font-semibold leading-none">{title}</h2>
        <p className="mt-1 text-[13px] text-mute">{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {filters.competition && competitions.length > 1 && (
          <SelectBox
            label="Competition"
            value={competition}
            onChange={setCompetition}
            options={[
              [ALL, "All competitions"],
              ...competitions.map((c): [string, string] => [c.slug, c.name]),
            ]}
          />
        )}
        {filters.round && (
          <SelectBox
            label="Round"
            value={round}
            onChange={setRound}
            options={[[ALL, "All rounds"], ...rounds.map((r): [string, string] => [r, r])]}
          />
        )}
        {filters.result && perspective && (
          <SelectBox
            label="Result"
            value={result}
            onChange={(value) => setResult(value as ResultLetter | typeof ALL)}
            options={[
              [ALL, "All results"],
              ["W", "Won"],
              ["D", "Drawn"],
              ["L", "Lost"],
            ]}
          />
        )}
        <label className="flex h-[30px] items-center gap-2 rounded-[3px] border-[1.5px] border-club bg-panel px-2.5">
          <span className="text-xs text-mute">Assets</span>
          <select
            aria-label="Asset type"
            value={preset}
            onChange={(event) => setPreset(event.target.value as Preset)}
            className="min-h-0 bg-transparent font-medium text-ink outline-none"
          >
            {Object.keys(PRESETS).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="flex h-[30px] w-[260px] items-center gap-2 rounded-[3px] border border-line bg-panel px-3 text-mute">
          <Search className="size-3.5 shrink-0" />
          <input
            type="search"
            aria-label="Search fixtures"
            placeholder="Search team"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-0 min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-faint"
          />
        </label>
        <span className="ml-auto" />
        <Button variant="outline" onClick={clear} className="px-3.5">
          <RotateCcw className="size-3.5" />
          Clear
        </Button>
        {selected.size === 0 ? (
          <Button
            disabled
            title="Tick the assets you need first"
            className="px-3.5 disabled:bg-[#B8B8B2] disabled:opacity-100"
          >
            <Download className="size-3.5" />
            Download
          </Button>
        ) : (
          <ComingSoonButton variant="default" needs="the exports API" className="px-3.5">
            <Download className="size-3.5" />
            Download {selected.size}
          </ComingSoonButton>
        )}
      </div>

      {/* Phones: one card per match; asset ticks behind "Select assets". */}
      <div className="overflow-hidden rounded border border-line bg-panel md:hidden">
        <div className="flex items-center justify-between border-b border-line2 px-4 py-2.5">
          <span className="text-xs font-medium text-ink">{summary}</span>
          <button
            type="button"
            aria-expanded={showAssets}
            onClick={() => setShowAssets((value) => !value)}
            className="h-7 min-h-0 rounded-[3px] border border-line px-2.5 text-xs font-medium"
          >
            {showAssets ? "Hide assets" : "Select assets"}
          </button>
        </div>
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-mute">No matches for these filters.</div>
        )}
        {rows.map((fixture) => {
          const outcome = perspective ? resultFor(fixture, perspective) : null;
          const label = `${fixture.home.club.name} v ${fixture.away.club.name}`;
          return (
            <div key={fixture.id} className="border-b border-line2 px-4 py-3 last:border-b-0">
              <div className="flex justify-between text-xs text-mute">
                <span>
                  {ukDate(fixture.dateTime)} ·{" "}
                  <span className="font-mono">{ukTime(fixture.dateTime)}</span>
                </span>
                <span className="truncate pl-2">
                  {fixture.knockout ? fixture.round : `R${roundLabel(fixture)}`}
                </span>
              </div>
              <NextLink
                href={`/matches/${fixture.id}`}
                className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5"
              >
                <span
                  className={cn(
                    "truncate text-right",
                    perspective === fixture.home.club.slug ? "font-medium text-club" : "text-ink",
                  )}
                >
                  {fixture.home.club.name}
                </span>
                <span
                  className={cn(
                    "text-[15px] font-semibold tabular-nums",
                    outcome === "W" ? "text-win" : outcome === "L" ? "text-loss" : "text-ink",
                  )}
                >
                  {fixture.scored ? `${fixture.home.score}–${fixture.away.score}` : "v"}
                </span>
                <span
                  className={cn(
                    "truncate",
                    perspective === fixture.away.club.slug ? "font-medium text-club" : "text-ink",
                  )}
                >
                  {fixture.away.club.name}
                </span>
              </NextLink>
              <div className="mt-1 truncate text-center text-[11px] text-mute">
                {[fixture.competition.name, poolOf(fixture)].filter(Boolean).join(" · ")}
                {!fixture.scored && " · No score in feed"}
                {outcome && ` · ${outcome === "W" ? "Won" : outcome === "L" ? "Lost" : "Drawn"}`}
              </div>
              <div className="mt-2 flex justify-center gap-2">
                <NextLink
                  href={matchCentreHref(fixture)}
                  className="inline-flex h-7 items-center gap-1 rounded-[3px] border border-line px-2.5 text-xs font-medium"
                >
                  Match centre <ArrowRight className="size-3" />
                </NextLink>
              </div>
              {showAssets && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {columns.map((asset) => {
                    const id = key(fixture.id, asset);
                    return (
                      <label
                        key={asset}
                        className={cn(
                          "flex h-7 items-center gap-1.5 rounded-[3px] border px-2 text-xs",
                          selected.has(id) ? "border-club bg-club-tint" : "border-line",
                        )}
                      >
                        <input
                          type="checkbox"
                          aria-label={`${asset} · ${label}`}
                          checked={selected.has(id)}
                          onChange={() => toggle(id)}
                          className="size-3.5 min-h-0 accent-[var(--club)]"
                        />
                        {asset}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded border border-line bg-panel md:block">
        <div role="table" aria-label={title} className="min-w-[860px]">
          <div
            role="row"
            className="grid items-center gap-2.5 border-b border-line bg-[#F9FAFB] px-4 py-2.5 text-[11px] font-medium text-mute"
            style={{ gridTemplateColumns: grid }}
          >
            {withCellRoles(
              <>
                <span aria-sort={order === "newest" ? "descending" : "ascending"}>
                  <button
                    type="button"
                    onClick={() => setOrder(order === "newest" ? "oldest" : "newest")}
                    title={
                      order === "newest"
                        ? "Newest first: show oldest first"
                        : "Oldest first: show newest first"
                    }
                    className="inline-flex min-h-0 items-center gap-1 hover:text-ink"
                  >
                    Date · KO (UK) {order === "newest" ? "↓" : "↑"}
                  </button>
                </span>
                <span className="text-right">Home</span>
                <span className="text-center">Result</span>
                <span>Away</span>
                <span>Round</span>
                {columns.map((asset) => (
                  <button
                    key={asset}
                    type="button"
                    title="Select the whole column"
                    onClick={() => toggleColumn(asset)}
                    className="min-h-0 text-center uppercase hover:text-ink"
                  >
                    {asset}
                  </button>
                ))}
                <span className="text-center">Match Centre</span>
              </>,
              "columnheader",
            )}
          </div>
          <div role="rowgroup" className="max-h-[560px] overflow-y-auto">
            {rows.length === 0 && (
              <div className="px-4 py-8 text-center text-mute">No matches for these filters.</div>
            )}
            {rows.map((fixture, index) => {
              const outcome = perspective ? resultFor(fixture, perspective) : null;
              const homeIsClub = perspective === fixture.home.club.slug;
              const awayIsClub = perspective === fixture.away.club.slug;
              const label = `${fixture.home.club.name} v ${fixture.away.club.name}`;
              return (
                <div
                  key={fixture.id}
                  role="row"
                  className={cn(
                    "grid items-center gap-2.5 border-t border-line2 px-4 py-2 first:border-t-0",
                    index === 0 && "shadow-[inset_2px_0_0_var(--club)]",
                  )}
                  style={{ gridTemplateColumns: grid }}
                >
                  {withCellRoles(
                    <>
                      <span className="flex flex-col leading-[1.3]">
                        <span className="text-xs text-ink">{ukDate(fixture.dateTime)}</span>
                        <span className="font-mono text-[11px] font-medium text-faint">
                          {ukTime(fixture.dateTime)}
                        </span>
                      </span>
                      <NextLink
                        href={clubHref(fixture.home.club.slug)}
                        className={cn(
                          "truncate text-right hover:underline",
                          homeIsClub ? "font-medium text-club" : "text-ink",
                        )}
                      >
                        {fixture.home.club.name}
                      </NextLink>
                      <NextLink
                        href={`/matches/${fixture.id}`}
                        className="flex flex-col items-center leading-[1.3] hover:underline"
                      >
                        {fixture.scored ? (
                          <>
                            <span
                              className={cn(
                                "text-sm font-semibold leading-[1.3] tabular-nums",
                                outcome === "W"
                                  ? "text-win"
                                  : outcome === "L"
                                    ? "text-loss"
                                    : "text-ink",
                              )}
                            >
                              {fixture.home.score}–{fixture.away.score}
                              {outcome && (
                                <span className="sr-only">
                                  {outcome === "W"
                                    ? ", won"
                                    : outcome === "L"
                                      ? ", lost"
                                      : ", drawn"}
                                </span>
                              )}
                            </span>
                            {fixture.home.ht !== null && fixture.away.ht !== null && (
                              <span className="font-mono text-[11px] text-faint">
                                HT {fixture.home.ht}–{fixture.away.ht}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-center text-[11px] leading-tight text-faint">
                            No score in feed
                          </span>
                        )}
                      </NextLink>
                      <NextLink
                        href={clubHref(fixture.away.club.slug)}
                        className={cn(
                          "truncate hover:underline",
                          awayIsClub ? "font-medium text-club" : "text-ink",
                        )}
                      >
                        {fixture.away.club.name}
                      </NextLink>
                      <span className="flex min-w-0 flex-col leading-[1.3]">
                        <span className="truncate text-xs text-[#55554F]">
                          {roundLabel(fixture)}
                        </span>
                        <span className="truncate text-[11px] text-faint">
                          <NextLink
                            href={`/competitions/${fixture.competition.slug}`}
                            className="hover:underline"
                          >
                            {fixture.competition.name}
                          </NextLink>
                          {poolOf(fixture) && ` · ${poolOf(fixture)}`}
                        </span>
                      </span>
                      {columns.map((asset) => {
                        const id = key(fixture.id, asset);
                        return (
                          <span key={asset} className="flex justify-center">
                            <input
                              type="checkbox"
                              aria-label={`${asset} · ${label}`}
                              checked={selected.has(id)}
                              onChange={() => toggle(id)}
                              className="size-[17px] min-h-0 cursor-pointer accent-[var(--club)]"
                            />
                          </span>
                        );
                      })}
                      <span className="flex justify-center">
                        <NextLink
                          href={matchCentreHref(fixture)}
                          aria-label={`Open match centre: ${label}`}
                          className="grid size-7 place-items-center rounded-[3px] border border-line bg-panel text-ink hover:bg-subtle"
                        >
                          <ArrowRight className="size-3.5" />
                        </NextLink>
                      </span>
                    </>,
                    "cell",
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 border-t border-line2 bg-[#F9FAFB] px-4 py-3 text-xs text-mute">
            <span className="font-medium text-ink">{summary}</span>
            <span>
              Source: 2025/26 fixtures and results feeds. Kick-offs in UK time.
              {sourceNote ? ` ${sourceNote}` : ""}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/** Round column: just the number ("18"); knockouts keep their name ("Semi-final"). */
function roundLabel(fixture: Fixture): string {
  return fixture.roundNumber !== null && !fixture.knockout
    ? String(fixture.roundNumber)
    : fixture.round;
}

/** The pool a pool-stage fixture is in ("Pool 3"), shown under the round. */
function poolOf(fixture: Fixture): string | null {
  return /^(Pool \d+)/.exec(fixture.round)?.[1] ?? null;
}

/** The fixture's Match Centre (a tab on its match page). */
function matchCentreHref(fixture: Fixture): string {
  return `/matches/${fixture.id}/match-centre`;
}

function summaryFor(rows: Fixture[], club: string): string {
  const record = recordFor(rows, club);
  return `${rows.length} ${rows.length === 1 ? "match" : "matches"} · ${record.won} won, ${record.drawn} drawn, ${record.lost} lost`;
}

function SelectBox({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="flex h-[30px] items-center rounded-[3px] border border-line bg-panel px-2.5">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-0 bg-transparent font-medium text-ink outline-none"
      >
        {options.map(([optionValue, text]) => (
          <option key={optionValue} value={optionValue}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
