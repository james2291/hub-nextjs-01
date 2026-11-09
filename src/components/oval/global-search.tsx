"use client";

// Search (⌘K) modal (HANDOFF.md section 4, "Search"): type tabs with counts, results grouped by
// type, keyboard: ↑↓ move, ↵ open, Tab switch type, Esc close. The first result is highlighted.
import { CornerDownLeft, Search, Trophy, UserRound, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";

import { useShell } from "@/components/oval/app-shell";
import { cn } from "@/lib/utils";
import type { SearchItem, SearchType } from "@/server/search";

const TABS: Array<{ key: SearchType | "all"; label: string; group: string }> = [
  { key: "all", label: "All", group: "" },
  { key: "competition", label: "Competitions", group: "Competitions" },
  { key: "team", label: "Teams", group: "Teams" },
  { key: "player", label: "Players", group: "Players" },
  { key: "referee", label: "Referees", group: "Referees" },
];

const ICONS: Record<SearchType, ComponentType<{ className?: string }>> = {
  competition: Trophy,
  team: Users,
  player: UserRound,
  referee: UserRound,
};

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <SearchDialog onClose={onClose} />;
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const { search: index } = useShell();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchType | "all">("all");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = q
      ? index.filter((item) => `${item.name} ${item.detail}`.toLowerCase().includes(q))
      : index.filter((item) => item.featured);
    return found.sort(
      (a, b) =>
        TABS.findIndex((t) => t.key === a.type) - TABS.findIndex((t) => t.key === b.type) ||
        a.rank - b.rank,
    );
  }, [index, query]);
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: matches.length };
    for (const item of matches) result[item.type] = (result[item.type] ?? 0) + 1;
    return result;
  }, [matches]);
  const results = tab === "all" ? matches : matches.filter((item) => item.type === tab);
  const current = Math.min(active, Math.max(0, results.length - 1));

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${current}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const open = (item: SearchItem | undefined) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(current + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      open(results[current]);
    } else if (event.key === "Tab") {
      event.preventDefault();
      const position = TABS.findIndex((t) => t.key === tab);
      const step = event.shiftKey ? -1 : 1;
      const next = TABS[(position + step + TABS.length) % TABS.length];
      if (next) setTab(next.key);
      setActive(0);
    }
  };

  let lastType: SearchType | null = null;
  return (
    <div className="fixed inset-0 z-50" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-[rgba(17,24,39,0.45)]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="absolute left-1/2 top-14 flex md:ml-[100px] max-h-[calc(100vh-80px)] w-[640px] max-w-[calc(100vw-32px)] -translate-x-1/2 flex-col overflow-hidden rounded bg-panel shadow-[0_24px_60px_rgba(17,24,39,0.35)]"
      >
        <label className="flex h-[60px] items-center gap-3 border-b border-line px-[18px]">
          <Search className="size-4 text-mute" />
          <input
            autoFocus
            type="search"
            aria-label="Search competitions, teams, players, referees"
            placeholder="Search competitions, teams, players, referees…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            className="min-h-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-[3px] text-[#55554F] hover:bg-subtle"
          >
            <X className="size-4" />
          </button>
        </label>
        <div
          role="tablist"
          aria-label="Result type"
          className="flex items-center gap-1 border-b border-line px-3.5 py-2.5"
        >
          {TABS.map((item) => {
            const selected = tab === item.key;
            return (
              <button
                key={item.key}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => {
                  setTab(item.key);
                  setActive(0);
                }}
                className={cn(
                  "flex h-[30px] items-center gap-1.5 rounded-[3px] px-2.5 text-[11px] font-medium",
                  selected ? "bg-[#FCE8EB] text-[#9E0B23]" : "text-[#55554F] hover:bg-subtle",
                )}
              >
                {item.label}
                <span className={cn("text-[10px]", selected ? "text-[#9E0B23]" : "text-faint")}>
                  {counts[item.key] ?? 0}
                </span>
              </button>
            );
          })}
          <span className="ml-auto text-[10px] font-medium text-faint">Tab to switch</span>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto px-2 pb-2.5 pt-1.5">
          {results.length === 0 && (
            <div className="px-2 py-8 text-center text-mute">No results for “{query}”.</div>
          )}
          {results.map((item, position) => {
            const heading =
              item.type !== lastType ? TABS.find((t) => t.key === item.type)?.group : null;
            lastType = item.type;
            const Icon = ICONS[item.type];
            return (
              <div key={`${item.type}-${item.id}`}>
                {heading && (
                  <div className="px-2 pb-1.5 pt-3 text-[11px] font-medium text-mute">
                    {heading}
                  </div>
                )}
                <button
                  type="button"
                  data-index={position}
                  onMouseEnter={() => setActive(position)}
                  onClick={() => open(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[3px] px-2.5 py-[9px] text-left",
                    position === current ? "bg-[#FCE8EB]" : "hover:bg-subtle",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[3px] border border-line bg-subtle text-club">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{item.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-mute">{item.detail}</span>
                  </span>
                  <span className="hidden shrink-0 text-xs text-mute sm:block">{item.meta}</span>
                  {position === current && (
                    <CornerDownLeft
                      aria-hidden="true"
                      className="ml-1 size-3.5 shrink-0 text-mute"
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[11px] text-mute">
          <Hint keys="↑ ↓" label="move" />
          <Hint keys="↵" label="open" />
          <Hint keys="Tab" label="switch type" />
          <Hint keys="Esc" label="close" />
          <span className="ml-auto">
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <kbd className="font-sans text-[11px] font-medium text-ink">{keys}</kbd>
      {label}
    </span>
  );
}
