"use client";

import { Activity, Flame, Map, MoveRight, PanelTop, Route } from "lucide-react";
import { useMemo, useState } from "react";

import { Panel } from "@/components/oval/app-shell";
import { Meter } from "@/components/oval/detail";
import { Button } from "@/components/ui/button";
import type { Player, Team } from "@/data/hub";
import { cn } from "@/lib/utils";

type SpatialMode = "events" | "heatmap" | "territory" | "width" | "movement";

const modes: Array<{ id: SpatialMode; label: string; icon: typeof Map }> = [
  { id: "events", label: "Event Map", icon: Map },
  { id: "heatmap", label: "Heatmap", icon: Flame },
  { id: "territory", label: "Territory", icon: PanelTop },
  { id: "width", label: "Width", icon: Activity },
  { id: "movement", label: "Movement", icon: Route },
];

const modeCopy: Record<SpatialMode, { title: string; detail: string }> = {
  events: { title: "Event locations unavailable", detail: "Event coordinates have not been supplied for this appearance." },
  heatmap: { title: "Heat layer unavailable", detail: "Location density will appear when tracking coordinates are connected." },
  territory: { title: "Territory split unavailable", detail: "Five-zone percentages require location-tagged player events." },
  width: { title: "Width profile unavailable", detail: "Channel involvement requires lateral pitch coordinates." },
  movement: { title: "Movement paths unavailable", detail: "Sequential coordinates are needed to draw player movement." },
};

export type SpatialSubject = Pick<Player, "matchLog" | "apps" | "mins" | "contribution">;

