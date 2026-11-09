"use client";

// Team Squad (prototype Squad): pitch-led selection of the matchday 23 for the next fixture, with a
// player panel and replacements; plus a roster list. Demo data until team sheets exist. Player
// availability (Managed / Return to play) is out of scope and not shown.
import { ArrowRight } from "lucide-react";
import NextLink from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataNote } from "@/components/oval/primitives";
import { BENCH, STARTING } from "@/lib/positions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SquadPlayer = {
  id: string;
  name: string;
  position: string;
  apps: number;
  mins: number;
  headline: { value: string; label: string } | null;
};

/** Default shirt for a demo player, from their position. */
function shirtFor(position: string): number | null {
  const match = STARTING.find((slot) => slot.label.toLowerCase() === position.toLowerCase());
  if (match) return match.number;
  if (/flanker/i.test(position)) return 7;
  if (/fullback/i.test(position)) return 15;
  return null;
}

export function TeamSquad({
  clubName,
  fixtureLabel,
  sheetDue,
  players,
}: {
  clubName: string;
  fixtureLabel: string | null;
  sheetDue: string | null;
  players: SquadPlayer[];
}) {
  const [view, setView] = useState<"selection" | "roster">("selection");
  const [sheet, setSheet] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const player of players) {
      const shirt = shirtFor(player.position);
      if (shirt && !initial[shirt]) initial[shirt] = player.id;
    }
    return initial;
  });
  const [selected, setSelected] = useState<number>(() =>
    Number(Object.keys(sheet).find((key) => sheet[Number(key)] === players[0]?.id) ?? 10),
  );
  const byId = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);
  const picked = Object.keys(sheet).length;
  const unpicked = players.filter((player) => !Object.values(sheet).includes(player.id));
  const selectedPlayer = sheet[selected] ? byId.get(sheet[selected] ?? "") : undefined;
  const slotLabel = [...STARTING, ...BENCH].find((slot) => slot.number === selected)?.label ?? "";
  const assign = (shirt: number, playerId: string) =>
    setSheet((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([, id]) => id !== playerId),
      ) as Record<number, string>;
      if (playerId) next[shirt] = playerId;
      else delete next[shirt];
      return next;
    });

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-4 md:px-6">
      <DataNote label="DEMO DATA">
        Team sheets aren&apos;t in the feeds yet. Players and picks are Hub demo data and stay in
        this browser tab.
      </DataNote>
      <div className="flex flex-wrap items-center gap-4">
        <div
          role="tablist"
          aria-label="Squad view"
          className="flex rounded-[3px] border border-line bg-panel p-1"
        >
          {(["selection", "roster"] as const).map((key) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={cn(
                "h-[30px] rounded-[3px] px-3.5 capitalize",
                view === key ? "bg-ink font-medium text-white" : "text-ink hover:bg-subtle",
              )}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold">{fixtureLabel ?? "No upcoming fixture"}</div>
          <div className="text-xs text-mute">
            {sheetDue ? `Team sheet due ${sheetDue} · ` : ""}
            <span className="text-amber">{picked} of 23 picked</span> · staff only
          </div>
        </div>
        <Button
          className="ml-auto"
          disabled={!fixtureLabel}
          onClick={() =>
            toast(`${clubName} team sheet not published: team sheets aren't connected yet.`)
          }
        >
          Publish team
        </Button>
      </div>

      {view === "selection" ? (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_384px]">
          <section className="rounded border border-line bg-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold">Starting XV</h2>
              <div className="flex gap-4 text-xs text-mute">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full border-2 border-ink" />
                  Picked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full border-2 border-dashed border-mute" />
                  To pick
                </span>
              </div>
            </div>
            <div className="relative aspect-[750/660] w-full overflow-hidden rounded-[2px] bg-pitch">
              {[10, 30, 50, 70, 90].map((band) => (
                <div
                  key={band}
                  className="absolute inset-x-0 h-[10%] bg-pitch2"
                  style={{ top: `${band}%` }}
                />
              ))}
              {[6, 26, 54, 94].map((line) => (
                <div
                  key={line}
                  className="absolute inset-x-0 h-px bg-white/30"
                  style={{ top: `${line}%` }}
                />
              ))}
              {[40, 60].map((line) => (
                <div
                  key={line}
                  className="absolute inset-x-0 border-t border-dashed border-white/40"
                  style={{ top: `${line}%` }}
                />
              ))}
              <span className="absolute left-3.5 top-2.5 text-[11px] text-white">Attacking ↑</span>
              {STARTING.map((slot) => {
                const player = sheet[slot.number] ? byId.get(sheet[slot.number] ?? "") : undefined;
                const active = selected === slot.number;
                return (
                  <button
                    key={slot.number}
                    type="button"
                    onClick={() => setSelected(slot.number)}
                    className="absolute flex min-h-0 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    aria-label={`${slot.number} ${slot.label}${player ? `: ${player.name}` : ""}`}
                  >
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-full text-[13px] font-semibold sm:size-[50px] sm:text-[15px]",
                        player
                          ? "bg-white text-club"
                          : "border-2 border-dashed border-white/70 text-white",
                        active && "outline outline-[3px] outline-offset-1 outline-club",
                      )}
                    >
                      {slot.number}
                    </span>
                    <span className="whitespace-nowrap rounded-[2px] bg-ink/85 px-2 py-0.5 text-[11px] text-white max-sm:hidden">
                      {player?.name ?? slot.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col gap-4">
            <section className="rounded border border-line bg-panel p-5">
              <div className="text-[11px] text-mute">
                {selectedPlayer ? "Selected" : "Open"} · No. {selected}
              </div>
              <div className="mt-1 text-xl font-semibold">{selectedPlayer?.name ?? slotLabel}</div>
              <div className="text-[13px] text-mute">
                {selectedPlayer?.position ?? "No player picked"}
              </div>
              {selectedPlayer ? (
                <>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      [String(selectedPlayer.apps), "Apps"],
                      [selectedPlayer.mins.toLocaleString("en-GB"), "Minutes"],
                      [selectedPlayer.headline?.value ?? "–", selectedPlayer.headline?.label ?? ""],
                    ].map(([value, label]) => (
                      <div key={label} className="bg-subtle px-2.5 py-2">
                        <div className="text-base font-semibold tabular-nums">{value}</div>
                        <div className="text-[11px] text-mute">{label}</div>
                      </div>
                    ))}
                  </div>
                  <NextLink
                    href={`/players/${selectedPlayer.id}`}
                    className="mt-4 inline-flex items-center gap-1 text-club hover:underline"
                  >
                    Open player page <ArrowRight className="size-3.5" />
                  </NextLink>
                </>
              ) : (
                <PickSelect players={unpicked} onPick={(id) => assign(selected, id)} />
              )}
            </section>

            <section className="rounded border border-line bg-panel">
              <div className="flex h-10 items-center justify-between px-4">
                <h2 className="text-[13px] font-semibold">Replacements</h2>
                <span className="text-xs text-mute">
                  {BENCH.filter((slot) => sheet[slot.number]).length} of 8
                </span>
              </div>
              {BENCH.map((slot) => {
                const player = sheet[slot.number] ? byId.get(sheet[slot.number] ?? "") : undefined;
                return (
                  <div
                    key={slot.number}
                    className="mx-4 flex h-[47px] items-center gap-4 border-t border-line2"
                  >
                    <span className="w-6 text-base font-medium text-mute tabular-nums">
                      {slot.number}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{player?.name ?? slot.label}</span>
                    {player ? (
                      <button
                        type="button"
                        onClick={() => assign(slot.number, "")}
                        className="min-h-0 text-xs text-mute hover:text-ink"
                      >
                        Remove
                      </button>
                    ) : (
                      <PickSelect
                        compact
                        players={unpicked}
                        onPick={(id) => assign(slot.number, id)}
                      />
                    )}
                  </div>
                );
              })}
            </section>
          </div>
        </div>
      ) : (
        <section className="rounded border border-line bg-panel">
          <div className="grid h-[30px] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_60px_80px_minmax(0,1fr)_60px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute">
            <span>Player</span>
            <span>Position</span>
            <span className="text-right">Apps</span>
            <span className="text-right">Minutes</span>
            <span>Headline</span>
            <span className="text-right">Shirt</span>
          </div>
          {players.map((player) => {
            const shirt = Object.entries(sheet).find(([, id]) => id === player.id)?.[0];
            return (
              <div
                key={player.id}
                className="grid h-[35px] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_60px_80px_minmax(0,1fr)_60px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0"
              >
                <NextLink href={`/players/${player.id}`} className="truncate hover:underline">
                  {player.name}
                </NextLink>
                <span className="text-mute">{player.position}</span>
                <span className="text-right tabular-nums">{player.apps}</span>
                <span className="text-right tabular-nums">
                  {player.mins.toLocaleString("en-GB")}
                </span>
                <span className="truncate">
                  {player.headline
                    ? `${player.headline.value} ${player.headline.label.toLowerCase()}`
                    : ""}
                </span>
                <span className="text-right tabular-nums">{shirt ?? "–"}</span>
              </div>
            );
          })}
          {players.length === 0 && (
            <p className="px-4 py-6 text-mute">No players with connected data for {clubName}.</p>
          )}
        </section>
      )}
    </div>
  );
}

function PickSelect({
  players,
  onPick,
  compact = false,
}: {
  players: SquadPlayer[];
  onPick: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <select
      aria-label="Pick a player"
      value=""
      disabled={players.length === 0}
      onChange={(event) => onPick(event.target.value)}
      className={cn(
        "rounded-[3px] border border-dashed border-line bg-panel text-ink",
        compact ? "h-7 min-h-0 w-[92px] px-1.5 text-xs" : "mt-4 h-[30px] w-full px-2",
      )}
    >
      <option value="">Pick</option>
      {players.map((player) => (
        <option key={player.id} value={player.id}>
          {player.name}
        </option>
      ))}
    </select>
  );
}
