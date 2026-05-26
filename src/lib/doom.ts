export const DOOM_FRAME_COUNT = 81;

export const doomFramePath = (n: number) =>
  `/frames3/frame_${String(n).padStart(4, "0")}.jpg`;
