// Tab definitions per entity. Plain module (no "use client") so server pages can use them for
// metadata and redirects, and client components can render the tab bars.
import {
  BarChart3,
  Activity,
  ClipboardList,
  Gauge,
  Clapperboard,
  Link2,
  ListVideo,
  Library,
  Radio,
  Table2,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

import type { EntityKind } from "@/data/hub";

export type EntityTabSlug =
  | "match-room"
  | "match-centre"
  | "table"
  | "live-xml"
  | "video-centre"
  | "video-library"
  | "fixture-card"
  | "players"
  | "competitions"
  | "reports"
  | "player-stats"
  | "referee-stats"
  | "head-to-head"
  | "clips"
  | "cohesion";

type NavItem = { label: string; slug: EntityTabSlug; icon: typeof Gauge };

export const entityNavigation: Record<EntityKind, NavItem[]> = {
  competition: [
    { label: "Overview", slug: "match-room", icon: Gauge },
    { label: "Fixture Card", slug: "fixture-card", icon: Table2 },
    { label: "Table", slug: "table", icon: Activity },
    { label: "Teams and Players", slug: "players", icon: Users },
    { label: "Stats", slug: "reports", icon: BarChart3 },
    { label: "Events Video Centre", slug: "video-centre", icon: ListVideo },
    { label: "Live XML", slug: "live-xml", icon: Radio },
    { label: "Match Centre", slug: "match-centre", icon: ClipboardList },
  ],
  team: [
    { label: "Overview", slug: "match-room", icon: Gauge },
    { label: "Fixture Card", slug: "fixture-card", icon: Table2 },
    { label: "Squad", slug: "players", icon: Users },
    { label: "Cohesion", slug: "cohesion", icon: Link2 },
    { label: "Clips", slug: "clips", icon: Clapperboard },
    { label: "Stats", slug: "reports", icon: BarChart3 },
    { label: "Events Video Centre", slug: "video-centre", icon: ListVideo },
    { label: "Head-to-head", slug: "head-to-head", icon: Activity },
  ],
  player: [
    { label: "Overview", slug: "match-room", icon: Gauge },
    { label: "Fixture Card", slug: "fixture-card", icon: Table2 },
    { label: "Clips", slug: "clips", icon: Clapperboard },
    { label: "Stats", slug: "player-stats", icon: BarChart3 },
    { label: "Events Video Centre", slug: "video-centre", icon: ListVideo },
  ],
  referee: [
    { label: "Overview", slug: "match-room", icon: Gauge },
    { label: "Fixture Card", slug: "fixture-card", icon: Table2 },
    { label: "Clips", slug: "clips", icon: Clapperboard },
    { label: "Stats", slug: "referee-stats", icon: ShieldCheck },
    { label: "Events Video Centre", slug: "video-centre", icon: ListVideo },
  ],
};

export function isEntityTab(entityType: EntityKind, tab: string): tab is EntityTabSlug {
  return entityNavigation[entityType].some((item) => item.slug === tab);
}

export function entityTabLabel(entityType: EntityKind, tab: string) {
  return entityNavigation[entityType].find((item) => item.slug === tab)?.label ?? "Overview";
}
