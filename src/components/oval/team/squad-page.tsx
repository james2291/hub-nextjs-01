// Server wrapper for the Squad tab: the club's next fixture (hub clock) and demo roster.
import { TeamSquad, type SquadPlayer } from "@/components/oval/team/squad";
import { players } from "@/data/hub";
import { hubNow } from "@/lib/now";
import { opponentOf, ukDate, type Fixture } from "@/lib/rugby";
import { getClub, getNextFixture } from "@/server/feeds";

/** Team sheets are due at 12:00 UK two days before kick-off. */
function sheetDue(fixture: Fixture): string {
  const due = new Date(new Date(fixture.dateTime).getTime() - 2 * 24 * 60 * 60 * 1000);
  return `${ukDate(due).replace(/ \d{4}$/, "")} 12:00`;
}

export function TeamSquadPage({ slug }: { slug: string }) {
  const club = getClub(slug);
  if (!club) return null;
  const next = getNextFixture(slug, hubNow());
  const opponent = next ? opponentOf(next, slug) : null;
  const roster: SquadPlayer[] = players
    .filter((player) => player.teamId === slug)
    .map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      apps: player.apps,
      mins: player.mins,
      headline: player.stats[0]
        ? { value: player.stats[0].value, label: player.stats[0].label }
        : null,
    }));
  return (
    <TeamSquad
      clubName={club.name}
      fixtureLabel={next && opponent ? `${next.round} v ${opponent.name}` : null}
      sheetDue={next ? sheetDue(next) : null}
      players={roster}
    />
  );
}
