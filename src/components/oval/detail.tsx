"use client";

import { Link } from "@/lib/link";
import { ChevronRight, SearchX } from "lucide-react";
import type { ReactNode } from "react";

import { AppShell, Panel } from "@/components/oval/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Breadcrumb({ children }: { children: ReactNode }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      {children}
    </nav>
  );
}

export function Crumb({ children, last = false }: { children: ReactNode; last?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn(last && "text-foreground")}>{children}</span>
      {!last && <ChevronRight className="size-3" />}
    </span>
  );
}

export function NotFoundPanel({ kind, id }: { kind: string; id: string }) {
  return (
    <AppShell>
      <Panel className="mx-auto mt-10 max-w-xl p-8 text-center">
        <SearchX className="mx-auto size-8 text-primary" />
        <h1 className="mt-3 font-display text-xl font-bold">{kind} not found</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          We could not find “{id}” in the connected Oval data services. Try searching again with ⌘K, or return to the hub.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild><Link to="/">Back to Home</Link></Button>
        </div>
      </Panel>
    </AppShell>
  );
}

export function Meter({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-bold">{value}</span></div>
      <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

export function FormPills({ form }: { form: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={cn(
            "grid size-6 place-items-center rounded text-[10px] font-bold",
            result === "W" ? "bg-success/15 text-success" : result === "L" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
          )}
        >
          {result}
        </span>
      ))}
    </div>
  );
}
