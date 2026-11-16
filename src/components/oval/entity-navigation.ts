// Tab definitions per entity (HANDOFF.md section 3). Plain module so server pages can use it for
// metadata and redirects. The Overview tab is the entity root (slug ""), e.g. /teams/harlequins.

export type EntityKind = "competition" | "team" | "player" | "referee";

export type EntityTab = {
  label: string;
  slug: string;
  /** Small grey tag after the label, e.g. "Analyst". */ tag?: string;
};

export const entityNavigation: Record<EntityKind, EntityTab[]> = {
  competition: [
    { label: "Overview", slug: "" },
    { label: "Fixture Card", slug: "fixtures" },
    { label: "Table", slug: "table" },
    { label: "Teams & players", slug: "people" },
    { label: "Stats", slug: "stats" },
    { label: "Feeds", slug: "feeds", tag: "Analyst" },
  ],
  team: [
    { label: "Overview", slug: "" },
    { label: "Fixture Card", slug: "fixtures" },
    { label: "Squad", slug: "squad" },
    { label: "Stats", slug: "stats" },
  ],
  player: [
    { label: "Overview", slug: "" },
    { label: "Fixture Card", slug: "fixtures" },
    { label: "Stats", slug: "stats" },
  ],
  referee: [
    { label: "Overview", slug: "" },
    { label: "Fixture Card", slug: "fixtures" },
    { label: "Stats", slug: "stats" },
  ],
};

export const entityBasePath: Record<EntityKind, string> = {
  competition: "/competitions",
  team: "/teams",
  player: "/players",
  referee: "/referees",
};

export function entityHref(kind: EntityKind, id: string, tab = ""): string {
  return `${entityBasePath[kind]}/${id}${tab ? `/${tab}` : ""}`;
}

export function isEntityTab(kind: EntityKind, tab: string): boolean {
  return tab !== "" && entityNavigation[kind].some((item) => item.slug === tab);
}

export function entityTabLabel(kind: EntityKind, tab: string): string {
  return entityNavigation[kind].find((item) => item.slug === tab)?.label ?? "Overview";
}
