"use client";

// "Build the preview pack" checklist and button (prototype Opposition). Exports aren't connected
// yet, so building reports what was chosen.
import { useState } from "react";

import { ComingSoonButton } from "@/components/oval/coming-soon";
import { Button } from "@/components/ui/button";

export function PreviewPack({ items }: { items: Array<{ title: string; detail: string }> }) {
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const toggle = (title: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  return (
    <>
      {items.map((item) => (
        <label
          key={item.title}
          className="flex cursor-pointer items-start gap-3.5 border-b border-line2 px-4 py-2.5 hover:bg-subtle"
        >
          <input
            type="checkbox"
            checked={chosen.has(item.title)}
            onChange={() => toggle(item.title)}
            className="mt-1 size-3.5 min-h-0 accent-[var(--ink)]"
          />
          <span>
            <span className="block">{item.title}</span>
            <span className="block text-xs text-mute">{item.detail}</span>
          </span>
        </label>
      ))}
      <div className="flex justify-end px-4 py-3">
        {chosen.size === 0 ? (
          <Button variant="dark" disabled title="Choose what goes in the pack first">
            Build preview pack
          </Button>
        ) : (
          <ComingSoonButton variant="dark" needs="the exports API">
            Build preview pack ({chosen.size})
          </ComingSoonButton>
        )}
      </div>
    </>
  );
}
