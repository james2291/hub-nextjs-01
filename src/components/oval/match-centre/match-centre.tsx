"use client";

// Competition Match Centre: a fixture browser (status, team, round) and, for the selected
// fixture, its match centre. Score and match facts come from the fixtures feed; the analysis
// views read the Hub's v2 routes (docs/openapi.yaml matches/{matchId}/stats, lineups,
// player-stats, live-xml). Each fixture also offers its Live XML as a download.
import { Download, ExternalLink } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { useClubHref } from "@/components/oval/app-shell";
import { LiveXmlPanel } from "@/components/oval/match-centre/live-xml";
import { UpstreamView } from "@/components/oval/match-centre/upstream-view";
import { ColourBar } from "@/components/oval/primitives";
import { ukDate, ukTime, type Fixture } from "@/lib/rugby";
import { useUrlState } from "@/lib/url-state";
import { cn } from "@/lib/utils";

const PLAYED_AFTER_MS = 2 * 60 * 60 * 1000;

const VIEWS = [
  { key: "summary", label: "Summary" },
  { key: "lineups", label: "Lineups" },
  { key: "kicking", label: "Kicking" },
  { key: "quarters", label: "Quarters" },
  { key: "players", label: "Player data" },
  { key: "live-xml", label: "Live XML" },
] as const;
type View = (typeof VIEWS)[number]["key"];

function viewUrl(matchId: number, view: View): string {
  const base = `/api/v1/matches/${matchId}`;
  if (view === "summary") return `${base}/stats?widget=matchstats`;
  if (view === "lineups") return `${base}/lineups`;
  if (view === "kicking") return `${base}/stats?widget=kicks`;
  if (view === "quarters") return `${base}/stats?widget=quarters`;
  return `${base}/player-stats`;
}

