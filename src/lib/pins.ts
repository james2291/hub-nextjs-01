"use client";

// User Pinned on the client. The root layout reads the user's pins on the server; changes go
// through the User Pinned API (POST/DELETE /api/v1/user/pins, PUT /api/v1/user/home) with an
// optimistic update that rolls back if the request fails.
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

export type Pin = { id: string; path: string; label: string; order: number };
export type PinnedPage = { path: string; label: string };

type PinsValue = {
  pins: Pin[];
  home: string | null;
  isPinned: (path: string) => boolean;
  togglePin: (page: PinnedPage) => Promise<void>;
  setHome: (path: string | null) => Promise<void>;
};

const PinsContext = createContext<PinsValue | null>(null);

async function request(url: string, init: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(body?.error?.message ?? "The change wasn't saved.");
  }
  return response;
}

export function PinsProvider({
  initialPins,
  initialHome,
  children,
}: {
  initialPins: Pin[];
  initialHome: string | null;
  children: ReactNode;
}) {
  const [pins, setPins] = useState(initialPins);
  const [home, setHomeState] = useState(initialHome);

  const togglePin = useCallback(
    async (page: PinnedPage) => {
      const existing = pins.find((pin) => pin.path === page.path);
      const before = { pins, home };
      try {
        if (existing) {
          setPins(pins.filter((pin) => pin.id !== existing.id));
          if (home === existing.path) setHomeState(null);
          await request(`/api/v1/user/pins/${encodeURIComponent(existing.id)}`, {
            method: "DELETE",
          });
        } else {
          const optimistic: Pin = {
            id: `pending-${page.path}`,
            path: page.path,
            label: page.label,
            order: pins.length,
          };
          setPins([...pins, optimistic]);
          const saved = (await (
            await request("/api/v1/user/pins", { method: "POST", body: JSON.stringify(page) })
          ).json()) as Pin;
          setPins((current) => current.map((pin) => (pin.id === optimistic.id ? saved : pin)));
        }
      } catch (error) {
        setPins(before.pins);
        setHomeState(before.home);
        toast(error instanceof Error ? error.message : "The change wasn't saved.");
      }
    },
    [pins, home],
  );

  const setHome = useCallback(
    async (path: string | null) => {
      const before = home;
      setHomeState(path);
      try {
        await request("/api/v1/user/home", { method: "PUT", body: JSON.stringify({ path }) });
      } catch (error) {
        setHomeState(before);
        toast(error instanceof Error ? error.message : "The change wasn't saved.");
      }
    },
    [home],
  );

  const value = useMemo<PinsValue>(
    () => ({
      pins,
      home,
      isPinned: (path) => pins.some((pin) => pin.path === path),
      togglePin,
      setHome,
    }),
    [pins, home, togglePin, setHome],
  );
  return createElement(PinsContext.Provider, { value }, children);
}

export function usePins(): PinsValue {
  const value = useContext(PinsContext);
  if (!value) throw new Error("usePins must be used inside PinsProvider");
  return value;
}
