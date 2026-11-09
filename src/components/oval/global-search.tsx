"use client";

import { useNavigate } from "@/lib/link";
import { Clock, CornerDownLeft, Search, ShieldCheck, Trophy, User, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { searchEntities, type EntityKind, type SearchEntity } from "@/data/hub";
import { cn } from "@/lib/utils";

export type SearchKind = EntityKind;

type Entity = SearchEntity;

const kindLabel: Record<SearchKind, string> = {
  competition: "Competitions",
  team: "Teams",
  player: "Players",
  referee: "Referees",
};

const kindIcon: Record<SearchKind, typeof Users> = {
  competition: Trophy,
  team: Users,
  player: User,
  referee: ShieldCheck,
};

const entities: Entity[] = searchEntities;

const filters: Array<{ key: "all" | SearchKind; label: string }> = [
  { key: "all", label: "All" },
  { key: "competition", label: "Competitions" },
  { key: "team", label: "Teams" },
  { key: "player", label: "Players" },
  { key: "referee", label: "Referees" },
];


export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | SearchKind>("all");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<Entity[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entities.filter((entity) => {
      if (filter !== "all" && entity.kind !== filter) return false;
      if (!q) return true;
      return `${entity.name} ${entity.detail}`.toLowerCase().includes(q);
    });
  }, [query, filter]);
  const counts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = entities.filter((entity) => !q || `${entity.name} ${entity.detail}`.toLowerCase().includes(q));
    return Object.fromEntries(filters.map((item) => [item.key, matching.filter((entity) => item.key === "all" || entity.kind === item.key).length]));
  }, [query]);

  const shown = query.trim() === "" && filter === "all" && recent.length > 0 ? recent : results;

  useEffect(() => setActive(0), [query, filter]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setFilter("all");
    }
  }, [open]);

  if (!open) return null;

  const select = (entity: Entity) => {
    setRecent((prev) => [entity, ...prev.filter((item) => item.id !== entity.id)].slice(0, 4));
    onClose();
    if (entity.kind === "competition") void navigate({ to: "/competitions/$competitionId/$tab", params: { competitionId: entity.id, tab: "match-room" } });
    else if (entity.kind === "team") void navigate({ to: "/teams/$teamId/$tab", params: { teamId: entity.id, tab: "match-room" } });
    else if (entity.kind === "player") void navigate({ to: "/players/$playerId/$tab", params: { playerId: entity.id, tab: "match-room" } });
    else void navigate({ to: "/referees/$refereeId/$tab", params: { refereeId: entity.id, tab: "match-room" } });
  };



  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, shown.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && shown[active]) {
      event.preventDefault();
      select(shown[active]);
    } else if (event.key === "Escape") {
      onClose();
    } else if (event.key === "Tab") {
      event.preventDefault();
      const index = filters.findIndex((item) => item.key === filter);
      const next = filters[(index + (event.shiftKey ? filters.length - 1 : 1)) % filters.length];
      if (next) setFilter(next.key);
    }
  };

  let lastKind: SearchKind | null = null;

  return (
    <div className="fixed inset-0 z-[70] bg-foreground/40 px-4 pt-[8vh] backdrop-blur-sm" onClick={onClose} role="presentation">
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Search Oval Hub"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search competitions, teams, players, referees…"
            aria-label="Search query"
            className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button aria-label="Close search" onClick={onClose}><X className="size-4 text-muted-foreground" /></button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2">
          {filters.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
                filter === item.key ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {item.label} <span className="ml-1 font-mono text-[10px] opacity-65">{counts[item.key]}</span>
            </button>
          ))}
          <span className="ml-auto hidden text-[10px] font-medium uppercase text-muted-foreground sm:block">Tab to switch</span>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {query.trim() === "" && filter === "all" && recent.length > 0 && (
            <p className="flex items-center gap-1.5 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase text-muted-foreground"><Clock className="size-3" /> Recent</p>
          )}
          {shown.length === 0 && (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">No matches for “{query}”. Try a team, player, referee or competition name.</p>
          )}
          {shown.map((entity, index) => {
            const Icon = kindIcon[entity.kind];
            const showHeading = query.trim() !== "" || filter !== "all" || recent.length === 0;
            const heading = showHeading && entity.kind !== lastKind ? kindLabel[entity.kind] : null;
            lastKind = entity.kind;
            return (
              <div key={entity.id}>
                {heading && <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase text-muted-foreground">{heading}</p>}
                <button
                  onMouseEnter={() => setActive(index)}
                  onClick={() => select(entity)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
                    index === active ? "bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded bg-muted text-primary"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{entity.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{entity.detail}</span>
                  </span>
                  <span className="hidden text-[11px] text-muted-foreground sm:block">{entity.meta}</span>
                  {index === active && <CornerDownLeft className="size-3.5 text-primary" />}
                </button>
              </div>
            );
          })}
        </div>
        <footer className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-foreground"><span><kbd className="font-mono">↑ ↓</kbd> move</span><span><kbd className="font-mono">↵</kbd> open</span><span><kbd className="font-mono">Tab</kbd> type</span><span><kbd className="font-mono">Esc</kbd> close</span><span className="ml-auto">{shown.length} results</span></footer>
      </div>
    </div>
  );
}
