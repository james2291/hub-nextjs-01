// DELETE /api/v1/user/pins/{pinId} — unpin a page; clears the home page if it was this pin.
import { pinError, readPins, writePins } from "@/server/user-pins";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ pinId: string }> }) {
  const { pinId } = await context.params;
  const state = await readPins();
  const pin = state.pins.find((item) => item.id === pinId);
  if (!pin) return pinError(404, "not_found", "No such pin for this user.");
  await writePins({
    pins: state.pins.filter((item) => item.id !== pinId),
    homePath: state.homePath === pin.path ? null : state.homePath,
  });
  return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
}
