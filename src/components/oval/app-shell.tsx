"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/lib/link";
import { ChevronRight, Home, Menu, Pin, PinOff, Search, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const ovalLogo = "/assets/oval-logo.png";
import { GlobalSearch } from "@/components/oval/global-search";
import { Button } from "@/components/ui/button";
import { getNextFixture } from "@/data/hub";
import { usePins } from "@/lib/pins";
import { cn } from "@/lib/utils";

export function AppShell({ children, sideNavigation }: { children: ReactNode; sideNavigation?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const breadcrumb = useMemo(() => buildBreadcrumb(pathname), [pathname]);

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

  return <div className="min-h-screen bg-background font-sans text-foreground antialiased md:flex">
    <aside className="hidden h-screen w-50 shrink-0 flex-col bg-sidebar px-2.5 py-3.5 text-sidebar-foreground md:sticky md:top-0 md:flex">
      <Link to="/" className="flex h-8 items-center gap-2 px-2.5 text-sm font-semibold text-background"><img src={ovalLogo} alt="" className="size-5 object-contain" />Oval Hub</Link>
      {sideNavigation ?? <NavLinks />}
      <div className="mt-auto border-t border-sidebar-border px-2.5 py-3 text-xs">James Molyneux<br/><span className="text-sidebar-foreground/55">Harlequins · Analysis</span></div>
    </aside>

    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu className="size-4"/></Button>
        <div className="min-w-0 truncate text-[13px]">{breadcrumb.map((part, index) => <span key={`${part}-${index}`}><span className={index === breadcrumb.length - 1 ? "font-medium" : "text-muted-foreground"}>{part}</span>{index < breadcrumb.length - 1 && <span className="mx-2 text-border">/</span>}</span>)}</div>
        <Button variant="outline" className="ml-auto hidden w-80 justify-start bg-background text-muted-foreground lg:flex" onClick={() => setSearchOpen(true)}><Search className="size-3.5"/><span className="flex-1 text-left">Search</span><kbd className="font-mono text-[11px]">⌘K</kbd></Button>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Search" onClick={() => setSearchOpen(true)}><Search className="size-4"/></Button>
        <PinButton pathname={pathname} fallback={breadcrumb[breadcrumb.length - 1] ?? "Page"} />
      </header>
      <main className="px-4 py-5 md:px-6"><div className="mx-auto max-w-[1500px]">{children}</div></main>
    </div>

    {mobileOpen && <div className="fixed inset-0 z-50 bg-foreground/35 md:hidden" onClick={() => setMobileOpen(false)}><aside className="flex h-full w-64 flex-col bg-sidebar p-3 text-sidebar-foreground" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between px-2"><span className="font-semibold text-background">Oval Hub</span><Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X className="size-4"/></Button></div><div onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMobileOpen(false); }}>{sideNavigation ?? <NavLinks />}</div></aside></div>}
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
  </div>;
}

function NavLinks() {
  const next = getNextFixture("harlequins");
  const opponent = next?.opponent;
  const { home, pins } = usePins();
  const linkClass = "flex h-7.5 items-center rounded-[3px] px-2.5 text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-background";
  const activeProps = { className: "bg-sidebar-accent text-background font-medium" };
  return <nav aria-label="Main" className="mt-1 flex flex-col gap-px">
    <p className="px-2.5 pb-1 pt-4 text-[11px] text-sidebar-foreground/50">This week</p>
    {home ? <a href={home} className={linkClass}>Home <span className="ml-auto truncate pl-2 text-xs text-sidebar-foreground/50">{pins.find((pin) => pin.path === home)?.label}</span></a> : <Link to="/" activeOptions={{ exact: true }} className={linkClass} activeProps={activeProps}>Home</Link>}
    {home && <Link to="/" activeOptions={{ exact: true }} className={linkClass} activeProps={activeProps}>Week overview</Link>}
    <Link to="/teams/$teamId/$tab" params={{ teamId: opponent?.id ?? "harlequins", tab: opponent ? "head-to-head" : "match-room" }} className={linkClass} activeProps={activeProps}>Next opponent <span className="ml-auto truncate pl-2 text-xs text-sidebar-foreground/50">{opponent?.name ?? "Not supplied"}</span></Link>
    <p className="px-2.5 pb-1 pt-4 text-[11px] text-sidebar-foreground/50">Library</p>
    <Link to="/teams/$teamId/$tab" params={{ teamId: "harlequins", tab: "fixture-card" }} className={linkClass} activeProps={activeProps}>Fixture Card</Link>
    <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-4 text-[11px] text-sidebar-foreground/50"><Pin className="size-3"/>Pinned</p>
    <PinnedLinks linkClass={linkClass} />
  </nav>;
}

function PinButton({ pathname, fallback }: { pathname: string; fallback: string }) {
  const { isPinned, togglePin } = usePins();
  const pinned = isPinned(pathname);
  return <Button variant={pinned ? "dark" : "outline"} aria-pressed={pinned} onClick={() => togglePin({ path: pathname, label: (document.title.split(" | ")[0] || fallback).trim() })}>{pinned ? <PinOff className="size-3.5"/> : <Pin className="size-3.5"/>}{pinned ? "Pinned" : "Pin"}</Button>;
}

function PinnedLinks({ linkClass }: { linkClass: string }) {
  const { pins, home, setHome } = usePins();
  if (!pins.length) return <p className="px-2.5 text-[11px] text-sidebar-foreground/50">Use Pin in the top bar to add pages.</p>;
  return <>{pins.map((pin) => <div key={pin.path} className="group flex items-center">
    <a href={pin.path} className={cn(linkClass, "min-w-0 flex-1")}><span className="truncate">{pin.label}</span></a>
    <button type="button" onClick={() => setHome(home === pin.path ? null : pin.path)} aria-label={home === pin.path ? `Remove ${pin.label} as home` : `Set ${pin.label} as home`} title={home === pin.path ? "Home page" : "Set as home"} className={cn("grid size-7 shrink-0 place-items-center rounded-[3px] hover:bg-sidebar-accent", home === pin.path ? "text-background" : "text-sidebar-foreground/40 opacity-0 group-hover:opacity-100 focus:opacity-100")}><Home className="size-3"/></button>
  </div>)}</>;
}

function buildBreadcrumb(pathname: string) {
  if (pathname === "/") return ["Harlequins", "Home"];
  const parts = pathname.split("/").filter(Boolean).map((part) => part.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "));
  return parts.length ? parts : ["Oval Hub"];
}

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) { return <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-xs text-muted-foreground">{eyebrow}</div><h1 className="mt-1 text-xl font-semibold">{title}</h1><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>; }
export function ContextSelect({ label, value }: { label: string; value: string }) { return <Button variant="outline"><span className="text-muted-foreground">{label}</span>{value}<ChevronRight className="size-3 rotate-90"/></Button>; }
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={cn("rounded bg-card shadow-sm ring-1 ring-border", className)}>{children}</section>; }
export function StatusBadge({ status }: { status: "Ready" | "Processing" | "Failed" | "Live" | "Complete" }) { return <span className={cn("text-xs", status === "Processing" ? "text-highlight" : status === "Failed" ? "text-destructive" : "text-success")}>{status}</span>; }
export function StatStrip({ stats }: { stats: Array<{ label: string; value: string; detail?: string }> }) { return <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map((stat, index) => <div key={stat.label} className="rounded bg-card p-4 shadow-sm ring-1 ring-border"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</div><div className={cn("mt-1 truncate font-mono text-[28px] font-semibold leading-tight tracking-tight tabular-nums", (index === 1 || index === 2) && "text-primary")}>{stat.value}</div>{stat.detail && <div className="mt-1 truncate text-[10px] font-semibold uppercase text-muted-foreground">{stat.detail}</div>}</div>)}</div>; }
