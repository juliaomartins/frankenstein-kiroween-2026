/** Live input counters for the F2 input monitor. Written by Player, read by the HUD. */
export const inputStats = {
  keysHeld: new Set<string>(),
  pointerEvents: 0,
  wheelEvents: 0,
  lastPointerAt: 0,
  turnedRad: 0,
};
