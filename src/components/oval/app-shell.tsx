"use client";

// App shell (HANDOFF.md section 2): 200px dark sidebar, 48px top bar with breadcrumbs, search,
// Downloads and Pin. Rendered once by app/layout.tsx with data from src/server/shell.ts.
import { Menu, Pin, PinOff, Search, X } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { GlobalSearch } from "@/components/oval/global-search";
import { Button } from "@/components/ui/button";
import { PinsProvider, usePins } from "@/lib/pins";
import { cn } from "@/lib/utils";
import type { ShellData } from "@/server/shell";

const ovalLogo = "/assets/oval-logo.png";

const ShellContext = createContext<ShellData | null>(null);
const LabelContext = createContext<((segment: string, label: string) => void) | null>(null);

/** Lets a page name its own URL segment in the breadcrumb, e.g. a match id → "Bath v Sale". */
export function BreadcrumbLabel({ segment, label }: { segment: string; label: string }) {
  const register = useContext(LabelContext);
  useEffect(() => register?.(segment, label), [register, segment, label]);
  return null;
}

export function useShell(): ShellData {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside AppShell");
  return value;
}

/** Where a club name links: the team's Overview, or Next opponent for the next opponent. */
export function useClubHref(): (clubSlug: string) => string {
  const shell = useContext(ShellContext);
  return (clubSlug: string) =>
    shell?.nextOpponentSlug === clubSlug && shell.nextOpponent
      ? shell.nextOpponent.href
      : `/teams/${clubSlug}`;
}

export function AppShell({ data, children }: { data: ShellData; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const [labels, setLabels] = useState<Record<string, string>>({});
  const registerLabel = useCallback(
    (segment: string, label: string) =>
      setLabels((current) =>
        current[segment] === label ? current : { ...current, [segment]: label },
      ),
    [],
  );
  const breadcrumb = useMemo(
    () => buildBreadcrumb(pathname, { ...data, names: { ...data.names, ...labels } }),
    [pathname, data, labels],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ShellContext.Provider value={data}>
      <LabelContext.Provider value={registerLabel}>
        <PinsProvider initialPins={data.pins}>
          <div className="min-h-screen bg-page text-[13px] text-ink antialiased md:flex">
            <aside className="hidden h-screen w-[200px] shrink-0 flex-col bg-side px-2.5 py-3.5 md:sticky md:top-0 md:flex">
              <Sidebar data={data} pathname={pathname} />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-4 border-b border-line bg-panel px-4 md:px-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="size-4" />
                </Button>
                <nav
                  aria-label="Breadcrumb"
                  className="min-w-0 truncate whitespace-nowrap text-[13px]"
                >
                  {breadcrumb.map((part, index) => (
                    <span key={`${part.label}-${index}`}>
                      {index > 0 && <span className="mx-1 text-sep">/</span>}
                      {part.href && index < breadcrumb.length - 1 ? (
                        <NextLink href={part.href} className="text-mute hover:text-ink">
                          {part.label}
                        </NextLink>
                      ) : (
                        <span
                          className={
                            index === breadcrumb.length - 1 ? "font-medium text-ink" : "text-mute"
                          }
                        >
                          {part.label}
                        </span>
                      )}
                    </span>
                  ))}
                </nav>
                <button
                  type="button"
                  aria-label="Search (⌘K)"
                  onClick={() => setSearchOpen(true)}
                  className="ml-auto hidden h-[30px] w-80 items-center gap-2 rounded-[3px] border border-line bg-page px-2.5 text-faint hover:border-faint lg:flex"
                >
                  <Search className="size-3.5" />
                  <span className="flex-1 text-left">Search</span>
                  <span className="font-mono text-[11px] font-medium text-mute">⌘K</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto lg:hidden"
                  aria-label="Search"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="size-4" />
                </Button>
                <NextLink
                  href={data.downloadsHref}
                  className="flex h-[30px] items-center gap-2 rounded-[3px] border border-line bg-panel px-2.5 font-medium text-ink hover:bg-subtle"
                >
                  Downloads <span className="font-mono text-xs font-medium text-mute">3</span>
                </NextLink>
                <PinButton
                  pathname={pathname}
                  label={
                    breadcrumb.at(-2)?.label && breadcrumb.at(-1)?.label === "Overview"
                      ? (breadcrumb.at(-2)?.label ?? "Page")
                      : (breadcrumb.at(-1)?.label ?? "Page")
                  }
                />
              </header>
              <main className="flex min-w-0 flex-1 flex-col">{children}</main>
            </div>

            {mobileOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                className="fixed inset-0 z-50 bg-ink/35 md:hidden"
                onClick={() => setMobileOpen(false)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setMobileOpen(false);
                }}
              >
                <aside
                  className="flex h-full w-64 flex-col bg-side p-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Close navigation"
                      className="text-side-ink hover:bg-side-act hover:text-white"
                      onClick={() => setMobileOpen(false)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div
                    className="flex flex-1 flex-col"
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("a")) setMobileOpen(false);
                    }}
                  >
                    <Sidebar data={data} pathname={pathname} />
                  </div>
                </aside>
              </div>
            )}
            <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
          </div>
        </PinsProvider>
      </LabelContext.Provider>
    </ShellContext.Provider>
  );
}

