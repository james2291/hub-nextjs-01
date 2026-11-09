// Competition Teams & players (prototype Comp-People): one card per club in final position order,
// then the player list. Player rows are demo data until the player feed exists. Squad status
// (availability) is out of scope and not shown. Server component.
import NextLink from "next/link";

import { PageBody } from "@/components/oval/app-shell";
import { ClubCrest, ClubLabel, DataNote, FormLetters, Section } from "@/components/oval/primitives";
import { players } from "@/data/hub";
import { CURRENT_USER } from "@/lib/user";
import { ordinal, recordFor, recordLabel, type ClubRef, type ResultLetter } from "@/lib/rugby";
import { cn } from "@/lib/utils";
import { getClub, getCompetition, getFixtures, getStandings } from "@/server/feeds";
import { clubHrefs } from "@/server/links";

type ClubCard = {
  club: ClubRef;
  line: string;
  pointsFor: number;
  tries: number | null;
  last5: ResultLetter[];
};

export function CompetitionPeople({ slug }: { slug: string }) {
  const competition = getCompetition(slug);
  if (!competition) return null;
  const href = clubHrefs();
  const standings = getStandings(slug);
  const games = getFixtures({ competition: slug });

  const cards: ClubCard[] = standings
    ? standings.rows.map((row) => ({
        club: row.club,
        line: `${ordinal(row.position)} · ${row.points} pts`,
        pointsFor: row.pointsFor,
        tries: row.triesFor,
        last5: row.last5,
      }))
    : [
        ...new Map(
          games
            .flatMap((fixture) => [fixture.home.club, fixture.away.club])
            .map((club) => [club.slug, club]),
        ).values(),
      ]
        .map((club) => {
          const own = games.filter(
            (fixture) =>
              fixture.home.club.slug === club.slug || fixture.away.club.slug === club.slug,
          );
          const record = recordFor(own, club.slug);
          return {
            club,
            line: recordLabel(record),
            pointsFor: record.pointsFor,
            tries: null,
            last5: [] as ResultLetter[],
            won: record.won,
          };
        })
        .sort((a, b) => b.won - a.won || a.club.name.localeCompare(b.club.name));

  const clubSlugs = new Set(cards.map((card) => card.club.slug));
  const roster = players.filter((player) => clubSlugs.has(player.teamId));

  return (
    <PageBody>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold">Clubs · {cards.length}</h2>
        <span className="text-xs text-mute">
          {standings
            ? "Ordered by final position · standings feed"
            : "Ordered by wins · fixtures feed"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const mine = card.club.slug === CURRENT_USER.clubSlug;
          return (
            <NextLink
              key={card.club.slug}
              href={href(card.club.slug)}
              className={cn(
                "min-w-0 bg-panel px-4 py-3.5 hover:bg-subtle",
                mine && "shadow-[inset_0_-2px_0_var(--club)]",
              )}
            >
              <div className="flex items-center gap-2.5">
                <ClubCrest club={card.club} size={32} />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{card.club.name}</div>
                  <div className="text-xs text-mute">{card.line}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_1fr_1.3fr] gap-2 text-xs">
                <Figure label="Points for" value={card.pointsFor} />
                {card.tries !== null ? <Figure label="Tries" value={card.tries} /> : <span />}
                {card.last5.length > 0 && (
                  <div>
                    <div className="text-mute">Last 5</div>
                    <FormLetters results={card.last5} />
                  </div>
                )}
              </div>
            </NextLink>
          );
        })}
      </div>

      <DataNote label="DEMO DATA">
        Player rows are Hub demo data until the player feed arrives.
      </DataNote>
      <Section title="Players" meta={`${roster.length} with connected data`}>
        <div
          role="row"
          className="grid h-[30px] grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_50px_minmax(0,1.2fr)] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute"
        >
          <span>Player</span>
          <span>Club</span>
          <span>Position</span>
          <span className="text-right">Apps</span>
          <span>Headline</span>
        </div>
        {roster.map((player) => {
          const club = getClub(player.teamId);
          const headline = player.stats[0];
          return (
            <div
              key={player.id}
              className="grid h-[35px] grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_50px_minmax(0,1.2fr)] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0"
            >
              <NextLink href={`/players/${player.id}`} className="truncate hover:underline">
                {player.name}
              </NextLink>
              {club ? (
                <ClubLabel club={club} href={href(club.slug)} />
              ) : (
                <span className="text-mute">{player.teamId}</span>
              )}
              <span className="text-mute">{player.position}</span>
              <span className="text-right tabular-nums">{player.apps}</span>
              <span className="truncate">
                {headline ? `${headline.value} ${headline.label.toLowerCase()}` : ""}
              </span>
            </div>
          );
        })}
        {roster.length === 0 && (
          <p className="px-4 py-6 text-mute">No players with connected data in this competition.</p>
        )}
      </Section>
    </PageBody>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-mute">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}
