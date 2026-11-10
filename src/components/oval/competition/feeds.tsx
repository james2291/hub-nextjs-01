// Competition Feeds (prototype Comp-Feeds, analyst only): raw event files per match for the latest
// round, plus the exports list. Event XML/CSV link to the Hub's v2 upstream routes. The exports
// list is demo data until the exports API exists. Server component.
import NextLink from "next/link";

import { PageBody } from "@/components/oval/app-shell";
import { DataNote, Section } from "@/components/oval/primitives";
import { ukDayMonth } from "@/lib/rugby";
import { cn } from "@/lib/utils";
import { getCompetition, getFixtures } from "@/server/feeds";

const DEMO_EXPORTS: Array<{
  file: string;
  type: string;
  size: string;
  status: "Ready" | "Processing" | "Failed";
  started: string;
}> = [
  {
    file: "Harlequins v Northampton · Analysis pack",
    type: "ZIP",
    size: "428 MB",
    status: "Ready",
    started: "6 Jun · 14:08",
  },
  {
    file: "Round 18 · All Harlequins carries",
    type: "MP4",
    size: "1.2 GB",
    status: "Ready",
    started: "6 Jun · 13:42",
  },
  {
    file: "2025/26 player event data",
    type: "CSV",
    size: "18 MB",
    status: "Processing",
    started: "6 Jun · 13:39",
  },
  {
    file: "Northampton opposition lineouts",
    type: "MP4",
    size: "642 MB",
    status: "Processing",
    started: "6 Jun · 13:31",
  },
  {
    file: "Round 17 raw event export",
    type: "XML",
    size: "41 MB",
    status: "Failed",
    started: "30 May · 18:12",
  },
];

export function CompetitionFeeds({ slug }: { slug: string }) {
  const competition = getCompetition(slug);
  if (!competition) return null;
  const regular = getFixtures({ competition: slug }).filter((fixture) => !fixture.knockout);
  const latest = regular[0]?.roundNumber ?? null;
  const round = regular.filter((fixture) => fixture.roundNumber === latest).reverse();
  const button =
    "inline-flex h-[30px] w-fit items-center rounded-[3px] border border-line bg-panel px-3.5 font-medium text-ink hover:bg-subtle";

  return (
    <PageBody>
      <div className="rounded bg-subtle px-4 py-3 text-[13px] text-[#55554F]">
        Feeds is shown to analysts only: Live XML and raw event files per match, plus exports. Every
        fixture also has Live XML in its Match Centre and on the Fixture Card.
      </div>
      <Section
        minWidth={640}
        title="Match event files"
        meta={round[0]?.round.replace(/ · R(\d+)$/, " round $1") ?? ""}
      >
        <div className="px-4 pb-3">
          <div className="grid h-[30px] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_repeat(4,minmax(0,0.6fr))] items-center gap-2.5 border-b border-line2 text-[11px] font-medium text-mute">
            <span>Match</span>
            <span>Round</span>
          </div>
          {round.map((fixture) => (
            <div
              key={fixture.id}
              className="grid min-h-[49px] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_repeat(4,minmax(0,0.6fr))] items-center gap-2.5 border-b border-line2 last:border-b-0"
            >
              <NextLink href={`/matches/${fixture.id}`} className="truncate hover:underline">
                {fixture.home.club.name} v {fixture.away.club.name}
              </NextLink>
              <span className="text-[#55554F]">
                {fixture.round} · {ukDayMonth(fixture.dateTime)}{" "}
                {new Date(fixture.dateTime).getUTCFullYear()}
              </span>
              <a href={`/api/v1/matches/${fixture.id}/live-xml?download=1`} className={button}>
                Live XML
              </a>
              <a href={`/api/v1/matches/${fixture.id}/download/xml?download=1`} className={button}>
                Event XML
              </a>
              <a href={`/api/v1/matches/${fixture.id}/download/csv?download=1`} className={button}>
                Event CSV
              </a>
              <NextLink href={`/matches/${fixture.id}/video`} className={button}>
                Video MP4
              </NextLink>
            </div>
          ))}
        </div>
      </Section>

      <DataNote label="DEMO DATA">
        The exports list is example data until the exports API is built.
      </DataNote>
      <Section minWidth={600} title="Exports" meta="Also in the Downloads tray">
        <div className="px-4 pb-3">
          <div className="grid h-[30px] grid-cols-[minmax(0,2fr)_minmax(0,0.6fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] items-center gap-2.5 border-b border-line2 text-[11px] font-medium text-mute">
            <span>File</span>
            <span>Type</span>
            <span>Size</span>
            <span>Status</span>
            <span>Started</span>
          </div>
          {DEMO_EXPORTS.map((item) => (
            <div
              key={item.file}
              className="grid h-[33px] grid-cols-[minmax(0,2fr)_minmax(0,0.6fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] items-center gap-2.5 border-b border-line2 last:border-b-0"
            >
              <span className="truncate">{item.file}</span>
              <span className="font-mono text-[11px] text-mute">{item.type}</span>
              <span className="text-[#55554F]">{item.size}</span>
              <span
                className={cn(
                  "text-[11px]",
                  item.status === "Ready"
                    ? "text-win"
                    : item.status === "Failed"
                      ? "text-loss"
                      : "text-amber",
                )}
              >
                {item.status}
              </span>
              <span className="text-[#55554F]">{item.started}</span>
            </div>
          ))}
        </div>
      </Section>
    </PageBody>
  );
}
