// Shared building blocks for the Oval Hub redesign (design/oval-hub-handoff/HANDOFF.md sections 1
// and 8.2): data-note strip, crests, club colour bars, KPI strips, joined panels and table rows.
// Server-safe: no hooks, so server and client components can both use them.
import NextLink from "next/link";
import type { CSSProperties, ReactNode } from "react";

import type { ClubRef, ResultLetter } from "@/lib/rugby";
import { cn } from "@/lib/utils";

/** Dashed strip for DATA / DEMO DATA / ILLUSTRATIVE notes. Keep until the real feed replaces it. */
export function DataNote({
  label = "DATA",
  children,
  className,
}: {
  label?: "DATA" | "DEMO DATA" | "ILLUSTRATIVE";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded border border-dashed border-line px-3 py-2 text-xs text-mute",
        className,
      )}
    >
      <span className="whitespace-nowrap font-mono text-[11px] font-medium text-club">{label}</span>
      <span>{children}</span>
    </div>
  );
}

/** Small inline tag, e.g. "Example data". */
export function DataTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[2px] border border-dashed border-faint px-1.5 font-mono text-[10px] leading-4 text-mute">
      {children}
    </span>
  );
}

/** Square crest with a code on the club colour. */
export function Crest({
  code,
  colour,
  onColour,
  size = 36,
  className,
}: {
  code: string;
  colour: string;
  onColour: string;
  size?: number;
  className?: string;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    background: colour,
    color: onColour,
    fontSize: size >= 30 ? 13 : 10,
  };
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-[3px] font-medium", className)}
      style={style}
    >
      {code}
    </span>
  );
}

export function ClubCrest({
  club,
  size = 36,
  className,
}: {
  club: ClubRef;
  size?: number;
  className?: string;
}) {
  return (
    <Crest
      code={club.code}
      colour={club.colour}
      onColour={club.onColour}
      size={size}
      {...(className ? { className } : {})}
    />
  );
}

/** Neutral crest for competitions and people (no club colour). */
export function PlainCrest({ code, size = 36 }: { code: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[3px] border border-line bg-subtle font-mono font-medium text-mute"
      style={{ width: size, height: size, fontSize: size >= 30 ? 12 : 9 }}
    >
      {code}
    </span>
  );
}

/** 3px vertical bar in the club colour, shown beside the club name in every list and table. */
export function ColourBar({ colour, className }: { colour: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block h-3.5 w-[3px] shrink-0", className)}
      style={{ background: colour }}
    />
  );
}

/** Club name with its colour bar, linking to the club's page. `highlight` marks the user's club. */
export function ClubLabel({
  club,
  href,
  highlight = false,
  short = false,
  align = "left",
  className,
}: {
  club: ClubRef;
  href?: string | null;
  highlight?: boolean;
  short?: boolean;
  align?: "left" | "right";
  className?: string;
}) {
  const name = short ? club.shortName : club.name;
  const content =
    align === "right" ? (
      <>
        <span className="truncate">{name}</span>
        <ColourBar colour={club.colour} />
      </>
    ) : (
      <>
        <ColourBar colour={club.colour} />
        <span className="truncate">{name}</span>
      </>
    );
  const classes = cn(
    "inline-flex min-w-0 items-center gap-2",
    align === "right" && "justify-end",
    highlight && "font-medium text-club",
    className,
  );
  const target = href === undefined ? `/teams/${club.slug}` : href;
  if (!target) return <span className={classes}>{content}</span>;
  return (
    <NextLink href={target} className={cn(classes, "hover:underline")}>
      {content}
    </NextLink>
  );
}

export function ResultMark({
  result,
  className,
}: {
  result: ResultLetter | null;
  className?: string;
}) {
  if (!result) return <span className={cn("font-mono text-faint", className)}>–</span>;
  return (
    <span
      className={cn(
        "font-mono font-medium",
        result === "W" ? "text-win" : result === "L" ? "text-loss" : "text-mute",
        className,
      )}
    >
      {result}
    </span>
  );
}