export function MatchCentre({
  competitionName,
  fixtures,
  now,
}: {
  competitionName: string;
  fixtures: Fixture[];
  now: string;
}) {
  const clubHref = useClubHref();
  const nowMs = new Date(now).getTime();
  const played = (fixture: Fixture) =>
    nowMs >= new Date(fixture.dateTime).getTime() + PLAYED_AFTER_MS;
  const [status, setStatus] = useUrlState<"all" | "completed" | "upcoming">("status", "all", [
    "all",
    "completed",
    "upcoming",
  ]);
  const [team, setTeam] = useUrlState<string>("team", "all");
  const [round, setRound] = useUrlState<string>("round", "all");
  const [view, setView] = useUrlState<View>(
    "view",
    "summary",
    VIEWS.map((item) => item.key),
  );

  const teams = useMemo(
    () =>
      [
        ...new Map(
          fixtures.flatMap((f) => [f.home.club, f.away.club]).map((club) => [club.slug, club]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    [fixtures],
  );
  const rounds = useMemo(
    () => [...new Set([...fixtures].reverse().map((f) => f.round))],
    [fixtures],
  );
  const list = fixtures.filter(
    (fixture) =>
      (status === "all" || (status === "completed") === played(fixture)) &&
      (team === "all" || fixture.home.club.slug === team || fixture.away.club.slug === team) &&
      (round === "all" || fixture.round === round),
  );
  const fallback = String((fixtures.find(played) ?? fixtures[0])?.id ?? "");
  const [matchParam, setMatch] = useUrlState<string>("match", fallback);
  const selected =
    fixtures.find((fixture) => String(fixture.id) === matchParam) ??
    fixtures.find((fixture) => String(fixture.id) === fallback);
  // Keep the selected fixture visible in the list (e.g. when arriving from a Fixture Card link).
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selected?.id]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-5 md:px-6">
      <div>
        <h2 className="text-[19px] font-semibold leading-none">{competitionName} Match Centre</h2>
        <p className="mt-1 text-[13px] text-mute">
          Pick a fixture for its match centre: stats, lineups, kicking, quarters, player data and
          the Live XML feed, with downloads.
        </p>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section
          aria-label="Fixtures"
          className="overflow-hidden rounded border border-line bg-panel"
        >
          <div className="flex flex-wrap gap-2 border-b border-line2 p-3">
            <div
              role="radiogroup"
              aria-label="Status"
              className="flex basis-full rounded-[3px] border border-line p-0.5"
            >
              {(["all", "completed", "upcoming"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={status === key}
                  onClick={() => setStatus(key)}
                  className={cn(
                    "h-7 min-h-0 flex-1 rounded-[2px] px-2.5 text-xs capitalize",
                    status === key ? "bg-ink text-white" : "hover:bg-subtle",
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
            <Select
              label="Team"
              value={team}
              onChange={setTeam}
              options={[
                ["all", "All teams"],
                ...teams.map((club): [string, string] => [club.slug, club.name]),
              ]}
            />
            <Select
              label="Round"
              value={round}
              onChange={setRound}
              options={[
                ["all", "All rounds"],
                ...rounds.map((item): [string, string] => [item, item]),
              ]}
            />
          </div>
          <div ref={listRef} className="max-h-[640px] overflow-y-auto">
            {list.length === 0 && (
              <p className="px-4 py-8 text-center text-mute">No fixtures for these filters.</p>
            )}
            {list.map((fixture) => {
              const active = selected?.id === fixture.id;
              return (
                <button
                  key={fixture.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMatch(String(fixture.id))}
                  className={cn(
                    "block w-full border-b border-line2 px-4 py-2.5 text-left last:border-b-0",
                    active ? "bg-club-tint shadow-[inset_2px_0_0_var(--club)]" : "hover:bg-subtle",
                  )}
                >
                  <span className="flex justify-between text-[11px] text-mute">
                    <span>{fixture.round}</span>
                    <span>
                      {ukDate(fixture.dateTime)} · {ukTime(fixture.dateTime)}
                    </span>
                  </span>
                  {(["home", "away"] as const).map((side) => (
                    <span key={side} className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <ColourBar colour={fixture[side].club.colour} />
                        <span className="truncate">{fixture[side].club.name}</span>
                      </span>
                      <span className="font-semibold tabular-nums">
                        {played(fixture) ? (fixture[side].score ?? "–") : ""}
                      </span>
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
          <p className="border-t border-line2 px-4 py-2 text-[11px] text-mute">
            {list.length} of {fixtures.length} fixtures
          </p>
        </section>

        {selected ? (
          <section
            aria-label="Match centre"
            className="min-w-0 overflow-hidden rounded border border-line bg-panel"
          >
            <div className="border-b border-line2 px-4 py-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                <NextLink
                  href={clubHref(selected.home.club.slug)}
                  className="truncate text-right text-base font-semibold hover:underline sm:text-lg"
                >
                  {selected.home.club.name}
                </NextLink>
                <span className="text-2xl font-semibold tabular-nums">
                  {played(selected) && selected.scored ? (
                    `${selected.home.score}–${selected.away.score}`
                  ) : (
                    <span className="font-mono text-lg text-mute">{ukTime(selected.dateTime)}</span>
                  )}
                </span>
                <NextLink
                  href={clubHref(selected.away.club.slug)}
                  className="truncate text-base font-semibold hover:underline sm:text-lg"
                >
                  {selected.away.club.name}
                </NextLink>
              </div>
              <p className="mt-1 text-center text-xs text-mute">
                {[
                  played(selected)
                    ? selected.scored
                      ? "Full time"
                      : "No score in feed"
                    : "Upcoming",
                  ukDate(selected.dateTime),
                  selected.venue,
                  selected.round,
                  selected.referee ? `Referee ${selected.referee.name}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                {played(selected) && selected.home.ht !== null && selected.away.ht !== null
                  ? ` · HT ${selected.home.ht}–${selected.away.ht}`
                  : ""}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <a
                  href={`/api/v1/matches/${selected.id}/live-xml?download=1`}
                  className="inline-flex h-[30px] items-center gap-1.5 rounded-[3px] bg-ink px-3 text-[13px] font-medium text-white hover:bg-ink/88"
                >
                  <Download className="size-3.5" /> Live XML
                </a>
                <a
                  href={`/api/v1/matches/${selected.id}/download/xml?download=1`}
                  className="inline-flex h-[30px] items-center gap-1.5 rounded-[3px] border border-line px-3 text-[13px] font-medium hover:bg-subtle"
                >
                  <Download className="size-3.5" /> Event XML
                </a>
                <a
                  href={`/api/v1/matches/${selected.id}/download/csv?download=1`}
                  className="inline-flex h-[30px] items-center gap-1.5 rounded-[3px] border border-line px-3 text-[13px] font-medium hover:bg-subtle"
                >
                  <Download className="size-3.5" /> Event CSV
                </a>
                <NextLink
                  href={`/matches/${selected.id}`}
                  className="inline-flex h-[30px] items-center gap-1.5 rounded-[3px] border border-line px-3 text-[13px] font-medium hover:bg-subtle"
                >
                  <ExternalLink className="size-3.5" /> Match page
                </NextLink>
              </div>
            </div>
            <div
              role="tablist"
              aria-label="Match centre views"
              className="flex gap-[22px] overflow-x-auto border-b border-line2 px-4 max-md:[mask-image:linear-gradient(to_right,black_80%,transparent)]"
            >
              {VIEWS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={view === item.key}
                  onClick={() => setView(item.key)}
                  className={cn(
                    "-mb-px h-[38px] min-h-0 shrink-0 whitespace-nowrap border-b-2 px-0.5",
                    view === item.key
                      ? "border-ink font-medium text-ink"
                      : "border-transparent text-mute hover:text-ink",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              aria-label={VIEWS.find((item) => item.key === view)?.label}
              className="p-4"
            >
              {view === "live-xml" ? (
                <LiveXmlPanel key={selected.id} matchId={selected.id} />
              ) : !played(selected) ? (
                <div className="rounded border border-line2 px-4 py-6 text-center text-[13px] text-mute">
                  Not played yet. Match data appears once the match has been played.
                </div>
              ) : (
                <UpstreamView key={`${selected.id}-${view}`} url={viewUrl(selected.id, view)} />
              )}
            </div>
          </section>
        ) : (
          <p className="text-mute">No fixtures in the feed for this competition.</p>
        )}
      </div>
    </div>
  );
}

function Select({
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
    <label className="flex h-[30px] min-w-0 flex-1 items-center rounded-[3px] border border-line bg-panel px-2">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-0 w-full min-w-0 bg-transparent text-xs font-medium text-ink outline-none"
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
