// ILLUSTRATIVE match figures, seeded per match and tilted toward the side that scored more, so
// the Overview and Stats tabs agree with each other and never contradict the real score. Replaced
// by GET /api/v1/matches/{matchId}/stats once the event feed is mapped.
import type { Fixture } from "@/lib/rugby";
import { seeded } from "@/lib/seeded";

export type MatchStat = {
  label: string;
  home: number;
  away: number;
  suffix?: string;
  lowerIsBetter?: boolean;
};

const MEASURES: Array<{
  label: string;
  base: number;
  spread: number;
  suffix?: string;
  lowerIsBetter?: boolean;
}> = [
  { label: "Possession", base: 50, spread: 8, suffix: "%" },
  { label: "Territory", base: 50, spread: 10, suffix: "%" },
  { label: "Carries", base: 120, spread: 25 },
  { label: "Metres made", base: 550, spread: 120 },
  { label: "Line breaks", base: 4, spread: 3 },
  { label: "Defenders beaten", base: 19, spread: 6 },
  { label: "Tackles made", base: 150, spread: 25 },
  { label: "Turnovers won", base: 6, spread: 3 },
  { label: "Penalties conceded", base: 10, spread: 3, lowerIsBetter: true },
];

/** -1..1: how far the real score leans to the home side. */
export function scoreBias(fixture: Fixture): number {
  const home = fixture.home.score ?? 0;
  const away = fixture.away.score ?? 0;
  return home + away ? (home - away) / (home + away) : 0;
}

export function illustrativeStats(fixture: Fixture): MatchStat[] {
  const random = seeded(fixture.id);
  const bias = scoreBias(fixture);
  return MEASURES.map((measure) => {
    const lean = measure.lowerIsBetter || measure.label === "Tackles made" ? -bias : bias;
    const home = Math.max(
      0,
      Math.round(measure.base + ((random() * 2 - 1) * 0.5 + lean * 0.6) * measure.spread),
    );
    const away =
      measure.suffix === "%"
        ? 100 - home
        : Math.max(0, Math.round(measure.base + (random() * 2 - 1) * measure.spread));
    return {
      label: measure.label,
      home,
      away,
      ...(measure.suffix ? { suffix: measure.suffix } : {}),
      ...(measure.lowerIsBetter ? { lowerIsBetter: true } : {}),
    };
  });
}
