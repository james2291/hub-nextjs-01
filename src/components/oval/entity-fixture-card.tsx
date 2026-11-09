// Fixture Card tab for each entity: picks the feed fixtures and the copy, then renders the shared
// client FixtureCard. Server component.
import { notFound } from "next/navigation";

import { PageBody } from "@/components/oval/app-shell";
import type { EntityKind } from "@/components/oval/entity-navigation";
import { FixtureCard, type FixtureCardProps } from "@/components/oval/fixture-card";
import { getPlayer } from "@/data/hub";
import {
  SEASON,
  competitionsOf,
  getClub,
  getCompetition,
  getFixtures,
  getReferee,
} from "@/server/feeds";

function listNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function possessive(name: string): string {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

const PREM_CUP_NOTE = "Premiership Rugby Cup isn't in these feeds.";

function propsFor(kind: EntityKind, id: string): FixtureCardProps | undefined {
  if (kind === "competition") {
    const competition = getCompetition(id);
    if (!competition) return undefined;
    return {
      title: `${competition.name} Fixture Card`,
      description: `Every ${competition.name} ${SEASON.label} match, with the video, reports and files for each.`,
      fixtures: getFixtures({ competition: id }),
      filters: { round: true },
    };
  }
  if (kind === "team") {
    const club = getClub(id);
    if (!club) return undefined;
    const competitions = competitionsOf(id).map((competition) => competition.longName);
    return {
      title: `${club.name} Fixture Card`,
      description: `Every ${club.name} match in the ${SEASON.label} ${listNames(competitions)}, with the video, reports and files for each. Results in green or red are from ${possessive(club.name)} side.`,
      fixtures: getFixtures({ club: id }),
      perspective: id,
      filters: { competition: true, result: true },
      ...(competitionsOf(id).some((competition) => competition.slug === "gallagher-prem")
        ? { sourceNote: PREM_CUP_NOTE }
        : {}),
    };
  }
  if (kind === "referee") {
    const referee = getReferee(id);
    if (!referee) return undefined;
    return {
      title: `${referee.name} Fixture Card`,
      description: `Every ${SEASON.label} match ${referee.name} refereed in the ${listNames(referee.byCompetition.map((entry) => entry.competition.name))}, with the video, reports and files for each.`,
      fixtures: getFixtures({ referee: id }),
      filters: { competition: true },
    };
  }
  const player = getPlayer(id);
  const club = player ? getClub(player.teamId) : undefined;
  if (!player || !club) return undefined;
  const competitions = competitionsOf(club.slug).map((competition) => competition.name);
  return {
    title: `${player.name} Fixture Card`,
    description: `${club.name} matches in the ${SEASON.label} ${listNames(competitions)}. The feeds have no team sheets, so this lists every ${club.name} match until the player's appearances are linked.`,
    fixtures: getFixtures({ club: club.slug }),
    perspective: club.slug,
    filters: { competition: true, result: true },
  };
}

export function EntityFixtureCard({ kind, id }: { kind: EntityKind; id: string }) {
  const props = propsFor(kind, id);
  if (!props) notFound();
  return (
    <PageBody>
      <FixtureCard {...props} />
    </PageBody>
  );
}
