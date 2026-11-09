"use client";

// Actions whose API doesn't exist yet. They look unavailable, say why on hover and to screen
// readers, and do nothing when pressed, rather than looking finished and failing.
import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ComingSoonButton({
  children,
  needs,
  variant = "outline",
  className,
  size,
}: {
  children: ReactNode;
  /** What it's waiting for, e.g. "the exports API". */
  needs: string;
  variant?: ButtonProps["variant"];
  className?: string;
  size?: ButtonProps["size"];
}) {
  const reason = `Coming soon: needs ${needs}`;
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      aria-disabled="true"
      title={reason}
      onClick={(event) => event.preventDefault()}
      className={cn("cursor-not-allowed opacity-55 hover:bg-inherit", className)}
    >
      {children}
      <span className="sr-only">. {reason}.</span>
    </Button>
  );
}

/** What each entity-header action is waiting for. */
export const ACTION_NEEDS: Record<string, string> = {
  "New team report": "the reports API",
  "Competition report": "the reports API",
  "Compare referees": "the officiating feed",
  Compare: "the player stats feed",
  "Send clips to player": "the clip feed",
};
