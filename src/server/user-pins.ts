// User Pinned store (docs/openapi.yaml "User Pinned": GET/POST /api/v1/user/pins,
// DELETE /api/v1/user/pins/{pinId}). Pins are sidebar shortcuts only; Home is always the
// matchday page.
//
// TEMPORARY HOLD: there is no sign-in or database yet, so a user's pins and home page are kept in
// a signed, httpOnly cookie. The endpoints already follow the contract; when Cognito and storage
// arrive only this module changes. Pins don't follow the user across browsers until then.
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { components } from "@/api/openapi";
import { defaultPinEntries } from "@/server/shell";

export type Pin = components["schemas"]["Pin"];
export type PinState = { pins: Pin[] };

export const PIN_COOKIE = "oval-hub-pins";
export const MAX_PINS = 20;
const ONE_YEAR = 60 * 60 * 24 * 365;

function secret(): string {
  const value = process.env["HUB_COOKIE_SECRET"];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    console.warn("HUB_COOKIE_SECRET is not set; pins cookie uses the development key.");
  }
  return "oval-hub-development-key";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function pinId(path: string): string {
  return createHash("sha256").update(path).digest("base64url").slice(0, 12);
}

/** The handoff's default pins, as {path, label}. */
export function makePins(entries: Array<{ path: string; label: string }>): Pin[] {
  return entries.map((entry, order) => ({
    id: pinId(entry.path),
    path: entry.path,
    label: entry.label,
    order,
  }));
}

/** Reads the cookie value; null when missing, tampered with or malformed. */
export function decodePins(raw: string | undefined): PinState | null {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PinState;
    if (!Array.isArray(parsed.pins)) return null;
    // Cookies written before the home option was removed may still carry homePath; it's ignored.
    return { pins: parsed.pins.slice(0, MAX_PINS) };
  } catch {
    return null;
  }
}

export function encodePins(state: PinState): string {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export const pinCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: ONE_YEAR,
  secure: process.env.NODE_ENV === "production",
};

/** A pin path must be a Hub page: starts with one "/", no scheme, no protocol-relative "//". */
export function isHubPath(path: string): boolean {
  return (
    /^\/(?!\/)[A-Za-z0-9\-._~/%?=&]*$/.test(path) && path.length <= 300 && !path.startsWith("/api/")
  );
}

// ---- Route handler helpers -------------------------------------------------------------------

/** The current user's pins; the handoff's defaults until they change anything. */
export async function readPins(): Promise<PinState> {
  const store = await cookies();
  return (
    decodePins(store.get(PIN_COOKIE)?.value) ?? {
      pins: makePins(defaultPinEntries()),
    }
  );
}

export async function writePins(state: PinState): Promise<void> {
  const store = await cookies();
  store.set(
    PIN_COOKIE,
    encodePins({ pins: state.pins.map((pin, order) => ({ ...pin, order })) }),
    pinCookieOptions,
  );
}

type ErrorCode = "not_found" | "validation_failed" | "conflict";

export function pinError(status: number, code: ErrorCode, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export function pinJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
