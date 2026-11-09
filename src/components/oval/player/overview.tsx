// Player Overview (prototype Player). Player figures, contribution profile and clips are Hub demo
// data until a player feed exists; the club's recent matches are real (fixtures feed). Server.
import { Play } from "lucide-react";
import NextLink from "next/link";

import { PageBody } from "@/components/oval/app-shell";
import {
  DataNote,
  KpiStrip,
  PanelGrid,
  PanelLink,
  ResultMark,
  Section,
} from "@/components/oval/primitives";
import { getPlayer, players, type Player } from "@/data/hub";
import { opponentOf, resultFor, sideOf, ukDayMonth } from "@/lib/rugby";
import { getClub, getFixtures } from "@/server/feeds";

export function possessive(name: string): string {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

/** A same-position player from the demo data to compare against. */
export function peerOf(player: Player): Player | undefined {
  return players.find((other) => other.id !== player.id && other.position === player.position);
}

export function PlayerOverview({ slug }: { slug: string }) {
  const player = getPlayer(slug);
  if (!player) return null;
  const club = getClub(player.teamId);
  const peer = peerOf(player);
  const recent = club
    ? getFixtures({ club: club.slug })
        .filter((fixture) => fixture.scored)
        .slice(0, 6)
    : [];

  return (
    <PageBody>
      <DataNote label="DEMO DATA">
        {player.name}&apos;s figures, profile and clips are Hub demo data until the player feed
        arrives.{club ? ` ${club.name} matches are from the fixtures feeds.` : ""}
      </DataNote>
      <KpiStrip
        items={player.stats.map((stat) => ({
          label: stat.label,
          value: stat.value,
          detail: stat.detail.replace(/^Competition (\w+)$/, "$1 in PREM"),
        }))}
      />

      <PanelGrid>
        <Section
          span={8}
          title={club ? `${possessive(club.name)} recent matches` : "Recent matches"}
          meta={<PanelLink href={`/players/${slug}/fixtures`}>Fixture Card</PanelLink>}
        >
          <div
            role="row"
            className="grid h-[30px] grid-cols-[70px_minmax(0,1.1fr)_minmax(0,1.2fr)_20px_56px_110px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute"
          >
            <span>Date</span>
            <span>Opponent</span>
            <span>Competition</span>
            <span />
            <span className="text-right">Score</span>
            <span className="text-right">Minutes</span>
          </div>
          {club &&
            recent.map((fixture) => (
              <NextLink
                key={fixture.id}
                href={`/matches/${fixture.id}`}
                className="grid h-[35px] grid-cols-[70px_minmax(0,1.1fr)_minmax(0,1.2fr)_20px_56px_110px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0 hover:bg-subtle"
              >
                <span className="text-mute">{ukDayMonth(fixture.dateTime)}</span>
                <span className="truncate">
                  {sideOf(fixture, club.slug) === "home" ? "v" : "at"}{" "}
                  {opponentOf(fixture, club.slug)?.name}
                </span>
                <span className="truncate text-mute">
                  {fixture.competition.name} · {fixture.round}
                </span>
                <ResultMark result={resultFor(fixture, club.slug)} className="text-[11px]" />
                <span className="text-right tabular-nums">
                  {fixture.home.score}–{fixture.away.score}
                </span>
                <span className="truncate text-right text-faint">Needs team sheets</span>
              </NextLink>
            ))}
        </Section>
        <Section
          span={4}
          title="Contribution profile"
          meta={peer ? `Index 0–100 · v ${peer.name}` : "Index 0–100"}
        >
          {player.contribution.map((item) => {
            const other = peer?.contribution.find((entry) => entry.label === item.label)?.value;
            return (
              <div key={item.label} className="border-b border-line2 px-4 py-2.5 last:border-b-0">
                <div className="mb-1.5 flex justify-between">
                  <span>{item.label}</span>
                  <span>
                    <span className="font-semibold tabular-nums">{item.value}</span>
                    {other !== undefined && <span className="text-mute"> v {other}</span>}
                  </span>
                </div>
                <span className="relative block h-1.5 bg-line2">
                  <span
                    className="absolute inset-y-0 left-0 bg-club"
                    style={{ width: `${item.value}%` }}
                  />
                  {other !== undefined && (
                    <span
                      className="absolute -top-1 h-3.5 w-0.5 bg-ink"
                      style={{ left: `${other}%` }}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </Section>
      </PanelGrid>

      <PanelGrid>
        <Section span={6} title="Latest clips" meta="Send to player">
          {player.clips.map((clip) => (
            <div
              key={clip.title}
              className="flex items-center gap-3 border-b border-line2 px-4 py-2.5 last:border-b-0"
            >
              <span className="flex h-10 w-16 items-center justify-center gap-1 rounded-[2px] bg-ink font-mono text-[11px] text-white">
                <Play className="size-2.5 fill-white" />
                {clip.length}
              </span>
              <span className="min-w-0">
                <span className="block truncate">{clip.title}</span>
                <span className="block truncate text-xs text-mute">{clip.match}</span>
              </span>
            </div>
          ))}
        </Section>
        <Section
          span={6}
          title="Pitch view"
          meta={<PanelLink href={`/players/${slug}/stats`}>Stats</PanelLink>}
        >
          <p className="px-4 py-4 text-[13px] text-mute">
            Event map, heatmap and territory appear once the Hub API sends x/y event coordinates.
            The Stats tab shows the planned layout.
          </p>
        </Section>
      </PanelGrid>
    </PageBody>
  );
}
