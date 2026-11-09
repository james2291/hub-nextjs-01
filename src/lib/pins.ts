"use client";

import { useSyncExternalStore } from "react";

export type PinnedPage = { path: string; label: string };
type PinState = { pins: PinnedPage[]; home: string | null };

const KEY = "oval-hub:pins:v1";
const defaults: PinState = {
  pins: [
    { path: "/teams/harlequins/match-room", label: "Harlequins" },
    { path: "/teams/bath-rugby/match-room", label: "Bath Rugby" },
    { path: "/players/marcus-smith/match-room", label: "Marcus Smith" },
    { path: "/matches/gallagher-prem-0/overview", label: "R18 v Northampton" },
  ],
  home: null,
};

let state: PinState = defaults;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...defaults, ...JSON.parse(raw) };
  } catch { /* keep defaults */ }
}

function save(next: PinState) {
  state = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((listener) => listener());
}

export function usePins() {
  const snapshot = useSyncExternalStore(
    (listener) => { load(); listeners.add(listener); listener(); return () => listeners.delete(listener); },
    () => { load(); return state; },
    () => defaults,
  );
  return {
    ...snapshot,
    isPinned: (path: string) => snapshot.pins.some((pin) => pin.path === path),
    togglePin: (page: PinnedPage) => {
      const exists = state.pins.some((pin) => pin.path === page.path);
      save(exists ? { pins: state.pins.filter((pin) => pin.path !== page.path), home: state.home === page.path ? null : state.home } : { ...state, pins: [...state.pins, page] });
    },
    setHome: (path: string | null) => save({ ...state, home: path }),
  };
}

export function readHomePin() {
  load();
  return state.home;
}
