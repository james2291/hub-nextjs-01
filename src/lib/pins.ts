"use client";

// User Pinned on the client. The root layout reads the user's pins on the server; changes go
// through the User Pinned API (POST/DELETE /api/v1/user/pins, typed via src/api/client.ts) with an optimistic update that
// rolls back if the request fails. Home is always the matchday page; pins can't replace it.
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { hubApi } from "@/api/client";

export type Pin = { id: string; path: string; label: string; order: number };
export type PinnedPage = { path: string; label: string };

type PinsValue = {
  pins: Pin[];
  isPinned: (path: string) => boolean;
  togglePin: (page: PinnedPage) => Promise<void>;
};

const PinsContext = createContext<PinsValue | null>(null);

/** The API's error message, or a generic one. */
function failure(error: unknown): Error {
  const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
  return new Error(message ?? "The change wasn't saved.");
}

export function PinsProvider({
  initialPins,
  children,
}: {
  initialPins: Pin[];
  children: ReactNode;
}) {
  const [pins, setPins] = useState(initialPins);

  const togglePin = useCallback(
    async (page: PinnedPage) => {
      const existing = pins.find((pin) => pin.path === page.path);
      const before = pins;
      try {
        if (existing) {
          setPins(pins.filter((pin) => pin.id !== existing.id));
          const { error } = await hubApi.DELETE("/api/v1/user/pins/{pinId}", {
            params: { path: { pinId: existing.id } },
          });
          if (error) throw failure(error);
        } else {
          const optimistic: Pin = {
            id: `pending-${page.path}`,
            path: page.path,
            label: page.label,
            order: pins.length,
          };
          setPins([...pins, optimistic]);
          const { data: saved, error } = await hubApi.POST("/api/v1/user/pins", { body: page });
          if (error || !saved) throw failure(error);
          setPins((current) => current.map((pin) => (pin.id === optimistic.id ? saved : pin)));
        }
      } catch (error) {
        setPins(before);
        toast(error instanceof Error ? error.message : "The change wasn't saved.");
      }
    },
    [pins],
  );

  const value = useMemo<PinsValue>(
    () => ({
      pins,
      isPinned: (path) => pins.some((pin) => pin.path === path),
      togglePin,
    }),
    [pins, togglePin],
  );
  return createElement(PinsContext.Provider, { value }, children);
}

export function usePins(): PinsValue {
  const value = useContext(PinsContext);
  if (!value) throw new Error("usePins must be used inside PinsProvider");
  return value;
}
