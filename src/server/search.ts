// Search (⌘K) index, built from the feeds. Players come from the prototype data until a player
// feed exists.
import { players, getTeam as getDemoTeam } from "@/data/hub";
import { ordinal, recordFor } from "@/lib/rugby";
import { competitionHeader } from "@/server/entities";
import {
  getClubs,
  getCompetitions,
  getFixtures,
  getReferees,
  getStandings,
  competitionsOf,
  standingOf,
} from "@/server/feeds";

export type SearchType = "competition" | "team" | "player" | "referee";

export type SearchItem = {
  type: SearchType;
  id: string;
  name: string;
  detail: string;
  meta: string;
  href: string;
  /** Shown when the search box is empty (the "top" results). */
  featured: boolean;
  /** Order within its type. */
  rank: number;
};

function placeName(name: string) {
  return name.split(" ")[0] ?? name;
}

export function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];
  getCompetitions().forEach((competition, index) => {
    const games = getFixtures({ competition: competition.slug });
    const teams = new Set(
      games.flatMap((fixture) => [fixture.home.club.slug, fixture.away.club.slug]),
    );
    const header = competitionHeader(competition.slug);
    const champion = header?.meta.match(/Champions ([^·]+)/)?.[1]?.trim();
    const status = header?.meta.split(" · ").slice(0, 2).join(" · ") ?? "2025/26";
    items.push({
      type: "competition",
      id: competition.slug,
      name: competition.longName,
      detail: status,
      meta: [
        `${teams.size} teams`,
        `${games.length} matches`,
        ...(champion ? [`Champions ${placeName(champion)}`] : []),
      ].join(" · "),
      href: `/competitions/${competition.slug}`,
      featured: true,
      rank: index,
    });
  });

  const prem = getStandings("gallagher-prem");
  for (const club of getClubs()) {
    const row = standingOf(club.slug);
    const record = row ?? recordFor(getFixtures({ club: club.slug }), club.slug);
    items.push({
      type: "team",
      id: club.slug,
      name: club.name,
      detail: row
        ? `Gallagher PREM · ${ordinal(row.position)}`
        : competitionsOf(club.slug)
            .map((competition) => competition.name)
            .join(" · "),
      meta: `${record.won} W · ${record.drawn} D · ${record.lost} L${row ? ` · ${row.points} pts` : ""}`,
      href: `/teams/${club.slug}`,
      featured: Boolean(row),
      rank: row ? row.position : 100 + (prem?.rows.length ?? 0),
    });
  }

  players.forEach((player, index) => {
    const stat = player.stats[0];
    items.push({
      type: "player",
      id: player.id,
      name: player.name,
      detail: `${getDemoTeam(player.teamId)?.name ?? player.teamId} · ${player.position}`,
      meta: stat ? `${stat.value} ${stat.label.toLowerCase()}` : "",
      href: `/players/${player.id}`,
      featured: true,
      rank: index,
    });
  });

  getReferees().forEach((referee, index) => {
    items.push({
      type: "referee",
      id: referee.slug,
      name: referee.name,
      detail: "Referee · 2025/26",
      meta: `${referee.matches} matches across ${referee.byCompetition
        .map((entry) => (entry.competition.slug === "gallagher-prem" ? "PREM" : "EPCR"))
        .filter((value, i, all) => all.indexOf(value) === i)
        .join(" and ")}`,
      href: `/referees/${referee.slug}`,
      featured: index < 6,
      rank: index,
    });
  });
  return items;
}
