"use client";

import { useSearchParams } from "next/navigation";
import { Link } from "@/lib/link";
import { Check, ChevronRight, Download, Film, Play, SearchX, ShieldCheck, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

const lineoutImage = "/assets/rugby-lineout-clip.jpg";
const scrumImage = "/assets/rugby-scrum-clip.jpg";
import { Panel, StatStrip } from "@/components/oval/app-shell";
import { AIInsightSection, type InsightMatch } from "@/components/oval/ai-insights";
import { CompetitionPeople as CompetitionPeopleWorkspace } from "@/components/oval/competition-people";
import { entityTabLabel, useEntityWorkspace } from "@/components/oval/entity-workspace";
import { CompetitionFixtureCard, FixtureCard, playerFixtureRows, refereeFixtureRows, teamFixtureRows } from "@/components/oval/fixture-card";
import { LiveXmlBrowser, MatchCentre, type CentreMatch } from "@/components/oval/match-centre";
import { OverviewCallout, OverviewGrid, OverviewResults, OverviewStats, OverviewTrend, ViewToggle, shortRound, splitFixtureName, type OverviewRow } from "@/components/oval/overview-layout";
import { PlayerSpatialAnalysis, TeamPitchAnalysis } from "@/components/oval/player-spatial-analysis";
import { FormPills, Meter } from "@/components/oval/detail";
import { TeamCohesion, TeamPlayersSection } from "@/components/oval/team-players";
import { TeamVideoLibrary } from "@/components/oval/team-video";
import { VideoCentre, countEvents, playerEventGroups, refereeEventGroups, teamEventGroups, type VideoCentreSubject } from "@/components/oval/video-centre";
import { Button } from "@/components/ui/button";
import { competitions, getNextFixture, getTeam, players, type Competition, type Player, type Referee, type Team } from "@/data/hub";
import type { AiInsightItem } from "@/lib/ai-insights";
import { cn } from "@/lib/utils";

function useClipSearch() {
  const params = useSearchParams();
  const last = Number(params?.get("last")) || undefined;
  const search = { group: params?.get("group") ?? undefined, last };
  return { initialGroup: search.group, lastMatches: search.last };
}

export function EntityTabPage({ tab }: { tab: string }) {
  const { entityType, entity } = useEntityWorkspace();
  if (entityType === "competition") return <CompetitionTab competition={entity as Competition} tab={tab} />;
  if (entityType === "team") return <TeamTab team={entity as Team} tab={tab} />;
  if (entityType === "player") return <PlayerTab player={entity as Player} tab={tab} />;
  return <RefereeTab referee={entity as Referee} tab={tab} />;
}

function TabHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-bold uppercase tracking-widest text-primary">Entity view</div><h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{title}</h2><p className="mt-1 text-[12px] text-muted-foreground">{description}</p></div>{action}</div>;
}

function EmptyState({ title, entityName, detail }: { title: string; entityName: string; detail?: string }) {
  return <Panel className="p-10 text-center"><SearchX className="mx-auto size-7 text-primary" /><h3 className="mt-3 font-display text-lg font-bold">{title}</h3><p className="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">{detail ?? `No ${title.toLowerCase()} is connected to ${entityName} yet.`}</p></Panel>;
}

function CompetitionTab({ competition, tab }: { competition: Competition; tab: string }) {
  if (tab === "match-room") return <CompetitionMatchRoom competition={competition} />;
  if (tab === "match-centre") return <CompetitionMatchCentre competition={competition} />;
  if (tab === "video-centre") return <EventsVideoCentre entityName={competition.name}><VideoCentre mode="competition" competition={competition} /></EventsVideoCentre>;
  if (tab === "table") return <><TabHeading title="Table" description={`Current standings for ${competition.name}.`} /><Standings competition={competition} /></>;
  if (tab === "live-xml") return <CompetitionLiveXml competition={competition} />;
  if (tab === "fixture-card") return <CompetitionFixtureCardTab competition={competition} />;
  if (tab === "players") return <CompetitionPeople competition={competition} />;
  if (tab === "reports") return <EntityReports name={competition.name} kind="Competition" />;
  return <EmptyState title={entityTabLabel("competition", tab)} entityName={competition.name} />;
}

function competitionCentreMatches(competition: Competition): CentreMatch[] {
  return competition.fixtures.map((fixture, index) => ({ id: `${competition.id}-${index}`, round: fixture.round, fixture: fixture.fixture, date: fixture.date, venue: fixture.venue, result: fixture.result }));
}

function CompetitionMatchCentre({ competition }: { competition: Competition }) {
  const { season } = useEntityWorkspace();
  return <><TabHeading title="Match Centre" description={`Open fixtures and results from ${competition.name}.`} />{season === competition.season ? <MatchCentre matches={competitionCentreMatches(competition)} entityName={competition.name} competitionId={competition.id} /> : <EmptyState title="Match Centre" entityName={competition.name} detail={`No connected match records are available for ${season}.`} />}</>;
}

function CompetitionLiveXml({ competition }: { competition: Competition }) {
  const { season } = useEntityWorkspace();
  return <><TabHeading title="Live XML" description={`Live, recent and upcoming XML feeds for ${competition.name}.`} />{season === competition.season ? <LiveXmlBrowser matches={competitionCentreMatches(competition)} competitionName={competition.name} /> : <EmptyState title="Live XML" entityName={competition.name} detail={`No connected XML feeds are available for ${season}.`} />}</>;
}

const matchRoomViews = ["Fixtures & results", "Standings", "Season trends"] as const;
const teamMatchRoomViews = ["Recent matches", "Performance", "Competitions"] as const;

