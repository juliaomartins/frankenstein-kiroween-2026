export const TIMELINE = {
  surgeEnd: 2.8,
  stirEnd: 4.2,
  riseEnd: 6.4,
  attackEnd: 7.4,
  goodEnd: 9.5,
  badEnd: 8.2,
};

export const awakeningClock = { start: -1 };

export function awakeningElapsed(now: number): number {
  return awakeningClock.start < 0 ? 0 : now - awakeningClock.start;
}
