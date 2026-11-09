// Shirt numbers, position names and pitch coordinates (x, y in % with attack upward) for the
// matchday 23. Shared by Squad selection and the match lineup.

export const STARTING: Array<{ number: number; label: string; x: number; y: number }> = [
  { number: 1, label: "Loosehead prop", x: 30, y: 10 },
  { number: 2, label: "Hooker", x: 50, y: 10 },
  { number: 3, label: "Tighthead prop", x: 70, y: 10 },
  { number: 4, label: "Lock", x: 40, y: 20 },
  { number: 5, label: "Lock", x: 60, y: 20 },
  { number: 6, label: "Blindside flanker", x: 22, y: 28 },
  { number: 7, label: "Openside flanker", x: 78, y: 28 },
  { number: 8, label: "Number 8", x: 50, y: 32 },
  { number: 9, label: "Scrum-half", x: 38, y: 45 },
  { number: 10, label: "Fly-half", x: 55, y: 54 },
  { number: 11, label: "Left wing", x: 10, y: 70 },
  { number: 12, label: "Inside centre", x: 68, y: 62 },
  { number: 13, label: "Outside centre", x: 80, y: 69 },
  { number: 14, label: "Right wing", x: 92, y: 77 },
  { number: 15, label: "Fullback", x: 50, y: 85 },
];

export const BENCH: Array<{ number: number; label: string }> = [
  { number: 16, label: "Hooker" },
  { number: 17, label: "Prop" },
  { number: 18, label: "Prop" },
  { number: 19, label: "Lock" },
  { number: 20, label: "Back row" },
  { number: 21, label: "Scrum-half" },
  { number: 22, label: "Back" },
  { number: 23, label: "Back" },
];
