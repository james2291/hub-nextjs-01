"use client";

// User Pinned (docs/openapi.yaml "User Pinned"): pages the user pins to the sidebar, and which
// pinned page opens as home. Stored in the browser until GET/POST /api/v1/me/pins is built.
import { useSyncExternalStore } from "react";

export type PinnedPage = { path: string; label: string };
type PinState = { pins: PinnedPage[] | null; home: string | null };

// v2: tab URLs changed in the redesign, so pins saved under v1 are dropped.
const KEY = "oval-hub:pins:v2";
const empty: PinState = { pins: null, home: null };

let state: PinState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...(JSON.parse(raw) as Partial<PinState>) };
  } catch {
    /* keep defaults */
  }
}

function save(next: PinState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((listener) => listener());
}

/** `defaults` are shown until the user pins or unpins something. */
export function usePins(defaults: PinnedPage[]) {
  const snapshot = useSyncExternalStore(
    (listener) => {
      load();
      listeners.add(listener);
      listener();
      return () => listeners.delete(listener);
    },
    () => {
      load();
      return state;
    },
    () => empty,
  );
  const pins = snapshot.pins ?? defaults;
  return {
    pins,
    home: snapshot.home,
    isPinned: (path: string) => pins.some((pin) => pin.path === path),
    togglePin: (page: PinnedPage) => {
      const current = state.pins ?? defaults;
      const exists = current.some((pin) => pin.path === page.path);
      save(
        exists
          ? {
              pins: current.filter((pin) => pin.path !== page.path),
              home: state.home === page.path ? null : state.home,
            }
          : { pins: [...current, page], home: state.home },
      );
    },
    setHome: (path: string | null) => save({ pins: state.pins ?? defaults, home: path }),
  };
}

export function readHomePin() {
  load();
  return state.home;
}
