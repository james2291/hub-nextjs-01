"use client";

import { ShieldCheck, Trophy, UserRound, Users } from "lucide-react";
import { Link } from "@/lib/link";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { AppShell } from "@/components/oval/app-shell";
import type { Competition, EntityKind, Player, Referee, Team } from "@/data/hub";
import { entityNavigation } from "@/components/oval/entity-navigation";

export { entityNavigation, entityTabLabel, isEntityTab, type EntityTabSlug } from "@/components/oval/entity-navigation";
import { cn } from "@/lib/utils";

type EntityRecord = Competition | Team | Player | Referee;

type WorkspaceContextValue = {
  entityType: EntityKind;
  entity: EntityRecord;
  season: string;
  setSeason: (season: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useEntityWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useEntityWorkspace must be used inside EntityWorkspace");
  return value;
}

export function EntityWorkspace({ entityType, entity, children }: { entityType: EntityKind; entity: EntityRecord; children: ReactNode }) {
  const initialSeason = "season" in entity ? entity.season : "2025/26";
  const [season, setSeason] = useState(initialSeason);
  const context = useMemo(() => ({ entityType, entity, season, setSeason }), [entityType, entity, season]);

  return (
    <WorkspaceContext.Provider value={context}>
      <AppShell>
        <EntityHeader entityType={entityType} entity={entity} season={season} onSeasonChange={setSeason} />
        <EntityTabs entityType={entityType} entityId={entity.id} entityName={entity.name} />
        {children}
      </AppShell>
    </WorkspaceContext.Provider>
  );
}

function EntityTabs({ entityType, entityId, entityName }: { entityType: EntityKind; entityId: string; entityName: string }) {
  return <nav className="mb-5 flex gap-5 overflow-x-auto border-b border-border" aria-label={`${entityName} sections`}>
    {entityNavigation[entityType].filter((item) => entityType !== "team" || item.slug !== "head-to-head" || entityId !== "harlequins").map(({ label, slug }) => {
      const classes = "shrink-0 border-b-2 border-transparent py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground";
      const activeProps = { className: "border-primary font-bold text-primary" };
      if (entityType === "competition") return <Link key={slug} to="/competitions/$competitionId/$tab" params={{ competitionId: entityId, tab: slug }} className={classes} activeProps={activeProps} activeOptions={{ exact: true }}>{label}</Link>;
      if (entityType === "team") return <Link key={slug} to="/teams/$teamId/$tab" params={{ teamId: entityId, tab: slug }} className={classes} activeProps={activeProps} activeOptions={{ exact: true }}>{label}{slug === "head-to-head" && <span className="ml-1.5 text-[11px] text-muted-foreground">v Harlequins</span>}</Link>;
      if (entityType === "player") return <Link key={slug} to="/players/$playerId/$tab" params={{ playerId: entityId, tab: slug }} className={classes} activeProps={activeProps} activeOptions={{ exact: true }}>{label}</Link>;
      return <Link key={slug} to="/referees/$refereeId/$tab" params={{ refereeId: entityId, tab: slug }} className={classes} activeProps={activeProps} activeOptions={{ exact: true }}>{label}</Link>;
    })}
  </nav>;
}

export function EntitySideNav({ entityType, entityId, entityName }: { entityType: EntityKind; entityId: string; entityName: string }) {
  const items = entityNavigation[entityType].filter((item) => entityType !== "team" || item.slug !== "head-to-head" || entityId !== "harlequins");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 px-2">
        <div className="text-[10px] font-semibold uppercase text-muted-foreground">{entityType} workspace</div>
        <div className="mt-1 truncate font-display text-sm font-bold">{entityName}</div>
      </div>
      <nav className="space-y-1" aria-label={`${entityName} navigation`}>
        {items.map(({ label, slug, icon: Icon }) => {
          const className = "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
          const activeProps = { className: "bg-primary/10 text-primary" };
          if (entityType === "competition") return <Link key={slug} to="/competitions/$competitionId/$tab" params={{ competitionId: entityId, tab: slug }} className={className} activeProps={activeProps} activeOptions={{ exact: true }}><Icon className="size-4" /><span>{label}</span><span className="ml-auto hidden size-1.5 rounded-full bg-highlight [[data-status=active]_&]:block" /></Link>;
          if (entityType === "team") return <Link key={slug} to="/teams/$teamId/$tab" params={{ teamId: entityId, tab: slug }} className={className} activeProps={activeProps} activeOptions={{ exact: true }}><Icon className="size-4" /><span>{label}</span><span className="ml-auto hidden size-1.5 rounded-full bg-highlight [[data-status=active]_&]:block" /></Link>;
          if (entityType === "player") return <Link key={slug} to="/players/$playerId/$tab" params={{ playerId: entityId, tab: slug }} className={className} activeProps={activeProps} activeOptions={{ exact: true }}><Icon className="size-4" /><span>{label}</span><span className="ml-auto hidden size-1.5 rounded-full bg-highlight [[data-status=active]_&]:block" /></Link>;
          return <Link key={slug} to="/referees/$refereeId/$tab" params={{ refereeId: entityId, tab: slug }} className={className} activeProps={activeProps} activeOptions={{ exact: true }}><Icon className="size-4" /><span>{label}</span><span className="ml-auto hidden size-1.5 rounded-full bg-highlight [[data-status=active]_&]:block" /></Link>;
        })}
      </nav>
      <Link to="/" className="mt-auto flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-primary hover:underline">Back to Oval Hub</Link>
    </div>
  );
}

function EntityHeader({ entityType, entity, season, onSeasonChange }: { entityType: EntityKind; entity: EntityRecord; season: string; onSeasonChange: (value: string) => void }) {
  const initials = entity.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  const Icon = entityType === "competition" ? Trophy : entityType === "team" ? Users : entityType === "player" ? UserRound : ShieldCheck;
  const details = getEntityDetails(entityType, entity);

  return (
    <header className="mb-1 pb-3">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className={cn("grid size-14 shrink-0 place-items-center rounded bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20", (entityType === "player" || entityType === "referee") && "rounded-full")}>
            <Icon className="absolute size-5 opacity-0" aria-hidden="true" />{initials}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{entityType}</div>
            <h1 className="truncate text-3xl font-bold tracking-tight">{entity.name}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{details}</p>
          </div>
        </div>
        <label className="flex h-9 w-fit items-center gap-2 rounded-md border border-border bg-card px-3 text-xs">
          <span className="text-muted-foreground">Season</span>
          <select value={season} onChange={(event) => onSeasonChange(event.target.value)} className="bg-transparent font-semibold outline-none" aria-label="Season">
            <option>2025/26</option>
            <option>2024/25</option>
          </select>
        </label>
      </div>
    </header>
  );
}

function getEntityDetails(entityType: EntityKind, entity: EntityRecord) {
  if (entityType === "competition") {
    const competition = entity as Competition;
    return `${competition.status} · ${competition.stage} · ${competition.matches} matches`;
  }
  if (entityType === "team") {
    const team = entity as Team;
    return `${team.position} · ${team.record} · Head coach ${team.coach}`;
  }
  if (entityType === "player") {
    const player = entity as Player;
    return `${player.position} · ${player.apps} appearances · ${player.mins} minutes`;
  }
  const referee = entity as Referee;
  return `${referee.union} · ${referee.panel} · ${referee.matches} matches this season`;
}