export function PlayerSpatialAnalysis({ player, contributionTitle = "Contribution profile", scopeNoun = "appearances" }: { player: SpatialSubject; contributionTitle?: string; scopeNoun?: string }) {
  const [mode, setMode] = useState<SpatialMode>("events");
  const [matchKey, setMatchKey] = useState("all");
  const selectedMatch = useMemo(
    () => player.matchLog.find((match) => `${match.opponent}-${match.date}` === matchKey),
    [matchKey, player.matchLog],
  );
  const activeMode = modeCopy[mode];

  return (
    <section aria-labelledby="spatial-analysis-title">
      <Panel className="overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Map className="size-4 text-primary" />
                <h3 id="spatial-analysis-title" className="font-display font-semibold">Pitch analysis</h3>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Spatial event views from connected match data.</p>
            </div>
            <label className="space-y-1 xl:w-[310px]">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Appearance</span>
              <select
                aria-label="Select appearance for pitch analysis"
                value={matchKey}
                onChange={(event) => setMatchKey(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All connected appearances</option>
                {player.matchLog.map((match) => {
                  const value = `${match.opponent}-${match.date}`;
                  return <option key={value} value={value}>v {match.opponent} · {match.date}</option>;
                })}
              </select>
            </label>
          </div>
          <div className="mt-4 flex gap-1 overflow-x-auto" role="tablist" aria-label="Pitch analysis view">
            {modes.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                type="button"
                variant={mode === id ? "default" : "ghost"}
                size="sm"
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className="shrink-0"
              >
                <Icon className="size-3.5" />{label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid min-h-[640px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative grid min-h-[640px] place-items-center overflow-hidden bg-pitch-frame p-4 sm:p-7">
            <RugbyPitch mode={mode} />
            <div className="absolute inset-x-8 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-md border border-pitch-line/35 bg-pitch-overlay/95 px-5 py-4 text-center shadow-lg">
              <div className="mx-auto grid size-8 place-items-center rounded-full bg-pitch-line/10 text-pitch-line"><MoveRight className="size-4" /></div>
              <p className="mt-2 font-display text-sm font-bold text-pitch-line">{activeMode.title}</p>
              <p className="mt-1 text-[11px] leading-5 text-pitch-line/75">{activeMode.detail}</p>
            </div>
            <div className="absolute bottom-7 left-7 rounded-md border border-pitch-line/25 bg-pitch-overlay/90 px-3 py-2 text-[10px] text-pitch-line/75">
              {selectedMatch ? `v ${selectedMatch.opponent} · ${selectedMatch.mins} mins` : `${player.matchLog.length} connected appearances`}
            </div>
          </div>

          <aside className="border-t border-border bg-card p-4 xl:border-l xl:border-t-0">
            <div className="border-b border-border pb-4">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Selected scope</div>
              <div className="mt-1 font-display text-lg font-bold">{selectedMatch ? `v ${selectedMatch.opponent}` : "Season overview"}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {selectedMatch ? `${selectedMatch.date} · ${selectedMatch.mins} minutes` : `${player.apps} ${scopeNoun} · ${player.mins} minutes`}
              </div>
              {selectedMatch && <div className="mt-3 rounded-md bg-muted px-3 py-2 text-xs font-semibold">{selectedMatch.headline}</div>}
            </div>

            <div className="py-4">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">{contributionTitle}</div>
              <div className="mt-4 space-y-4">
                {player.contribution.map((item) => <Meter key={item.label} label={item.label} value={String(item.value)} progress={item.value} />)}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-highlight" />
                Pitch layers will populate automatically when the Hub API supplies event coordinates.
              </div>
            </div>
          </aside>
        </div>
      </Panel>
    </section>
  );
}

function RugbyPitch({ mode }: { mode: SpatialMode }) {
  return (
    <div className="relative h-[570px] w-full max-w-[390px] overflow-hidden rounded-md border-2 border-pitch-line bg-pitch shadow-xl sm:h-[590px]">
      <svg viewBox="0 0 360 600" role="img" aria-label={`Rugby pitch ${mode} view`} className="h-full w-full">
        <rect x="18" y="18" width="324" height="564" fill="none" className="stroke-pitch-line" strokeWidth="2" />
        {[70, 170, 250, 300, 350, 430, 530].map((y) => <line key={y} x1="18" x2="342" y1={y} y2={y} className="stroke-pitch-line" strokeWidth={y === 300 ? 2 : 1.5} strokeDasharray={y === 250 || y === 350 ? "14 12" : undefined} />)}
        {[55, 105, 155, 205, 255, 305].map((x) => <g key={x} className="stroke-pitch-line" strokeWidth="2"><line x1={x} x2={x} y1="90" y2="112" /><line x1={x} x2={x} y1="488" y2="510" /></g>)}
        {[110, 180, 250, 320, 390, 460].map((y) => <g key={y} className="stroke-pitch-line" strokeWidth="2"><line x1="42" x2="62" y1={y} y2={y} /><line x1="298" x2="318" y1={y} y2={y} /></g>)}
        {mode === "territory" && [70, 170, 300, 430, 530].map((y, index) => <rect key={y} x={index % 2 ? 48 : 70} y={y + 5} width={index % 2 ? 264 : 220} height={index === 2 ? 120 : 90} rx="4" className="fill-pitch-overlay stroke-pitch-line/25" />)}
        {mode === "width" && [26, 92, 158, 224, 290].map((x, index) => <rect key={x} x={x} y={index % 2 ? 168 : 190} width="55" height={index % 2 ? 265 : 220} rx="4" className="fill-pitch-overlay stroke-pitch-line/25" />)}
        {mode === "events" && <g className="fill-pitch-line/20">{[[86,130],[145,205],[245,380],[120,445],[280,245]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" />)}</g>}
        {mode === "movement" && <g fill="none" className="stroke-pitch-line/25" strokeWidth="3" strokeDasharray="8 7"><path d="M82 470 C126 405 118 330 180 300" /><path d="M180 300 C235 245 246 170 294 122" /></g>}
        {mode === "heatmap" && <g className="fill-pitch-heat/20">{[[92,455,45],[155,330,55],[246,235,48],[275,120,38]].map(([x,y,r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />)}</g>}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-3 text-center text-[9px] font-semibold uppercase text-pitch-line/65">Attacking end</div>
    </div>
  );
}
export function TeamPitchAnalysis({ team }: { team: Team }) {
  const subject: SpatialSubject = {
    matchLog: team.recentMatches.map((match) => ({ opponent: match.opponent, date: match.date, mins: 80, headline: `${match.result} ${match.score}` })),
    apps: team.recentMatches.length,
    mins: team.recentMatches.length * 80,
    contribution: team.performance.map((item) => ({ label: item.label, value: item.progress })),
  };
  return <PlayerSpatialAnalysis player={subject} contributionTitle="Team performance profile" scopeNoun="matches" />;
}
