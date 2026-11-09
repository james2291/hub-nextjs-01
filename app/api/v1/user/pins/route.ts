// GET /api/v1/user/pins — the user's pinned pages, in sidebar order.
// POST /api/v1/user/pins — pin a page (max 20). See src/server/user-pins.ts for storage.
import { z } from "zod";

import {
  MAX_PINS,
  isHubPath,
  pinError,
  pinId,
  pinJson,
  readPins,
  writePins,
} from "@/server/user-pins";

export const dynamic = "force-dynamic";

export async function GET() {
  const { pins } = await readPins();
  return pinJson({ items: pins });
}

const Body = z.object({ path: z.string().regex(/^\//), label: z.string().min(1).max(80) }).strict();

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isHubPath(parsed.data.path)) {
    return pinError(
      422,
      "validation_failed",
      "Path must be a Hub page and the label at most 80 characters.",
    );
  }
  const state = await readPins();
  if (state.pins.some((pin) => pin.path === parsed.data.path))
    return pinError(409, "conflict", "This page is already pinned.");
  if (state.pins.length >= MAX_PINS)
    return pinError(422, "validation_failed", `You can pin up to ${MAX_PINS} pages.`);
  const pin = {
    id: pinId(parsed.data.path),
    path: parsed.data.path,
    label: parsed.data.label,
    order: state.pins.length,
  };
  await writePins({ ...state, pins: [...state.pins, pin] });
  return pinJson(pin, 201);
}