function CompetitionMatchRoom({ competition }: { competition: Competition }) {
  const { season } = useEntityWorkspace();
  const [view, setView] = useState<(typeof matchRoomViews)[number]>("Fixtures & results");
  const completed = competition.fixtures.filter((fixture) => fixture.result !== "Upcoming");
  const latestRound = completed[0]?.round;
  const roundMatches = completed.filter((fixture) => fixture.round === latestRound);
  const inSeason = season === competition.season;
  if (!inSeason) return <EmptyState title="Overview" entityName={competition.name} detail={`No connected match records are available for ${season}.`} />;
  const rows: OverviewRow[] = competition.fixtures.map((fixture, index) => { const { home, away } = splitFixtureName(fixture.fixture); return { key: `${fixture.fixture}-${index}`, tag: shortRound(fixture.round), home, away, detail: `${fixture.venue} · ${fixture.date.replace(" 2026", "")}`, score: fixture.result, tone: fixture.result === "Upcoming" ? "upcoming" : "neutral" }; });
  return <OverviewGrid
    left={<>{roundMatches.length > 0 && <CompetitionRoundSummary competition={competition} fixtures={roundMatches} season={season} />}<OverviewStats stats={[{ label: "Matches", value: String(competition.matches), detail: `${competition.rounds} rounds` }, { label: "Points", value: competition.pointsScored, detail: competition.pointsPerMatch }, { label: "Tries", value: competition.tries, detail: competition.triesPerMatch }, { label: "Ball in play", value: competition.ballInPlay, detail: competition.ballInPlayDelta }]} /></>}
    right={<>{view === "Standings" ? <><div className="flex justify-end"><ViewToggle items={matchRoomViews} value={view} onChange={setView} /></div><Standings competition={competition} /></> : <OverviewResults title={view === "Season trends" ? "Season trends" : "Fixtures & Results"} meta={latestRound ?? ""} actions={<ViewToggle items={matchRoomViews} value={view} onChange={setView} />} rows={view === "Season trends" ? [] : rows} empty="See the league performance trend below." />}<OverviewTrend title="League performance trend" description={`${competition.name} season measures`} items={competition.trends} /></>}
  ><CompetitionFixtureInsights competition={competition} season={season} /></OverviewGrid>;
}

// `data` is accepted for compatibility with the prototype call sites but is no longer sent:
// the AWS Oval Insights API loads its own match data from the subject and scope.
function insightRequest({ cacheKey, scope, matchId, entityId, entityName, season, perspective, sentenceLimit }: AiInsightItem & { data?: unknown }): AiInsightItem {
  return { cacheKey, scope, matchId, entityId, entityName, season, perspective, sentenceLimit };
}

function fixtureInsight(competition: Competition, fixture: Competition["fixtures"][number], season: string) {
  const id = `${competition.id}-${fixture.round}-${fixture.fixture}-${fixture.date}`;
  return insightRequest({ cacheKey: `v1:competition:match:${id}`, scope: "match", matchId: id, entityId: competition.id, entityName: competition.name, season, perspective: "neutral", sentenceLimit: "2-3", data: fixture });
}

function CompetitionRoundSummary({ competition, fixtures, season }: { competition: Competition; fixtures: Competition["fixtures"]; season: string }) {
  const round = fixtures[0]?.round ?? "Latest round";
  return <AIInsightSection title={`AI Round Summary · ${round}`} perspective="neutral" overview={insightRequest({ cacheKey: `v1:competition:round:${competition.id}:${season}:${round}`, scope: "round", matchId: round, entityId: competition.id, entityName: competition.name, season, perspective: "neutral", sentenceLimit: "3-5", data: { round, fixtures } })} matches={[]} />;
}

