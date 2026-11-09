// Player Stats (prototype Player-Percentiles). Season figures are Hub demo data; Hub ratings are
// shown against a same-position peer; percentiles and the heatmap need the player and event feeds.
// The club's last four PREM results are real (fixtures feed). Server component.
import NextLink from "next/link";

import { PageBody } from "@/components/oval/app-shell";
import { possessive, peerOf } from "@/components/oval/player/overview";
import { DataNote, PanelGrid, Section } from "@/components/oval/primitives";
import { getPlayer } from "@/data/hub";
import { opponentOf, recordFor, resultFor, sideOf, ukDayMonth } from "@/lib/rugby";
import { cn } from "@/lib/utils";
import { getClub, getFixtures } from "@/server/feeds";

export function PlayerStats({ slug }: { slug: string }) {
  const player = getPlayer(slug);
  if (!player) return null;
  const club = getClub(player.teamId);
  const peer = peerOf(player);
  const lastFour = club
    ? getFixtures({ club: club.slug, competition: "gallagher-prem" })
        .filter((fixture) => fixture.scored)
        .slice(0, 4)
    : [];
  const record = club ? recordFor(lastFour, club.slug) : null;

  return (
    <PageBody>
      <DataNote label="DEMO DATA">
        Season figures are Hub demo data; ratings, percentiles and the heatmap are illustrative
        until the player feed arrives.
        {club ? ` ${club.name} results are from the fixtures feed.` : ""}
      </DataNote>
      <PanelGrid>
        <Section
          span={7}
          title="Season profile"
          meta={peer ? `Hub ratings v ${peer.name}` : "Hub ratings"}
        >
          <div
            role="row"
            className="grid h-[30px] grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_70px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute"
          >
            <span>Measure</span>
            <span />
            <span className="text-right">Value</span>
          </div>
          <div className="px-4 pt-2 text-xs font-medium">Season figures</div>
          {player.stats.map((stat) => (
            <div
              key={stat.label}
              className="grid min-h-[37px] grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_70px] items-center gap-2.5 border-b border-line2 px-4"
            >
              <span className="leading-tight">
                {stat.label}
                <span className="block text-[11px] text-faint">
                  {stat.detail.replace(/^Competition (\w+)$/, "$1 in PREM")}
                </span>
              </span>
              <span className="text-xs text-faint">Percentile needs the player feed</span>
              <span className="text-right tabular-nums">{stat.value}</span>
            </div>
          ))}
          <div className="px-4 pt-3 text-xs font-medium">Hub ratings (0–100)</div>
          {player.contribution.map((item) => {
            const other = peer?.contribution.find((entry) => entry.label === item.label)?.value;
            const tone = item.value >= 75 ? "bg-win" : item.value < 25 ? "bg-loss" : "bg-[#A8A8A0]";
            return (
              <div
                key={item.label}
                className="grid min-h-[37px] grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_70px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0"
              >
                <span className="leading-tight">
                  {item.label}
                  {peer && other !== undefined && (
                    <span className="block text-[11px] text-faint">
                      {peer.name} {other}
                    </span>
                  )}
                </span>
                <span className="relative block h-2.5 bg-line2">
                  <span
                    className={cn("absolute inset-y-0 left-0", tone)}
                    style={{ width: `${item.value}%` }}
                  />
                  {other !== undefined && (
                    <span
                      className="absolute -top-1 h-[18px] w-0.5 bg-ink"
                      style={{ left: `${other}%` }}
                    />
                  )}
                </span>
                <span className="text-right font-semibold tabular-nums">{item.value}</span>
              </div>
            );
          })}
          <div className="flex gap-4 px-4 py-2.5 text-xs text-mute">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3.5 bg-win" />
              75 and over
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3.5 bg-[#A8A8A0]" />
              25 to 74
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-0.5 bg-ink" />
              {peer?.name ?? "Peer"}
            </span>
          </div>
        </Section>
        <Section
          span={5}
          title={club ? `${possessive(club.name)} last 4 PREM matches` : "Recent matches"}
          meta="From the fixtures feed"
        >
          {club && (
            <div className="grid grid-cols-4">
              {lastFour.map((fixture) => {
                const result = resultFor(fixture, club.slug);
                const side = sideOf(fixture, club.slug) ?? "home";
                const other = side === "home" ? "away" : "home";
                return (
                  <NextLink
                    key={fixture.id}
                    href={`/matches/${fixture.id}`}
                    className="border-r border-line2 px-3.5 py-3 last:border-r-0 hover:bg-subtle"
                  >
                    <span
                      className={cn(
                        "font-mono text-xs font-medium",
                        result === "W" ? "text-win" : "text-loss",
                      )}
                    >
                      {result}
                    </span>
                    <span className="mt-1 block text-xl font-semibold tabular-nums">
                      {fixture[side].score}–{fixture[other].score}
                    </span>
                    <span className="block text-xs leading-tight">
                      {side === "home" ? "v" : "at"} {opponentOf(fixture, club.slug)?.name}
                    </span>
                    <span className="block text-[11px] text-faint">
                      {ukDayMonth(fixture.dateTime)}
                    </span>
                  </NextLink>
                );
              })}
            </div>
          )}
          {record && club && (
            <p className="border-t border-line2 px-4 py-3 text-xs text-mute">
              {club.name} won {record.won} of their last {lastFour.length} PREM matches, scoring{" "}
              {record.pointsFor} points. Minutes and points per match for {player.name} need team
              sheets, which aren&apos;t in the feeds yet.
            </p>
          )}
        </Section>
      </PanelGrid>

      <Section
        title="Season heatmap"
        meta={<span className="font-mono text-[11px] font-medium text-club">ILLUSTRATIVE</span>}
      >
        <div className="p-4">
          <div className="relative h-[210px] overflow-hidden rounded-[2px] bg-pitch">
            {Array.from({ length: 10 }, (_, index) => (
              <div
                key={index}
                className={cn("absolute inset-y-0 w-[5%]", index % 2 === 0 ? "bg-pitch2" : "")}
                style={{ left: `${index * 10}%` }}
              />
            ))}
            {[8, 26, 50, 74, 92].map((line) => (
              <div
                key={line}
                className="absolute inset-y-0 w-px bg-white/40"
                style={{ left: `${line}%` }}
              />
            ))}
            {[
              [35, 35, 34],
              [45, 52, 40],
              [55, 28, 46],
              [62, 48, 60],
              [70, 64, 42],
              [80, 38, 36],
            ].map(([x, y, size], index) => (
              <span
                key={index}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  background:
                    "radial-gradient(circle, rgba(200,16,46,0.85), rgba(234,179,8,0.45) 55%, transparent 72%)",
                }}
              />
            ))}
            <span className="absolute right-3 top-2 text-[11px] text-white">Attacking →</span>
          </div>
          <p className="mt-3 text-xs text-mute">
            Layout only. Where {player.name} touches the ball needs x/y event data from the Hub API.
          </p>
        </div>
      </Section>
    </PageBody>
  );
}
