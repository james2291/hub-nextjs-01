"use client";

// Entity header + tab row (HANDOFF.md section 2). Wraps every Competition, Team, Player and
// Referee page. Also provides the legacy prototype record to tab content not yet rebuilt on feeds.
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, type ReactNode } from "react";

import { entityHref, entityNavigation, type EntityKind } from "@/components/oval/entity-navigation";
import { ACTION_NEEDS, ComingSoonButton } from "@/components/oval/coming-soon";
import { Crest, PlainCrest } from "@/components/oval/primitives";
import type { Competition, Player, Referee, Team } from "@/data/hub";
import { cn } from "@/lib/utils";
import type { EntityHeaderData } from "@/server/entities";

export { entityTabLabel, isEntityTab } from "@/components/oval/entity-navigation";

type LegacyRecord = Competition | Team | Player | Referee;

type WorkspaceContextValue = {
  entityType: EntityKind;
  /** The prototype record (src/data/hub.ts), when one exists for this id. */
  entity: LegacyRecord | undefined;
  header: EntityHeaderData;
  season: string;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useEntityWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useEntityWorkspace must be used inside EntityWorkspace");
  return value;
}

export function EntityWorkspace({
  header,
  legacy,
  children,
}: {
  header: EntityHeaderData;
  legacy?: LegacyRecord | undefined;
  children: ReactNode;
}) {
  const context = useMemo(
    () => ({ entityType: header.kind, entity: legacy, header, season: "2025/26" }),
    [header, legacy],
  );
  return (
    <WorkspaceContext.Provider value={context}>
      <EntityHeader header={header} />
      {children}
    </WorkspaceContext.Provider>
  );
}

export function EntityHeader({ header }: { header: EntityHeaderData }) {
  const pathname = usePathname() ?? "";
  const base = entityHref(header.kind, header.id);
  return (
    <section className="border-b border-line bg-panel px-4 pt-4 md:px-6">
      <div className="flex flex-wrap items-center gap-3">
        {header.crest.colour && header.crest.onColour ? (
          <Crest
            code={header.crest.code}
            colour={header.crest.colour}
            onColour={header.crest.onColour}
            {...(header.crest.round ? { className: "rounded-full" } : {})}
          />
        ) : (
          <PlainCrest code={header.crest.code} />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold leading-[1.2]">{header.title}</h1>
          <div className="text-xs text-mute">{header.meta}</div>
        </div>
        <div className="flex gap-2">
          {header.actions.map((action) => (
            <ComingSoonButton key={action} needs={ACTION_NEEDS[action] ?? "its API"}>
              {action}
            </ComingSoonButton>
          ))}
        </div>
      </div>
      <nav
        aria-label={`${header.title} sections`}
        className="mt-3 flex gap-[22px] overflow-x-auto max-md:pr-8 max-md:[mask-image:linear-gradient(to_right,black_80%,transparent)]"
      >
        {entityNavigation[header.kind].map((tab) => {
          const href = entityHref(header.kind, header.id, tab.slug);
          const active =
            tab.slug === ""
              ? pathname === base
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <NextLink
              key={tab.slug || "overview"}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex h-[38px] shrink-0 items-center whitespace-nowrap border-b-2 px-0.5",
                active
                  ? "border-ink font-medium text-ink"
                  : "border-transparent text-mute hover:text-ink",
              )}
            >
              {tab.label}
              {tab.tag && (
                <span className="ml-1.5 text-[11px] font-normal text-faint">{tab.tag}</span>
              )}
            </NextLink>
          );
        })}
      </nav>
    </section>
  );
}
