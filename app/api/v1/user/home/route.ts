// PUT /api/v1/user/home — set or clear the page opened after sign-in. It must be one of the
// user's pins.
import { z } from "zod";

import { pinError, pinJson, readPins, writePins } from "@/server/user-pins";

export const dynamic = "force-dynamic";

const Body = z.object({ path: z.string().nullable() }).strict();

export async function PUT(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return pinError(422, "validation_failed", "Send { path } as a pinned path or null.");
  const state = await readPins();
  const path = parsed.data.path;
  if (path !== null && !state.pins.some((pin) => pin.path === path)) {
    return pinError(422, "validation_failed", "The home page must be one of your pins.");
  }
  await writePins({ ...state, homePath: path });
  return pinJson({ homePath: path });
}