/** W/L letters in mono, newest on the right. */
export function FormLetters({ results }: { results: ResultLetter[] }) {
  return (
    <span className="inline-flex gap-[3px] font-mono text-[11px] font-medium">
      {results.map((result, index) => (
        <span
          key={index}
          className={result === "W" ? "text-win" : result === "L" ? "text-loss" : "text-mute"}
        >
          {result}
        </span>
      ))}
    </span>
  );
}

export type Kpi = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "win" | "loss" | "mute";
};

/** One bordered box split into equal cells by 1px gaps. */
export function KpiStrip({ items, className }: { items: Kpi[]; className?: string }) {
  return (
    <div
      className={cn("grid gap-px overflow-hidden rounded border border-line bg-line", className)}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 bg-panel px-4 py-3">
          <div className="text-xs text-mute">{item.label}</div>
          <div className="mt-1 truncate text-[22px] font-semibold tracking-[-0.01em] tabular-nums">
            {item.value}
          </div>
          {item.detail !== undefined && (
            <div
              className={cn(
                "mt-0.5 text-xs tabular-nums",
                item.tone === "win" ? "text-win" : item.tone === "loss" ? "text-loss" : "text-mute",
              )}
            >
              {item.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Joined panels: a 12-column grid of panels separated by 1px gaps. */
export function PanelGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-12 gap-px overflow-hidden rounded border border-line bg-line",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A panel. Inside a PanelGrid pass `span`; on its own it draws its own border. */
export function Section({
  title,
  meta,
  span,
  children,
  className,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  span?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 bg-panel",
        span === undefined && "overflow-hidden rounded border border-line",
        className,
      )}
      style={span === undefined ? undefined : { gridColumn: `span ${span} / span ${span}` }}
    >
      {title !== undefined && <PanelHeader title={title} meta={meta} />}
      {children}
    </section>
  );
}

export function PanelHeader({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
  return (
    <div className="flex h-10 items-center justify-between gap-3 border-b border-line2 px-4">
      <h2 className="truncate text-[13px] font-semibold">{title}</h2>
      {meta !== undefined && (
        <div className="flex items-center gap-2.5 text-xs text-mute">{meta}</div>
      )}
    </div>
  );
}

/** Underlined link used in panel headers ("Full table", "Fixture Card", "Stats"). */
export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <NextLink href={href} className="text-xs text-ink underline underline-offset-2 hover:text-club">
      {children}
    </NextLink>
  );
}

/** Grid-based table header row: 30px, 11px/500 mute. */
export function HeadRow({
  columns,
  children,
  className,
}: {
  columns: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="row"
      className={cn(
        "grid h-[30px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute",
        className,
      )}
      style={{ gridTemplateColumns: columns }}
    >
      {children}
    </div>
  );
}

/** Grid-based table body row: 34px, 13px. Pass `href` to make the whole row a link. */
export function BodyRow({
  columns,
  children,
  href,
  highlight = false,
  className,
}: {
  columns: string;
  children: ReactNode;
  href?: string;
  highlight?: boolean;
  className?: string;
}) {
  const classes = cn(
    "grid min-h-[34px] items-center gap-2.5 border-b border-line2 px-4 text-[13px] tabular-nums last:border-b-0",
    highlight && "bg-club-tint",
    href && "hover:bg-subtle",
    highlight && href && "hover:bg-club-tint",
    className,
  );
  const style = { gridTemplateColumns: columns };
  if (href)
    return (
      <NextLink role="row" href={href} className={classes} style={style}>
        {children}
      </NextLink>
    );
  return (
    <div role="row" className={classes} style={style}>
      {children}
    </div>
  );
}

/** Page heading used inside a tab: 18px title with a one-line description. */
export function PageTitle({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description !== undefined && <p className="mt-0.5 text-[13px] text-mute">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
