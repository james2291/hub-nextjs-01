"use client";

// Match Video (prototype Match). The player, clips and key moments are ILLUSTRATIVE until the clip
// feed exists. Files link to the Hub's v2 download routes; the AI match summary is read from
// POST /api/v1/insights (labelled placeholder until the Oval Insights API is live).
import { Play } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { DataNote } from "@/components/oval/primitives";
import { Button } from "@/components/ui/button";
import type { AiInsightResult } from "@/lib/ai-insights";
import type { Fixture } from "@/lib/rugby";
import { cn } from "@/lib/utils";

const MOMENTS = [
  { minute: 12, label: "Try" },
  { minute: 43, label: "Turnover won" },
  { minute: 71, label: "Try" },
];

export function MatchVideo({ fixture, season }: { fixture: Fixture; season: string }) {
  const [current, setCurrent] = useState(1);
  const [summary, setSummary] = useState<AiInsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const moment = MOMENTS[current] ?? MOMENTS[0];

  const generate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              cacheKey: `match:${fixture.id}:neutral`,
              scope: "match",
              subject: `competition:${fixture.competition.slug}`,
              matchId: String(fixture.id),
              season,
              perspective: "neutral",
              sentenceLimit: "3-4",
            },
          ],
        }),
      });
      const body = (await response.json()) as { items?: AiInsightResult[] };
      setSummary(body.items?.[0] ?? null);
    } catch {
      toast("The AI match summary couldn't be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const files = [
    { type: "MP4", label: "Full match", href: `/matches/${fixture.id}/video` },
    { type: "XML", label: "Event feed", href: `/api/v1/matches/${fixture.id}/download/xml` },
    { type: "CSV", label: "Event data", href: `/api/v1/matches/${fixture.id}/download/csv` },
    { type: "JSON", label: "Events plus", href: `/api/v1/matches/${fixture.id}/download/events` },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-5 md:px-6">
      <DataNote label="ILLUSTRATIVE">
        Video player, clips and key moments are illustrative. Real match video needs the clip feed.
      </DataNote>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_384px]">
        <section className="rounded border border-line bg-panel p-4">
          <div className="relative grid aspect-video place-items-center rounded-[2px] bg-ink">
            <span className="absolute left-3.5 top-2.5 text-[11px] text-white/70">
              Main cam{" "}
              <span className="text-[#F28B9B]">
                {moment?.minute}:08 · {moment?.label}
              </span>
            </span>
            <button
              type="button"
              aria-label="Play"
              onClick={() => toast("Video playback needs the clip feed.")}
              className="grid size-[68px] place-items-center rounded-full bg-white"
            >
              <Play className="ml-1 size-6 fill-ink text-ink" />
            </button>
          </div>
          <div className="relative mt-6 h-1.5 rounded bg-line2">
            <span
              className="absolute inset-y-0 left-0 rounded bg-club"
              style={{ width: `${((moment?.minute ?? 0) / 80) * 100}%` }}
            />
            {MOMENTS.map((item, index) => (
              <button
                key={item.minute}
                type="button"
                onClick={() => setCurrent(index)}
                className="absolute -top-[22px] min-h-0 -translate-x-1/2 text-center"
                style={{ left: `${(item.minute / 80) * 100}%` }}
              >
                <span className="block whitespace-nowrap text-[11px] text-mute">
                  {item.minute}′ {item.label.split(" ")[0]}
                </span>
                <span
                  className={cn(
                    "mx-auto mt-1 block size-2.5 rounded-full",
                    index === current ? "bg-ink" : "bg-club",
                  )}
                />
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2">
            <span className="text-[15px] font-semibold tabular-nums">
              {moment?.minute}:08 <span className="font-normal text-faint">/ 80:00</span>
            </span>
            <Button
              variant="dark"
              className="ml-auto"
              onClick={() => toast("Clips need the clip feed.")}
            >
              Clip {moment?.minute}:08–{moment?.minute}:20
            </Button>
            <Button variant="outline" onClick={() => toast("Playlists aren't connected yet.")}>
              Add to playlist
            </Button>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded border border-line bg-panel p-4">
            <h2 className="text-[13px] font-semibold">Key moments</h2>
            {MOMENTS.map((item, index) => (
              <button
                key={item.minute}
                type="button"
                onClick={() => setCurrent(index)}
                className={cn(
                  "mt-1 flex w-full items-center gap-4 rounded-[3px] px-1 py-2.5 text-left",
                  index === current && "bg-club-tint",
                )}
              >
                <span className="w-9 font-semibold text-club tabular-nums">{item.minute}′</span>
                <span className={index === current ? "text-club" : ""}>{item.label}</span>
                <span className="ml-auto text-xs text-club">
                  {index === current ? "Playing" : ""}
                </span>
              </button>
            ))}
          </section>
          <section className="rounded border border-line bg-panel p-4">
            <div className="flex justify-between">
              <h2 className="text-[13px] font-semibold">Files & feeds</h2>
              <NextLink
                href={`/competitions/${fixture.competition.slug}/feeds`}
                className="text-xs text-mute hover:underline"
              >
                All feeds
              </NextLink>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {files.map((file) => (
                <a
                  key={file.label}
                  href={file.href}
                  className="flex h-[50px] items-center gap-2.5 rounded-[3px] border border-line px-3 hover:bg-subtle"
                >
                  <span className="font-mono text-[11px] text-mute">{file.type}</span>
                  <span className="font-medium">{file.label}</span>
                </a>
              ))}
            </div>
          </section>
          <section className="rounded border border-dashed border-faint p-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <div className="font-medium">AI match summary</div>
                <div className="text-xs text-mute">
                  {summary
                    ? summary.placeholder
                      ? "Placeholder until the Oval Insights API is live"
                      : summary.status
                    : "Not generated yet"}
                </div>
              </div>
              <Button variant="dark" className="ml-auto" disabled={loading} onClick={generate}>
                {loading ? "Loading" : summary ? "Refresh" : "Generate"}
              </Button>
            </div>
            {summary?.summary && <p className="mt-3 text-[13px] text-ink">{summary.summary}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
