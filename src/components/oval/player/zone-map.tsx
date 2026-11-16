// TEMPORARY HOLD: seeded per player until the Hub API sends x/y event coordinates.
// Season heatmap as pitch zones: the field of play in ten 10 m bands from the player's own try
// line (left) to the opposition's (right). Each band is shaded by its share of the player's
// touches and carries a bar with the percentage, like the other horizontal match maps.
// ILLUSTRATIVE: the shape follows the player's position. Server component.
import { seeded } from "@/lib/seeded";

const ZONES = 10;

/** Where a position's touches peak, in metres from the own try line, and how spread they are. */
function profile(position: string): { centre: number; spread: number } {
  const p = position.toLowerCase();
  if (/full ?back/.test(p)) return { centre: 35, spread: 26 };
  if (/wing/.test(p)) return { centre: 62, spread: 24 };
  if (/fly|stand-off/.test(p)) return { centre: 48, spread: 18 };
  if (/scrum/.test(p)) return { centre: 55, spread: 18 };
  if (/centre/.test(p)) return { centre: 56, spread: 20 };
  return { centre: 58, spread: 16 }; // forwards
}

function hash(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}

/** Share of touches (%) in each 10 m band; sums to 100. */
export function zoneShares(slug: string, position: string): number[] {
  const random = seeded(hash(slug));
  const { centre, spread } = profile(position);
  const weights = Array.from({ length: ZONES }, (_, index) => {
    const mid = index * 10 + 5;
    return Math.exp(-(((mid - centre) / spread) ** 2) / 2) * (0.75 + random() * 0.5) + 0.02;
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const shares = weights.map((weight) => Math.round((weight / total) * 100));
  // Rounding drift goes to the largest band so the labels add up to 100.
  const drift = 100 - shares.reduce((sum, share) => sum + share, 0);
  const top = shares.indexOf(Math.max(...shares));
  shares[top] = (shares[top] ?? 0) + drift;
  return shares;
}

const LINES = [
  { at: 22, label: "22" },
  { at: 50, label: "Half" },
  { at: 78, label: "22" },
];

export function ZoneMap({
  slug,
  position,
  name,
}: {
  slug: string;
  position: string;
  name: string;
}) {
  const shares = zoneShares(slug, position);
  const max = Math.max(...shares, 1);
  const summary = shares
    .map((share, index) => `${index * 10}–${index * 10 + 10} m ${share}%`)
    .join(", ");

  return (
    <div>
      <div
        role="img"
        aria-label={`Share of ${name}'s touches by 10 metre zone, own try line to opposition try line: ${summary}. Illustrative.`}
        className="relative h-[210px] overflow-hidden rounded-[2px] bg-pitch"
      >
        <div aria-hidden="true" className="absolute inset-0 grid grid-cols-10">
          {shares.map((share, index) => {
            const heat = share / max;
            return (
              <div
                key={index}
                className="relative border-r border-white/15 last:border-r-0"
                style={{ background: `rgba(200, 16, 46, ${(heat * 0.55).toFixed(2)})` }}
              >
                <div className="absolute inset-x-[22%] bottom-0 flex flex-col items-center justify-end">
                  <span className="mb-1 font-mono text-[11px] font-medium text-white tabular-nums">
                    {share}%
                  </span>
                  <span
                    className="block w-full rounded-t-[2px] bg-white/85"
                    style={{ height: `${Math.max(2, heat * 130)}px` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {LINES.map((line) => (
          <div
            key={line.at}
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-white/50"
            style={{ left: `${line.at}%` }}
          />
        ))}
        <span aria-hidden="true" className="absolute left-2 top-2 text-[11px] text-white">
          Own try line
        </span>
        <span aria-hidden="true" className="absolute right-2 top-2 text-[11px] text-white">
          Attacking →
        </span>
      </div>
      <div aria-hidden="true" className="relative mt-1 h-4 font-mono text-[10px] text-faint">
        <span className="absolute left-0">0 m</span>
        {LINES.map((line) => (
          <span key={line.at} className="absolute -translate-x-1/2" style={{ left: `${line.at}%` }}>
            {line.label}
          </span>
        ))}
        <span className="absolute right-0">100 m</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3.5 bg-club/60" /> Darker zone, more touches
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-2 rounded-t-[1px] border border-line bg-white" /> Bar: share of
          touches
        </span>
      </div>
    </div>
  );
}
