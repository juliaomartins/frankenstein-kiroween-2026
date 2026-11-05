export const ROOM = {
  minX: -9,
  maxX: 9,
  minZ: -12,
  maxZ: 8,
  wallHeight: 4.6,
  vaultRise: 3.1,
};

export const PLAYER = {
  eyeHeight: 1.65,
  radius: 0.32,
  walkSpeed: 2.6,
  runSpeed: 4.4,
  start: [0, 1.65, 5.5] as [number, number, number],
  reach: 2.7,
};

export const TABLE = { x: 0, z: -2, width: 2.7, depth: 1.1, height: 0.95 };

export type Box = [minX: number, maxX: number, minZ: number, maxZ: number];

function box(x: number, z: number, w: number, d: number): Box {
  return [x - w / 2, x + w / 2, z - d / 2, z + d / 2];
}

export const PLACES = {
  console: { x: 2.35, z: -0.55 },
  leftBench: { x: -8.05, z: -0.2, length: 3.6 },
  frontTable: { x: -4.2, z: 3.6 },
  rightBench: { x: 8.05, z: 1.0, length: 3.6 },
  brainCabinet: { x: -8.35, z: -6.6 },
  heartShelf: { x: 8.5, z: -4.2 },
  tesla: { x: 6.4, z: -9.2 },
  furnace: { x: -6.6, z: -10.9 },
  blanketCrate: { x: 5.4, z: 4.6 },
};

export const COLLIDERS: Box[] = [
  box(TABLE.x, TABLE.z, TABLE.width + 0.2, TABLE.depth + 0.3),
  box(PLACES.console.x, PLACES.console.z, 0.9, 0.7),
  box(PLACES.leftBench.x, PLACES.leftBench.z, 1.3, PLACES.leftBench.length),
  box(PLACES.frontTable.x, PLACES.frontTable.z, 2.5, 1.2),
  box(PLACES.rightBench.x, PLACES.rightBench.z, 1.3, PLACES.rightBench.length),
  box(PLACES.brainCabinet.x, PLACES.brainCabinet.z, 1.0, 2.0),
  box(PLACES.heartShelf.x, PLACES.heartShelf.z, 0.8, 3.0),
  box(PLACES.tesla.x, PLACES.tesla.z, 1.8, 1.8),
  box(PLACES.furnace.x, PLACES.furnace.z, 3.0, 1.6),
  box(PLACES.blanketCrate.x, PLACES.blanketCrate.z, 0.9, 0.9),
  box(-3.5, -11.5, 3.2, 0.9),
  box(3.5, -11.5, 3.2, 0.9),
  box(-8.6, 4.0, 0.8, 3.6),
  box(8.0, -6.6, 1.4, 1.6),
];

export const PILLAR_Z = [-11.2, -7.2, -3.2, 0.8, 4.8];
