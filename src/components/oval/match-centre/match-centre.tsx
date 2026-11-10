"use client";

// Match Centre for one fixture (Match → Match Centre tab). Score and match facts are in the match
// header above, from the fixtures feed; these views read the Hub's v2 routes
// (docs/openapi.yaml matches/{matchId}/stats, lineups, player-stats, live-xml), the same RugbyViz
// widgets the v2 Match Centre used. The fixture's Live XML and event files download from here.
import { Download } from "lucide-react";

import { LiveXmlPanel } from "@/components/oval/match-centre/live-xml";
import { UpstreamView } from "@/components/oval/match-centre/upstream-view";
import type { Fixture } from "@/lib/rugby";
import { useUrlState } from "@/lib/url-state";
import { cn } from "@/lib/utils";

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

const DOWNLOADS = [
  {
    label: "Live XML",
    href: (id: number) => `/api/v1/matches/${id}/live-xml?download=1`,
    primary: true,
  },
  {
    label: "Event XML",
    href: (id: number) => `/api/v1/matches/${id}/download/xml?download=1`,
    primary: false,
  },
  {
    label: "Event CSV",
    href: (id: number) => `/api/v1/matches/${id}/download/csv?download=1`,
    primary: false,
  },
];

export function FixtureMatchCentre({ fixture, played }: { fixture: Fixture; played: boolean }) {
  const [view, setView] = useUrlState<View>(
    "view",
    "summary",
    VIEWS.map((item) => item.key),
  );
  const current = VIEWS.find((item) => item.key === view) ?? VIEWS[0];

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-5 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[19px] font-semibold leading-none">Match Centre</h2>
          <p className="mt-1 text-[13px] text-mute">
            Stats, lineups, kicking, quarters, player data and the Live XML feed for this fixture.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DOWNLOADS.map((item) => (
            <a
              key={item.label}
              href={item.href(fixture.id)}
              className={cn(
                "inline-flex h-[30px] items-center gap-1.5 rounded-[3px] px-3 text-[13px] font-medium",
                item.primary
                  ? "bg-ink text-white hover:bg-ink/88"
                  : "border border-line bg-panel hover:bg-subtle",
              )}
            >
              <Download className="size-3.5" /> {item.label}
            </a>
          ))}
        </div>
      </div>

      <section
        aria-label="Match centre"
        className="overflow-hidden rounded border border-line bg-panel"
      >
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
        <div role="tabpanel" aria-label={current.label} className="p-4">
          {view === "live-xml" ? (
            <LiveXmlPanel matchId={fixture.id} />
          ) : !played ? (
            <div className="rounded border border-line2 px-4 py-6 text-center text-[13px] text-mute">
              Not played yet. Match data appears once the match has been played; Live XML is
              available from kick-off.
            </div>
          ) : (
            <UpstreamView key={view} url={viewUrl(fixture.id, view)} />
          )}
        </div>
      </section>
    </div>
  );
}
