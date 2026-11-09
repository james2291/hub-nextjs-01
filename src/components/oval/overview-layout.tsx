"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function OverviewGrid({ left, right, children }: { left: ReactNode; right: ReactNode; children?: ReactNode }) {
  return <div className="space-y-6">
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4">{left}</div>
      <div className="min-w-0 space-y-6 lg:col-span-8">{right}</div>
    </div>
    {children}
  </div>;
}

export function OverviewStats({ stats }: { stats: Array<{ label: string; value: string | number; detail?: string | undefined }> }) {
  return <div className="grid grid-cols-2 gap-3">
    {stats.slice(0, 4).map((stat, index, list) => <div key={stat.label} className={cn("rounded bg-card p-4 shadow-sm ring-1 ring-border", list.length % 2 === 1 && index === list.length - 1 && "col-span-2")}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</div>
      <div className={cn("mt-1 truncate font-mono text-3xl font-semibold tracking-tight tabular-nums", (index === 1 || index === 2) && "text-primary")}>{stat.value}</div>
      {stat.detail && <div className="mt-1 truncate text-[10px] font-semibold uppercase text-muted-foreground">{stat.detail}</div>}
    </div>)}
  </div>;
}

export function OverviewCallout({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return <div className="rounded border-l-4 border-primary bg-card p-5 shadow-sm ring-1 ring-border">
    <div className="mb-3 flex items-center gap-2"><span className="size-2 animate-pulse rounded-full bg-primary" /><h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>{badge && <span className="ml-auto rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">{badge}</span>}</div>
    <div className="text-sm leading-relaxed text-foreground/80">{children}</div>
  </div>;
}

export type OverviewRow = { key: string; tag: string; home: string; away?: string | undefined; detail: string; score: string; tone?: "win" | "loss" | "draw" | "upcoming" | "neutral" | undefined };

export function OverviewResults({ title, meta, actions, rows, empty = "No records supplied." }: { title: string; meta?: string; actions?: ReactNode; rows: OverviewRow[]; empty?: string }) {
  return <div className="overflow-hidden rounded bg-card shadow-sm ring-1 ring-border">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-6 py-4">
      <h2 className="flex items-center gap-2 font-bold">{title}{meta && <span className="text-[10px] font-normal uppercase tracking-widest text-muted-foreground">{meta}</span>}</h2>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead><tr className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase text-muted-foreground"><th className="px-6 py-3">Round</th><th className="px-6 py-3">Fixture</th><th className="px-6 py-3">Detail</th><th className="px-6 py-3 text-right">Result</th></tr></thead>
        <tbody className="divide-y divide-border/60">
          {rows.length ? rows.map((row) => <tr key={row.key} className="transition-colors hover:bg-primary/5">
            <td className="whitespace-nowrap px-6 py-3.5 text-xs font-semibold text-muted-foreground">{row.tag}</td>
            <td className="px-6 py-3.5"><div className="flex items-center gap-3 text-sm"><span className="font-bold">{row.home}</span>{row.away && <><span className="font-mono text-[10px] text-muted-foreground/60">VS</span><span className="font-medium text-foreground/80">{row.away}</span></>}</div></td>
            <td className="px-6 py-3.5 text-xs text-muted-foreground">{row.detail}</td>
            <td className="px-6 py-3.5 text-right"><ScoreChip score={row.score} tone={row.tone} /></td>
          </tr>) : <tr><td colSpan={4} className="px-6 py-8 text-center text-xs text-muted-foreground">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  </div>;
}

function ScoreChip({ score, tone = "neutral" }: { score: string; tone?: OverviewRow["tone"] }) {
  if (tone === "upcoming") return <span className="inline-block rounded-[2px] bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{score}</span>;
  return <span className="inline-flex items-center gap-1.5">
    {tone !== "neutral" && <span className={cn("font-mono text-[10px] font-bold", tone === "win" ? "text-success" : tone === "loss" ? "text-destructive" : "text-muted-foreground")}>{tone === "win" ? "W" : tone === "loss" ? "L" : "D"}</span>}
    <span className="inline-block rounded-[2px] bg-foreground px-2 py-1 font-mono text-xs font-bold tabular-nums text-background">{score}</span>
  </span>;
}

export function OverviewTrend({ title, description, items }: { title: string; description: string; items: Array<{ label: string; value: string | number; progress: number }> }) {
  const max = Math.max(1, ...items.map((item) => item.progress));
  return <div className="rounded bg-card p-5 shadow-sm ring-1 ring-border">
    <div className="flex items-center justify-between gap-4">
      <div><h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>
      <div className="flex h-10 items-end gap-1" aria-hidden="true">{items.map((item, index) => <span key={item.label} className={cn("w-2 rounded-t-[1px]", index % 2 === 0 ? "bg-primary" : "bg-muted-foreground/25")} style={{ height: `${Math.max(15, Math.round((item.progress / max) * 100))}%` }} />)}</div>
    </div>
    <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">{items.map((item) => <div key={item.label}><div className="flex items-baseline justify-between text-xs"><span className="text-muted-foreground">{item.label}</span><strong className="font-mono tabular-nums">{item.value}</strong></div><div className="mt-1.5 h-1 bg-muted"><span className="block h-full bg-primary" style={{ width: `${Math.min(100, item.progress)}%` }} /></div></div>)}</div>
  </div>;
}

export function ViewToggle<T extends string>({ items, value, onChange }: { items: readonly T[]; value: T; onChange: (value: T) => void }) {
  return <div className="flex rounded border border-border bg-card p-0.5" role="tablist">{items.map((item) => <button key={item} type="button" role="tab" aria-selected={value === item} onClick={() => onChange(item)} className={cn("h-7 rounded-[3px] px-3 text-[11px] font-bold", value === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}</div>;
}

export function splitFixtureName(fixture: string) {
  const [home, away] = fixture.split(" v ");
  return { home: home ?? fixture, away };
}

export function shortRound(round: string) {
  return round.replace(/^Round /, "R").replace("Semi-final", "Semi");
}
