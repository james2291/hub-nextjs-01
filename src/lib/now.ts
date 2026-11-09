// "Now" for Home and Next opponent. The real clock, unless HUB_NOW is set (server-side), e.g.
// HUB_NOW=2026-05-16T14:30:00+01:00 to match the design screenshots. Read on the server and pass
// the ISO string to client components so server and client agree.
export function hubNow(): Date {
  const override = process.env["HUB_NOW"];
  if (override) {
    const date = new Date(override);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}

/** A match counts as played two hours after kick-off (the feeds have no live state). */
export function isPlayed(kickOff: string, now: Date = hubNow()): boolean {
  return now.getTime() >= new Date(kickOff).getTime() + 2 * 60 * 60 * 1000;
}