function Sidebar({ data, pathname }: { data: ShellData; pathname: string }) {
  const { pins } = usePins();
  const item = (active: boolean) =>
    cn(
      "flex h-[30px] items-center rounded-[3px] px-2.5 text-[13px] no-underline",
      active
        ? "bg-side-act font-medium text-white"
        : "text-side-ink hover:bg-side-act/60 hover:text-white",
    );
  const label = "px-2.5 pb-1 pt-4 text-[11px] text-side-lab";
  return (
    <>
      <NextLink href="/" className="flex items-center gap-2 px-2.5 pb-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- 20px logo from public/ */}
        <img src={ovalLogo} alt="" className="size-5 object-contain object-top" />
        <span className="text-[13px] font-medium text-white">Oval Hub</span>
      </NextLink>
      <nav aria-label="Main" className="flex flex-col gap-px">
        <div className={label}>This week</div>
        <NextLink href="/" className={item(pathname === "/")}>
          Home
        </NextLink>
        <NextLink
          href={data.nextOpponent?.href ?? "/next-opponent"}
          className={item(pathname.startsWith("/opposition"))}
        >
          Next opponent
          <span className="ml-auto truncate pl-2 text-xs text-side-lab">
            {data.nextOpponent?.label ?? "Season over"}
          </span>
        </NextLink>
        <div className={label}>Library</div>
        <NextLink
          href={data.latestMatch?.href ?? data.fixtureCardHref}
          className={item(pathname.startsWith("/matches"))}
        >
          Matches
        </NextLink>
        <NextLink href={data.fixtureCardHref} className={item(pathname === data.fixtureCardHref)}>
          Fixture Card
        </NextLink>
        <div className={label}>Pinned</div>
        {pins.length === 0 && (
          <p className="px-2.5 text-[11px] text-side-lab">Use Pin in the top bar to add pages.</p>
        )}
        {pins.map((pin) => (
          <NextLink key={pin.path} href={pin.path} className={item(pathname === pin.path)}>
            <span className="truncate">{pin.label}</span>
          </NextLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-side-act p-2.5 text-xs text-side-ink">
        {data.user.name}
        <br />
        <span className="text-side-lab">
          {data.user.clubName} · {data.user.roleLabel}
        </span>
      </div>
    </>
  );
}

function PinButton({ pathname, label }: { pathname: string; label: string }) {
  const { isPinned, togglePin } = usePins();
  const pinned = isPinned(pathname);
  return (
    <Button
      variant="outline"
      aria-pressed={pinned}
      aria-label={pinned ? "Unpin this page" : "Pin this page"}
      title={pinned ? "Unpin" : "Pin to sidebar"}
      onClick={() => togglePin({ path: pathname, label })}
      className="px-2.5"
    >
      {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
      <span className="hidden xl:inline">{pinned ? "Pinned" : "Pin"}</span>
    </Button>
  );
}

type Crumb = { label: string; href?: string };

const SECTION_ROOTS: Record<string, string> = {
  teams: "/teams",
  competitions: "/competitions",
  players: "/players",
  referees: "/referees",
  matches: "/matches",
};

function buildBreadcrumb(pathname: string, data: ShellData): Crumb[] {
  if (pathname === "/") return [{ label: data.user.clubName }, { label: "Home" }];
  if (pathname.startsWith("/opposition/")) {
    const slug = pathname.split("/")[2] ?? "";
    return [{ label: "Next opponent" }, { label: data.names[slug] ?? slug }];
  }
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let href = "";
  parts.forEach((part, index) => {
    href += `/${part}`;
    const label =
      data.names[part] ??
      part
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    crumbs.push(index === 0 && SECTION_ROOTS[part] ? { label } : { label, href });
  });
  // Entity root pages are the Overview tab.
  if (parts.length === 2 && SECTION_ROOTS[parts[0] ?? ""]) crumbs.push({ label: "Overview" });
  return crumbs.length ? crumbs : [{ label: "Oval Hub" }];
}

// ---- Legacy helpers still used by pages that have not been rebuilt yet --------------------------

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded border border-line bg-panel", className)}>{children}</section>
  );
}

export function StatStrip({
  stats,
}: {
  stats: Array<{ label: string; value: string; detail?: string }>;
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0 bg-panel px-4 py-3">
          <div className="text-xs text-mute">{stat.label}</div>
          <div className="mt-1 truncate text-[22px] font-semibold tabular-nums">{stat.value}</div>
          {stat.detail && <div className="mt-0.5 truncate text-xs text-mute">{stat.detail}</div>}
        </div>
      ))}
    </div>
  );
}

/** Page body padding (20px 24px 32px, 16px gaps), as in the reference. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 px-4 pb-8 pt-5 md:px-6", className)}>{children}</div>
  );
}
