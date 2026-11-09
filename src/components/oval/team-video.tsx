"use client";

import { Download, Film, Layers, Play, RefreshCcw, Rocket, Shield } from "lucide-react";
import { useState } from "react";

const lineoutImage = "/assets/rugby-lineout-clip.jpg";
const matchImage = "/assets/rugby-match-main.jpg";
const scrumImage = "/assets/rugby-scrum-clip.jpg";
import { Panel } from "@/components/oval/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Team } from "@/data/hub";

const windows = [
  { label: "Last match", count: 1 },
  { label: "Last 4", count: 4 },
  { label: "Last 6", count: 6 },
  { label: "Last 10", count: 10 },
] as const;

const packages = [
  { key: "lineouts", title: "Lineouts", blurb: "Every lineout in the selected window, own throw and opposition throw.", icon: Layers, image: lineoutImage },
  { key: "mauls", title: "Mauls", blurb: "Attacking and defensive maul sequences from first drive to outcome.", icon: Shield, image: scrumImage },
  { key: "launches", title: "Lineout Launches", blurb: "First-phase strike plays launched directly from lineout ball.", icon: Rocket, image: matchImage },
  { key: "restarts", title: "Restart Receptions", blurb: "Kick-off and 22 restart receptions, including the exit that follows.", icon: RefreshCcw, image: lineoutImage },
] as const;

export function TeamVideoLibrary({ team }: { team: Team }) {
  const [windowLabel, setWindowLabel] = useState<(typeof windows)[number]["label"]>("Last 4");
  const selectedWindow = windows.find((item) => item.label === windowLabel) ?? windows[1];
  const matches = team.recentMatches.slice(0, selectedWindow.count);
  const suffix = matches.length === 1 ? "Last Match" : `Last ${matches.length} Matches`;
  const range = matches.length ? `${matches[matches.length - 1]?.date} – ${matches[0]?.date}` : "No matches available";

  return <div className="space-y-4">
    <Panel className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 className="font-display text-sm font-semibold">Pre-canned compilations</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">Choose how many recent matches each package covers · {range}</p>
      </div>
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-muted/40 p-1">
        {windows.map((item) => <Button key={item.label} size="sm" variant={item.label === windowLabel ? "default" : "ghost"} onClick={() => setWindowLabel(item.label)} className="text-xs" disabled={team.recentMatches.length === 0}>{item.label}</Button>)}
      </div>
    </Panel>

    {matches.length === 0 ? <Panel className="p-10 text-center"><Film className="mx-auto size-6 text-primary" /><p className="mt-3 text-[13px] font-semibold">No recent matches connected</p><p className="mt-1 text-[12px] text-muted-foreground">Compilations build automatically once match video is attached to {team.name}.</p></Panel> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {packages.map((pack) => <Panel key={pack.key} className="overflow-hidden">
          <div className="group relative aspect-video overflow-hidden bg-muted">
            <img src={pack.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
            <span className="absolute inset-0 grid place-items-center"><span className="grid size-10 place-items-center rounded-full bg-background/90 shadow"><Play className="ml-0.5 size-4 fill-current" /></span></span>
            <span className="absolute left-2 top-2 rounded bg-foreground/85 px-2 py-1 text-[9px] font-bold uppercase text-background">{matches.length} match{matches.length === 1 ? "" : "es"}</span>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[13px] font-semibold leading-snug">{pack.title} · {suffix}</h3>
              <pack.icon className="size-4 shrink-0 text-primary" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{pack.blurb}</p>
            <Button variant="outline" size="sm" className="mt-3 w-full"><Download className="size-3.5" /> Download</Button>
          </div>
        </Panel>)}
      </div>

      <Panel className="overflow-hidden">
        <div className="border-b border-border p-4"><h3 className="font-display text-sm font-semibold">Matches in this window</h3><p className="text-[11px] text-muted-foreground">Full match video for each fixture included in the packages above</p></div>
        <div className="divide-y divide-border">
          {matches.map((match) => <div key={`${match.opponent}-${match.date}`} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-3 text-xs">
            <div className="min-w-0"><div className="truncate font-semibold">{team.name} v {match.opponent}</div><div className="text-[11px] text-muted-foreground">{match.date} · {match.clips} clips</div></div>
            <span className="font-display font-bold tabular-nums">{match.score}</span>
            <span className={cn("rounded px-2 py-1 text-[10px] font-bold", match.result === "W" ? "bg-success/12 text-success" : match.result === "L" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>{match.result}</span>
            <Button variant="ghost" size="sm" className="text-xs"><Download className="size-3.5" /> Full match</Button>
          </div>)}
        </div>
      </Panel>
    </>}
  </div>;
}
