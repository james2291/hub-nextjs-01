"use client";

// Loading skeleton and in-page error panel used by the route segments' loading.tsx / error.tsx.
// The shell and entity header stay on screen; only the page body is replaced.
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

function Bar({ className }: { className: string }) {
  return <span className={`block animate-pulse rounded-[2px] bg-subtle ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-4 px-4 pb-8 pt-5 md:px-6">
      <span className="sr-only">Loading…</span>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="bg-panel px-4 py-3">
            <Bar className="h-3 w-20" />
            <Bar className="mt-2 h-6 w-28" />
            <Bar className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-px overflow-hidden rounded border border-line bg-line">
        {[8, 4].map((span) => (
          <div
            key={span}
            className="col-span-12 bg-panel lg:[grid-column:span_var(--s)/span_var(--s)]"
            style={{ "--s": span } as React.CSSProperties}
          >
            <div className="border-b border-line2 px-4 py-3">
              <Bar className="h-3.5 w-32" />
            </div>
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="flex gap-4 border-b border-line2 px-4 py-2.5 last:border-b-0"
              >
                <Bar className="h-3.5 w-16" />
                <Bar className="h-3.5 flex-1" />
                <Bar className="h-3.5 w-12" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageError({
  error,
  retry,
  what = "this page",
}: {
  error: unknown;
  retry: () => void;
  what?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="px-4 pb-8 pt-5 md:px-6">
      <div role="alert" className="rounded border border-line bg-panel px-6 py-8 text-center">
        <h2 className="text-base font-semibold">{`Couldn't load ${what}`}</h2>
        <p className="mt-1 text-[13px] text-mute">
          Something went wrong reading the data. The rest of the Hub still works.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