function CompetitionFixtureInsights({ competition, season }: { competition: Competition; season: string }) {
  const rounds = Array.from(new Set(competition.fixtures.map((fixture) => fixture.round)));
  const initialRound = rounds[0] ?? "";
  const [selectedRound, setSelectedRound] = useState(initialRound);
  const fixtures = competition.fixtures.filter((fixture) => fixture.round === selectedRound);
  const [selectedFixture, setSelectedFixture] = useState(() => fixtures[0] ? `${fixtures[0].fixture}-${fixtures[0].date}` : "");
  const selected = fixtures.find((fixture) => `${fixture.fixture}-${fixture.date}` === selectedFixture) ?? fixtures[0];

  if (!selected) return null;
  const request = fixtureInsight(competition, selected, season);
  return <section className="mt-4" aria-label="Fixture AI insights"><Panel className="p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h3 className="font-display font-semibold">Fixture AI insights</h3><p className="mt-1 text-[11px] text-muted-foreground">Select a round and fixture to review the team insight.</p></div><div className="grid gap-2 sm:grid-cols-2 lg:w-[560px]"><label className="space-y-1"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Round</span><select aria-label="Select round" value={selectedRound} onChange={(event) => { const value = event.target.value; const nextFixtures = competition.fixtures.filter((fixture) => fixture.round === value); setSelectedRound(value); setSelectedFixture(nextFixtures[0] ? `${nextFixtures[0].fixture}-${nextFixtures[0].date}` : ""); }} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring">{rounds.map((round) => <option key={round} value={round}>{round}</option>)}</select></label><label className="space-y-1"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Fixture</span><select aria-label="Select fixture" value={`${selected.fixture}-${selected.date}`} onChange={(event) => setSelectedFixture(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring">{fixtures.map((fixture) => { const value = `${fixture.fixture}-${fixture.date}`; return <option key={value} value={value}>{fixture.fixture}</option>; })}</select></label></div></div></Panel><AIInsightSection title={`AI Match Insight · ${selected.fixture}`} perspective="neutral" overview={request} matches={[]} /></section>;
}

function FixtureTable({ competition }: { competition: Competition }) {
  return <Panel className="overflow-hidden"><div className="border-b border-border p-4"><h3 className="font-display font-semibold">Fixtures &amp; results</h3><p className="text-[11px] text-muted-foreground">Filtered to {competition.name}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="bg-muted/70 text-[10px] uppercase text-muted-foreground"><tr><th className="px-4 py-2.5">Round</th><th>Fixture</th><th>Date</th><th>Venue</th><th>Result</th></tr></thead><tbody className="divide-y divide-border">{competition.fixtures.map((fixture) => <tr key={`${fixture.round}-${fixture.fixture}`}><td className="px-4 py-3 font-semibold">{fixture.round}</td><td className="font-semibold">{fixture.fixture}</td><td className="text-muted-foreground">{fixture.date}</td><td className="text-muted-foreground">{fixture.venue}</td><td className="font-display font-bold">{fixture.result}</td></tr>)}</tbody></table></div></Panel>;
}

function CompetitionFixtureCardTab({ competition }: { competition: Competition }) {
  const { season } = useEntityWorkspace();
  return <><TabHeading title="Fixture Card" description={`Fixtures, results and downloadable match assets for ${competition.name}.`} />{season === competition.season ? <CompetitionFixtureCard competition={competition} /> : <EmptyState title="Fixture Card" entityName={competition.name} detail={`No connected fixtures or assets are available for ${season}.`} />}</>;
}

function CompetitionPeople({ competition }: { competition: Competition }) {
  return <CompetitionPeopleWorkspace competition={competition} />;
}


function Standings({ competition }: { competition: Competition }) {
  return <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4"><h3 className="flex items-center gap-2 font-bold">League table<span className="text-[10px] font-normal uppercase tracking-widest text-muted-foreground">After {competition.stage}</span></h3></div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-xs"><thead className="border-b border-border bg-muted/30"><tr><th className="px-6 py-3">Pos</th><th className="py-3">Team</th><th className="text-center">P</th><th className="text-center">W</th><th className="text-center">D</th><th className="text-center">L</th><th className="px-6 text-right">Pts</th></tr></thead><tbody className="divide-y divide-border/60">{competition.standings.map((row, index) => <tr key={row.teamId} className={cn("transition-colors hover:bg-primary/5", row.teamId === "harlequins" && "bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]")}><td className="px-6 py-3.5 font-mono font-semibold text-muted-foreground">{String(index + 1).padStart(2, "0")}</td><td><Link to="/teams/$teamId/$tab" params={{ teamId: row.teamId, tab: "match-room" }} className="text-sm font-bold hover:text-primary">{row.team}</Link></td><td className="text-center font-mono">{row.p}</td><td className="text-center font-mono text-success">{row.w}</td><td className="text-center font-mono text-muted-foreground">{row.d}</td><td className="text-center font-mono text-destructive">{row.l}</td><td className="px-6 text-right"><span className="inline-block rounded-[2px] bg-foreground px-2 py-1 font-mono text-xs font-bold text-background">{row.pts}</span></td></tr>)}</tbody></table></div></Panel>;
}

function TeamTab({ team, tab }: { team: Team; tab: string }) {
  const clip = useClipSearch();
  if (tab === "cohesion") return <TeamCohesion team={team} />;
  if (tab === "clips") return <ClipsTab subject={{ mode: "team", team }} name={team.name} groups={teamEventGroups} windows={[1, 4, 6]} />;
  if (tab === "match-room") return <TeamMatchRoom team={team} />;
  if (tab === "fixture-card") return <TeamFixtureCardTab team={team} />;
  if (tab === "video-centre") return <EventsVideoCentre entityName={team.name}><VideoCentre key={JSON.stringify(clip)} mode="team" team={team} {...clip} /></EventsVideoCentre>;
  if (tab === "video-library") return <><TabHeading title="Video Library" description={`Pre-canned compilations and full match video for ${team.name}.`} /><TeamVideoLibrary team={team} /></>;
  if (tab === "players") return <TeamSquad team={team} />;
  if (tab === "reports") return <TeamStats team={team} />;
  if (tab === "head-to-head") return <HeadToHead opponent={team} />;
  return <EmptyState title={entityTabLabel("team", tab)} entityName={team.name} />;
}

function HeadToHead({ opponent }: { opponent: Team }) {
  const us = getTeam("harlequins");
  const next = getNextFixture("harlequins");
  if (!us) return <EmptyState title="Head-to-head" entityName={opponent.name} detail="Harlequins comparison data is not supplied." />;
  const threat = players.find((player) => player.teamId === opponent.id);
  const meetings = opponent.recentMatches.filter((match) => match.opponent === us.name);
  return <div className="space-y-4">
    <div className="rounded bg-muted px-4 py-3 text-[13px] text-muted-foreground">Head-to-head appears when you view another team from Harlequins. {next?.fixture.round ?? "Round not supplied"}: {next?.fixture.date ?? "Date not supplied"} at {next?.fixture.venue ?? "Venue not supplied"}.</div>
    <StatStrip stats={[
      { label: "League position", value: `${opponent.position} v ${us.position}`, detail: `${opponent.stats[0]?.detail ?? "Not supplied"} v our ${us.stats[0]?.detail ?? "not supplied"}` },
      { label: "Points for", value: `${opponent.stats[1]?.value ?? "—"} v ${us.stats[1]?.value ?? "—"}`, detail: `${opponent.stats[1]?.detail ?? "Not supplied"} v our ${us.stats[1]?.detail ?? "not supplied"}` },
      { label: "Tries scored", value: `${opponent.stats[2]?.value ?? "—"} v ${us.stats[2]?.value ?? "—"}`, detail: `${opponent.stats[2]?.detail ?? "Not supplied"} v our ${us.stats[2]?.detail ?? "not supplied"}` },
      { label: `${opponent.name} form · last 5`, value: opponent.form.join(" "), detail: "Newest first" },
    ]} />
    <div className="grid gap-4 xl:grid-cols-12">
      <Panel className="p-4 xl:col-span-7"><div className="flex items-center justify-between"><h2 className="text-[13px] font-semibold">Season profile</h2><span className="text-xs text-muted-foreground">{opponent.name} v Harlequins</span></div><div className="mt-5 space-y-4">{opponent.performance.map((item, index) => { const ours = us.performance[index]; return <div key={item.label}><div className="mb-1.5 grid grid-cols-[70px_1fr_70px] text-xs"><strong>{item.value}</strong><span className="text-center text-muted-foreground">{item.label}</span><strong className="text-right">{ours?.value ?? "—"}</strong></div><div className="grid grid-cols-2 gap-1"><div className="flex justify-end"><span className="h-2 bg-foreground" style={{ width: `${item.progress}%` }}/></div><div><span className="block h-2 bg-primary/45" style={{ width: `${ours?.progress ?? 0}%` }}/></div></div></div>; })}</div></Panel>
      <div className="space-y-4 xl:col-span-5"><Link to="/matches/$matchId/$tab" params={{ matchId: "gallagher-prem-2", tab: "video" }} className="group relative block aspect-video overflow-hidden rounded bg-foreground text-background"><img src={lineoutImage} alt="Last meeting lineout" className="h-full w-full object-cover opacity-60"/><span className="absolute left-4 top-4 text-xs font-medium text-background">Last meeting · Lost</span><span className="absolute inset-x-4 bottom-4 flex items-end justify-between"><span><strong className="block text-2xl">17 – 26</strong><span className="text-xs">Harlequins v {opponent.name} · 23 May</span></span><span className="rounded bg-card px-3 py-2 text-xs font-medium text-foreground"><Play className="mr-1 inline size-3 fill-current"/>12 clips</span></span></Link><Panel className="overflow-hidden"><div className="border-b border-border px-4 py-3 text-[13px] font-semibold">{opponent.name}&apos;s recent results</div>{opponent.recentMatches.map((match) => <div key={match.date} className="grid h-9 grid-cols-[28px_1fr_auto] items-center px-4 text-xs"><span className={match.result === "W" ? "font-mono text-success" : match.result === "L" ? "font-mono text-destructive" : "font-mono text-muted-foreground"}>{match.result}</span><span>v {match.opponent} <span className="text-muted-foreground">· {match.date.replace(" 2026", "")}</span></span><strong>{match.score}</strong></div>)}</Panel></div>
    </div>
    <div className="grid gap-4 xl:grid-cols-12">
      <Panel className="p-4 xl:col-span-5"><div className="flex items-center justify-between"><h2 className="text-[13px] font-semibold">Key threat</h2><span className="text-xs text-primary">{threat?.contribution[0]?.label ?? "Profile"} {threat?.contribution[0]?.value ?? "—"}</span></div>{threat ? <><div className="mt-4 flex items-center gap-3"><span className="grid size-13 place-items-center rounded-full bg-muted font-semibold">{threat.initials}</span><span><Link to="/players/$playerId/$tab" params={{ playerId: threat.id, tab: "match-room" }} className="text-lg font-semibold hover:text-primary">{threat.name}</Link><span className="block text-xs text-muted-foreground">{threat.position} · {threat.matchLog[0]?.headline ?? "Match detail not supplied"}</span></span></div><div className="mt-4 grid grid-cols-2 gap-2">{threat.stats.map((stat) => <div key={stat.label} className="bg-muted p-3"><strong className="block text-lg">{stat.value}</strong><span className="text-xs text-muted-foreground">{stat.label}</span></div>)}</div></> : <p className="mt-4 text-xs text-muted-foreground">Detailed threat data not supplied.</p>}</Panel>
      <SeasonDataByCompetition team={opponent} />
    </div>
    {meetings.length === 0 && <p className="text-xs text-muted-foreground">Further head-to-head history not supplied.</p>}
  </div>;
}

function TeamMatchRoom({ team }: { team: Team }) {
  const { season } = useEntityWorkspace();
  const [view, setView] = useState<(typeof teamMatchRoomViews)[number]>("Recent matches");
  if (season !== "2025/26") return <EmptyState title="Overview" entityName={team.name} detail={`No connected match records are available for ${season}.`} />;
  const rows: OverviewRow[] = team.recentMatches.map((match) => ({ key: `${match.opponent}-${match.date}`, tag: match.date.replace(" 2026", ""), home: team.name, away: match.opponent, detail: `${match.clips} clips tagged`, score: match.score, tone: match.result === "W" ? "win" : match.result === "L" ? "loss" : "draw" }));
  return <OverviewGrid
    left={<><OverviewCallout title="Form guide" badge="Last 5"><div className="flex gap-1.5">{team.form.map((result, index) => <span key={index} className={cn("grid size-8 place-items-center rounded-[3px] font-mono text-xs font-bold", result === "W" ? "bg-success/15 text-success" : result === "L" ? "bg-destructive/12 text-destructive" : "bg-muted text-muted-foreground")}>{result}</span>)}</div><p className="mt-3 text-xs text-muted-foreground">{team.position} · {team.record} · Head coach {team.coach}</p></OverviewCallout><OverviewStats stats={team.stats} /></>}
    right={<>{view === "Competitions" ? <><div className="flex justify-end"><ViewToggle items={teamMatchRoomViews} value={view} onChange={setView} /></div><TeamCompetitionCards team={team} season={season} /></> : view === "Performance" ? <><div className="flex justify-end"><ViewToggle items={teamMatchRoomViews} value={view} onChange={setView} /></div><TeamPerformancePanel team={team} /></> : <OverviewResults title="Recent results" meta={`${team.recentMatches.length} matches`} actions={<ViewToggle items={teamMatchRoomViews} value={view} onChange={setView} />} rows={rows} />}<OverviewTrend title="Performance trend" description={`${team.name} season profile`} items={team.performance} /></>}
  ><TeamInsights team={team} season={season} /></OverviewGrid>;
}

function TeamRecentMatches({ team }: { team: Team }) {
  return <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-border p-4"><div><h3 className="font-display font-semibold">Recent matches</h3><p className="text-[11px] text-muted-foreground">Latest results with linked video</p></div><FormPills form={team.form} /></div><div className="divide-y divide-border">{team.recentMatches.map((match) => <div key={`${match.opponent}-${match.date}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 text-xs"><div><div className="font-semibold">{match.opponent}</div><div className="text-[11px] text-muted-foreground">{match.date} · {match.clips} clips</div></div><span className="font-display font-bold tabular-nums">{match.score}</span><span className={cn("rounded px-2 py-1 text-[10px] font-bold", match.result === "W" ? "bg-success/12 text-success" : match.result === "L" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>{match.result}</span></div>)}</div></Panel>;
}

function TeamPerformancePanel({ team }: { team: Team }) {
  return <div className="grid gap-4 xl:grid-cols-12"><Panel className="p-4 xl:col-span-5"><h3 className="font-display font-semibold">Performance profile</h3><p className="text-[11px] text-muted-foreground">Team trend markers for the selected season</p><div className="mt-5 space-y-5">{team.performance.map((item) => <Meter key={item.label} {...item} />)}</div></Panel><Panel className="p-4 xl:col-span-7"><h3 className="font-display font-semibold">Headline season data</h3><StatStrip stats={team.stats} /></Panel></div>;
}

function TeamStats({ team }: { team: Team }) {
  return <><TabHeading title="Team Stats" description={`Season performance and totals for ${team.name}.`} action={<SeasonReportButton name={team.name} kind="Team" rows={[...team.stats, ...team.performance]} />} /><StatStrip stats={team.stats} /><TeamPerformancePanel team={team} /><div className="mt-4"><TeamPitchAnalysis team={team} /></div></>;
}

function TeamInsights({ team, season }: { team: Team; season: string }) {
  const recent = team.recentMatches.slice(0, 5);
  if (recent.length === 0) return <EmptyState title="AI summaries" entityName={team.name} detail="No recent match records are connected for this club yet." />;
  return <div className="mt-5 space-y-4" aria-label="Team AI summaries"><AIInsightSection title="Trends from last 5 matches" perspective="team" overview={insightRequest({ cacheKey: `v1:team:form:${team.id}:${season}`, scope: "form", matchId: "last-5", entityId: team.id, entityName: team.name, season, perspective: "team", sentenceLimit: "3-4", data: { fixtures: recent, seasonStats: team.stats, performance: team.performance } })} matches={[]} /><TeamLastFiveTrend matches={recent} /><TeamSingleMatchInsight team={team} season={season} matches={recent} /></div>;
}

function TeamSquad({ team }: { team: Team }) {
  return <TeamPlayersSection team={team} />;
}

function TeamLastFiveTrend({ matches }: { matches: Team["recentMatches"] }) {
  const counts = matches.reduce((total, match) => ({ ...total, [match.result]: total[match.result] + 1 }), { W: 0, L: 0, D: 0 });
  return <Panel className="p-4"><div className="flex flex-col gap-3 border-b border-border pb-3 lg:flex-row lg:items-center lg:justify-between"><div><h3 className="font-display font-semibold">Last 5 matches</h3><p className="text-[11px] text-muted-foreground">Result trend and linked match context.</p></div><div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase"><span className="rounded bg-success/12 px-2 py-1 text-success">{counts.W} wins</span><span className="rounded bg-destructive/10 px-2 py-1 text-destructive">{counts.L} losses</span><span className="rounded bg-muted px-2 py-1 text-muted-foreground">{counts.D} draws</span></div></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{matches.map((match) => <div key={`${match.opponent}-${match.date}`} className="rounded-md border border-border bg-background p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-xs font-semibold">v {match.opponent}</div><div className="mt-1 text-[10px] text-muted-foreground">{match.date}</div></div><span className={cn("rounded px-2 py-0.5 text-[10px] font-bold", match.result === "W" ? "bg-success/12 text-success" : match.result === "L" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>{match.result}</span></div><div className="mt-3 font-display text-lg font-bold">{match.score}</div><div className="mt-1 text-[10px] text-muted-foreground">{match.clips} clips</div></div>)}</div></Panel>;
}

function TeamSingleMatchInsight({ team, season, matches }: { team: Team; season: string; matches: Team["recentMatches"] }) {
  const [selectedKey, setSelectedKey] = useState(() => matchKey(matches[0]));
  const selected = matches.find((match) => matchKey(match) === selectedKey) ?? matches[0];
  if (!selected) return null;
  const id = `${team.id}-${selected.opponent}-${selected.date}`;
  return <section aria-label="Single match AI summary"><Panel className="p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h3 className="font-display font-semibold">Single match summary</h3><p className="mt-1 text-[11px] text-muted-foreground">Choose one fixture to generate a focused team summary.</p></div><label className="space-y-1 lg:w-[360px]"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Match</span><select aria-label="Select team match summary" value={matchKey(selected)} onChange={(event) => setSelectedKey(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring">{matches.map((match) => <option key={matchKey(match)} value={matchKey(match)}>{match.result} · {match.score} v {match.opponent}</option>)}</select></label></div></Panel><AIInsightSection title={`Single match summary · ${selected.opponent}`} perspective="team" overview={insightRequest({ cacheKey: `v1:team:match:${id}`, scope: "match", matchId: id, entityId: team.id, entityName: team.name, season, perspective: "team", sentenceLimit: "2-3", data: selected })} matches={[]} /></section>;
}

function matchKey(match: Team["recentMatches"][number] | undefined) {
  return match ? `${match.opponent}-${match.date}` : "";
}

function TeamCompetitionCards({ team, season }: { team: Team; season: string }) {
  const memberships = useMemo(() => competitions.filter((competition) => competition.season === season && competition.standings.some((row) => row.teamId === team.id)), [season, team.id]);
  return memberships.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{memberships.map((competition) => <Link key={competition.id} to="/competitions/$competitionId/$tab" params={{ competitionId: competition.id, tab: "match-room" }} className="rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"><div className="flex items-center justify-between"><Trophy className="size-5 text-primary" /><ChevronRight className="size-4 text-muted-foreground" /></div><h3 className="mt-3 font-display font-bold">{competition.name}</h3><p className="mt-1 text-[11px] text-muted-foreground">{competition.stage} · {competition.status}</p></Link>)}</div> : <EmptyState title="Competitions" entityName={team.name} detail={`No connected competition records are available for ${season}.`} />;
}

function TeamCompetitions({ team }: { team: Team }) {
  const { season } = useEntityWorkspace();
  return <><TabHeading title="Competitions" description={`Competitions ${team.name} is playing in during ${season}.`} /><TeamCompetitionCards team={team} season={season} /></>;
}

function PlayerTab({ player, tab }: { player: Player; tab: string }) {
  const clip = useClipSearch();
  if (tab === "clips") return <ClipsTab subject={{ mode: "player", player }} name={player.name} groups={playerEventGroups.slice(0, 4).concat(playerEventGroups.slice(4))} windows={[1, 3, 5]} />;
  if (tab === "match-room") return <PlayerMatchRoom player={player} />;
  if (tab === "fixture-card") return <PlayerFixtureCardTab player={player} />;
  if (tab === "video-centre") return <EventsVideoCentre entityName={player.name}><VideoCentre key={JSON.stringify(clip)} mode="player" player={player} {...clip} /></EventsVideoCentre>;
  if (tab === "video-library") return <><TabHeading title="Video Library" description={`Tagged clips featuring ${player.name}.`} />{player.clips.length ? <VideoGrid items={player.clips.map((clip, index) => ({ title: clip.title, detail: `${clip.match} · ${clip.length}`, image: index % 2 ? scrumImage : lineoutImage }))} /> : <EmptyState title="Video Library" entityName={player.name} />}</>;
  if (tab === "player-stats") return <PlayerStats player={player} />;
  if (tab === "reports") return <EntityReports name={player.name} kind="Player" />;
  return <EmptyState title={entityTabLabel("player", tab)} entityName={player.name} />;
}

function PlayerMatchRoom({ player }: { player: Player }) {
  const team = getTeam(player.teamId);
  const { season } = useEntityWorkspace();
  const rows: OverviewRow[] = player.matchLog.map((entry) => ({ key: `${entry.opponent}-${entry.date}`, tag: entry.date.replace(" 2026", ""), home: team?.name ?? player.name, away: entry.opponent, detail: entry.headline, score: `${entry.mins}'`, tone: "neutral" }));
  return <OverviewGrid
    left={<><OverviewCallout title="Player profile"><p><strong>{player.position}</strong> · {team?.name ?? "Team not supplied"}</p><p className="mt-1 text-xs text-muted-foreground">{player.apps} appearances · {player.mins} minutes this season</p></OverviewCallout><OverviewStats stats={player.stats} /></>}
    right={<><OverviewResults title="Match log" meta="Minutes played" rows={rows} empty="No appearances supplied." /><OverviewTrend title="Contribution profile" description={`${player.name} season contribution`} items={player.contribution.map((item) => ({ label: item.label, value: item.value, progress: item.value }))} /></>}
  >{season === "2025/26" ? <PlayerInsights player={player} season={season} /> : <EmptyState title="AI Player Form" entityName={player.name} detail={`No appearance records are available for ${season}.`} />}</OverviewGrid>;
}

function isForward(position: string) { return ["prop", "hooker", "lock", "flanker", "number 8", "back row"].some((item) => position.toLowerCase().includes(item)); }

function PlayerInsights({ player, season }: { player: Player; season: string }) {
  const recent = player.matchLog.slice(0, 5);
  const positionGroup = isForward(player.position) ? "forward" as const : "back" as const;
  const matches = recent.map((entry) => {
    const id = `${player.id}-${entry.opponent}-${entry.date}`;
    const match: InsightMatch = { id, title: `v ${entry.opponent}`, meta: `${entry.date} · ${entry.mins} minutes · Start status not supplied`, positionGroup, data: { minutes: entry.mins, headline: entry.headline } };
    return { match, request: insightRequest({ cacheKey: `v1:player:match:${id}`, scope: "match", matchId: id, entityId: player.id, entityName: player.name, season, perspective: "player", sentenceLimit: "2-3", data: { ...entry, position: player.position } }) };
  });
  return <AIInsightSection title="AI Player Form" perspective="player" overview={insightRequest({ cacheKey: `v1:player:form:${player.id}:${season}`, scope: "form", matchId: "last-5", entityId: player.id, entityName: player.name, season, perspective: "player", sentenceLimit: "3-4", data: { position: player.position, appearances: recent, seasonStats: player.stats } })} matches={matches} />;
}

function PlayerStats({ player }: { player: Player }) {
  return <><TabHeading title="Player Stats" description={`Season totals, spatial analysis and match-by-match output for ${player.name}.`} action={<SeasonReportButton name={player.name} kind="Player" rows={[...player.stats, ...player.contribution]} />} /><StatStrip stats={player.stats} /><PlayerSpatialAnalysis player={player} /><div className="mt-4"><MatchLog player={player} /></div></>;
}

function MatchLog({ player, className }: { player: Player; className?: string }) {
  return <Panel className={cn("overflow-hidden", className)}><div className="border-b border-border p-4"><h3 className="font-display font-semibold">Match log</h3><p className="text-[11px] text-muted-foreground">Recent appearances and headline contribution</p></div><div className="divide-y divide-border">{player.matchLog.map((entry) => <div key={`${entry.opponent}-${entry.date}`} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-xs sm:grid-cols-[1fr_100px_70px_1fr]"><span className="font-semibold">{entry.opponent}</span><span className="text-muted-foreground">{entry.date}</span><span>{entry.mins} mins</span><span className="font-semibold">{entry.headline}</span></div>)}</div></Panel>;
}

function RefereeTab({ referee, tab }: { referee: Referee; tab: string }) {
  const clip = useClipSearch();
  if (tab === "clips") return <ClipsTab subject={{ mode: "referee", referee }} name={referee.name} groups={refereeEventGroups} windows={[1, 3, 5]} />;
  if (tab === "match-room") return <RefereeMatchRoom referee={referee} />;
  if (tab === "fixture-card") return <RefereeFixtureCardTab referee={referee} />;
  if (tab === "video-centre") return <EventsVideoCentre entityName={referee.name}><VideoCentre key={JSON.stringify(clip)} mode="referee" referee={referee} {...clip} /></EventsVideoCentre>;
  if (tab === "video-library") return <><TabHeading title="Video Library" description={`Match footage involving ${referee.name}.`} /><EmptyState title="Video Library" entityName={referee.name} detail="No referee-indexed video is connected yet. Match appointments remain available in Match Room." /></>;
  if (tab === "referee-stats") return <RefereeStats referee={referee} />;
  if (tab === "reports") return <EntityReports name={referee.name} kind="Referee" />;
  return <EmptyState title={entityTabLabel("referee", tab)} entityName={referee.name} />;
}

function EventsVideoCentre({ entityName, children }: { entityName: string; children: React.ReactNode }) {
  return <><TabHeading title="Events Video Centre" description={`Search events and review match video filtered to ${entityName}.`} />{children}</>;
}

function RefereeMatchRoom({ referee }: { referee: Referee }) {
  const { season } = useEntityWorkspace();
  const rows: OverviewRow[] = referee.appointments.map((entry) => { const { home, away } = splitFixtureName(entry.fixture); return { key: `${entry.fixture}-${entry.date}`, tag: entry.date.replace(" 2026", ""), home, away, detail: `${entry.competition} · Cards ${entry.cards}`, score: `${entry.penalties} pens`, tone: "neutral" }; });
  const maxPenalty = Math.max(1, ...referee.penaltyBreakdown.map((item) => item.value));
  return <OverviewGrid
    left={<><OverviewCallout title="Referee profile" badge={referee.panel}><p><strong>{referee.union}</strong> · {referee.matches} matches this season</p></OverviewCallout><OverviewStats stats={referee.stats} /></>}
    right={<><OverviewResults title="Appointments" meta="Penalties awarded" rows={rows} empty="No appointments supplied." /><OverviewTrend title="Penalty breakdown" description="Share of penalties by offence type" items={referee.penaltyBreakdown.map((item) => ({ label: item.label, value: `${item.value}%`, progress: Math.round((item.value / maxPenalty) * 100) }))} /></>}
  >{season === "2025/26" ? <RefereeInsights referee={referee} season={season} /> : <EmptyState title="AI Officiating Summary" entityName={referee.name} detail={`No appointment records are available for ${season}.`} />}</OverviewGrid>;
}

function TeamFixtureCardTab({ team }: { team: Team }) {
  const { season } = useEntityWorkspace();
  return <><TabHeading title="Fixture Card" description={`Match assets filtered to ${team.name}.`} /><MatchRoomFixtureCard title={`${team.name} Fixture Card`} description="Fixtures, videos, reports and files connected to this team." rows={teamFixtureRows(team, competitions, season)} /></>;
}

function PlayerFixtureCardTab({ player }: { player: Player }) {
  const { season } = useEntityWorkspace();
  const team = getTeam(player.teamId);
  return <><TabHeading title="Fixture Card" description={`Match assets filtered to ${player.name}'s appearances.`} /><MatchRoomFixtureCard title={`${player.name} Fixture Card`} description="Fixtures, videos, reports and files connected to this player." rows={playerFixtureRows(player, team, competitions, season)} /></>;
}

function RefereeFixtureCardTab({ referee }: { referee: Referee }) {
  const { season } = useEntityWorkspace();
  return <><TabHeading title="Fixture Card" description={`Match assets filtered to ${referee.name}'s appointments.`} /><MatchRoomFixtureCard title={`${referee.name} Fixture Card`} description="Fixtures, videos, reports and files connected to this referee." rows={refereeFixtureRows(referee, competitions, season)} /></>;
}

function MatchRoomFixtureCard({ title, description, rows }: { title: string; description: string; rows: ReturnType<typeof teamFixtureRows> }) {
  return <section className="mt-5" aria-label={title}><div className="mb-3"><h3 className="font-display text-lg font-bold">{title}</h3><p className="mt-1 text-[11px] text-muted-foreground">{description}</p></div>{rows.length ? <FixtureCard rows={rows} /> : <EmptyState title="Fixture Card" entityName={title.replace(" Fixture Card", "")} detail="No connected fixtures or assets are available for the selected season." />}</section>;
}

function RefereeInsights({ referee, season }: { referee: Referee; season: string }) {
  const recent = referee.appointments.slice(0, 5);
  const matches = recent.map((entry) => {
    const id = `${referee.id}-${entry.fixture}-${entry.date}`;
    const match: InsightMatch = { id, title: entry.fixture, meta: `${entry.date} · ${entry.competition} · Score not supplied`, data: { totalPenalties: entry.penalties, cards: entry.cards } };
    return { match, request: insightRequest({ cacheKey: `v1:referee:match:${id}`, scope: "match", matchId: id, entityId: referee.id, entityName: referee.name, season, perspective: "referee", sentenceLimit: "2-3", data: entry }) };
  });
  return <AIInsightSection title="AI Officiating Summary" perspective="referee" overview={insightRequest({ cacheKey: `v1:referee:form:${referee.id}:${season}`, scope: "form", matchId: "last-5", entityId: referee.id, entityName: referee.name, season, perspective: "referee", sentenceLimit: "3-4", data: { appointments: recent, seasonStats: referee.stats, penaltyBreakdown: referee.penaltyBreakdown, setPiece: referee.setPiece } })} matches={matches} />;
}

function RefereeStats({ referee }: { referee: Referee }) {
  const maxPenalty = Math.max(...referee.penaltyBreakdown.map((item) => item.value));
  return <><TabHeading title="Referee Stats" description={`Penalty, card, set-piece and advantage tendencies for ${referee.name}.`} action={<SeasonReportButton name={referee.name} kind="Referee" rows={[...referee.stats, ...referee.penaltyBreakdown, ...referee.setPiece]} />} /><StatStrip stats={referee.stats} /><div className="grid gap-4 xl:grid-cols-12"><Panel className="p-4 xl:col-span-5"><h3 className="font-display font-semibold">Penalty breakdown</h3><div className="mt-5 space-y-4">{referee.penaltyBreakdown.map((item) => <Meter key={item.label} label={item.label} value={`${item.value}%`} progress={Math.round((item.value / maxPenalty) * 100)} />)}</div></Panel><Panel className="p-4 xl:col-span-7"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /><h3 className="font-display font-semibold">Set-piece and advantage profile</h3></div><div className="mt-5 space-y-5">{referee.setPiece.map((item) => <Meter key={item.label} {...item} />)}</div></Panel></div></>;
}

function SeasonReportButton({ name, kind, rows }: { name: string; kind: "Team" | "Player" | "Referee"; rows: Array<{ label: string; value: string | number; detail?: string }> }) {
  const download = () => {
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [["Entity type", kind], ["Entity", name], ["Season", "2025/26"], [], ["Measure", "Value", "Context"], ...rows.map((row) => [row.label, row.value, row.detail ?? "Not supplied"])].map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-2025-26-season-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return <Button variant="dark" onClick={download}><Download className="size-3.5" />Download season report</Button>;
}

function Appointments({ referee }: { referee: Referee }) {
  return <Panel className="overflow-hidden"><div className="border-b border-border p-4"><h3 className="font-display font-semibold">Appointments</h3><p className="text-[11px] text-muted-foreground">Matches officiated this season</p></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="bg-muted/70 text-[10px] uppercase text-muted-foreground"><tr><th className="px-4 py-2.5">Fixture</th><th>Date</th><th>Competition</th><th>Penalties</th><th>Cards</th></tr></thead><tbody className="divide-y divide-border">{referee.appointments.map((appointment) => <tr key={`${appointment.fixture}-${appointment.date}`}><td className="px-4 py-3 font-semibold">{appointment.fixture}</td><td className="text-muted-foreground">{appointment.date}</td><td className="text-muted-foreground">{appointment.competition}</td><td className="font-display font-bold">{appointment.penalties}</td><td>{appointment.cards}</td></tr>)}</tbody></table></div></Panel>;
}

function VideoGrid({ items }: { items: Array<{ title: string; detail: string; image: string }> }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Panel key={`${item.title}-${item.detail}`} className="overflow-hidden"><div className="group relative aspect-video overflow-hidden bg-muted"><img src={item.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" /><span className="absolute inset-0 grid place-items-center"><span className="grid size-10 place-items-center rounded-full bg-background/90 shadow"><Play className="ml-0.5 size-4 fill-current" /></span></span></div><div className="p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="text-[13px] font-semibold">{item.title}</h3><p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p></div><Film className="size-4 shrink-0 text-primary" /></div><Button variant="outline" size="sm" className="mt-3 w-full"><Download className="size-3.5" /> Download</Button></div></Panel>)}</div>;
}

function EntityReports({ name, kind }: { name: string; kind: string }) {
  return <><TabHeading title="Reports" description={`Reports filtered to ${name}.`} /><EmptyState title="Reports" entityName={name} detail={`No reports have been generated for this ${kind.toLowerCase()} yet.`} /></>;
}
function ClipsTab({ subject, name, groups, windows }: { subject: VideoCentreSubject; name: string; groups: string[]; windows: number[] }) {
  const [active, setActive] = useState(windows[windows.length - 1] ?? 5);
  const link = (group: string, last: number, children: React.ReactNode, className: string, key?: string) => {
    const search = { group, last };
    if (subject.mode === "team") return <Link key={key} to="/teams/$teamId/$tab" params={{ teamId: subject.team.id, tab: "video-centre" }} search={search} className={className}>{children}</Link>;
    if (subject.mode === "player") return <Link key={key} to="/players/$playerId/$tab" params={{ playerId: subject.player.id, tab: "video-centre" }} search={search} className={className}>{children}</Link>;
    if (subject.mode === "referee") return <Link key={key} to="/referees/$refereeId/$tab" params={{ refereeId: subject.referee.id, tab: "video-centre" }} search={search} className={className}>{children}</Link>;
    return null;
  };
  const counts = groups.map((group) => ({ group, count: countEvents(subject, group, active), byWindow: windows.map((n) => ({ n, count: countEvents(subject, group, n) })) }));
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(1, ...counts.map((item) => item.count));
  const matchWord = (n: number) => `${n} ${n === 1 ? "match" : "matches"}`;
  return <>
    <TabHeading title="Clips" description={`Ready-made event playlists for ${name}. Each opens the Events Video Centre with the video preloaded.`} action={<div className="flex rounded border border-border bg-card p-0.5" role="group" aria-label="Match window">{windows.map((n) => <Button key={n} size="sm" variant={active === n ? "secondary" : "ghost"} aria-pressed={active === n} onClick={() => setActive(n)} className="h-7 px-3 text-xs">Last {n}</Button>)}</div>} />
    <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded border border-border bg-card px-4 py-3"><strong className="text-2xl tabular-nums">{total}</strong><span className="text-xs text-muted-foreground">clips viewable across the last {matchWord(active)} · {groups.length} playlists</span></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{counts.map(({ group, count, byWindow }, index) => link(group, active, <>
      <span className="relative block h-36 overflow-hidden bg-foreground">
        <img src={index % 2 ? scrumImage : lineoutImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity group-hover:opacity-70" />
        <span className="absolute left-3 top-3 rounded-[3px] bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground">Last {matchWord(active)}</span>
        <span className="absolute inset-x-3 bottom-3 flex items-end justify-between text-background"><span><span className="block font-mono text-3xl font-semibold leading-none tabular-nums">{count}</span><span className="mt-1 block text-sm font-semibold">{group.toLowerCase()}</span></span><span className="grid size-9 place-items-center rounded-full bg-background text-foreground"><Play className="ml-0.5 size-4 fill-current" /></span></span>
      </span>
      <span className="block p-3"><span className="block text-xs font-medium">Last {matchWord(active)}, {count} {group.toLowerCase()}</span><span className="mt-2 block h-1 bg-muted"><span className="block h-full bg-primary" style={{ width: `${Math.round((count / max) * 100)}%` }} /></span><span className="mt-2 flex gap-3 text-[11px] text-muted-foreground">{byWindow.map(({ n, count: c }) => <span key={n} className={cn(n === active && "font-medium text-foreground")}>L{n} · {c}</span>)}</span></span>
    </>, "group block overflow-hidden rounded border border-border bg-card hover:border-primary", group))}</div>
  </>;
}

function SeasonDataByCompetition({ team }: { team: Team }) {
  const entered = competitions.filter((competition) => competition.id === team.competitionId || competition.standings.some((row) => row.teamId === team.id));
  const download = (competition: Competition) => {
    const row = competition.standings.find((item) => item.teamId === team.id);
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows: Array<Array<string | number>> = [["Team", team.name], ["Competition", competition.name], ["Season", "2025/26"], [], ["Measure", "Value", "Context"],
      ...(row ? [["Played", row.p, "Table"], ["Won", row.w, "Table"], ["Drawn", row.d, "Table"], ["Lost", row.l, "Table"], ["Points", row.pts, "Table"]] : [["Table", "Not supplied", ""]]),
      ...team.stats.map((stat) => [stat.label, stat.value, stat.detail ?? "Not supplied"]),
      ...team.performance.map((item) => [item.label, item.value, "Performance profile"])];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${team.id}-${competition.id}-2025-26-season-data.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return <Panel className="overflow-hidden xl:col-span-7"><div className="flex h-10 items-center justify-between border-b border-border px-4"><h2 className="text-[13px] font-semibold">Season data by competition</h2><span className="text-xs text-muted-foreground">{team.name} · 2025/26 · CSV</span></div>
    {entered.length ? entered.map((competition) => { const row = competition.standings.find((item) => item.teamId === team.id); return <div key={competition.id} className="flex min-h-12 items-center gap-3 border-t border-border px-4 first:border-t-0"><span className="min-w-0 flex-1"><span className="block text-xs font-medium">{competition.name}</span><span className="block text-[11px] text-muted-foreground">{row ? `P${row.p} · W${row.w} D${row.d} L${row.l} · ${row.pts} pts` : "Table position not supplied"}</span></span><Button size="sm" variant="outline" onClick={() => download(competition)}><Download className="size-3" />Download data</Button></div>; }) : <p className="p-4 text-xs text-muted-foreground">No competition records are supplied for {team.name}.</p>}
  </Panel>;
}
