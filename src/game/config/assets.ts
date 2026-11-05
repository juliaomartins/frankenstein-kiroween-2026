export type Vec3 = [number, number, number];

export interface ModelConfig {
  url: string;
  /** Largest bounding-box dimension the model is scaled to, in metres. */
  fitSize: number;
  /** Rotation applied before fitting, in radians. */
  rotation: Vec3;
  /** Offset applied after the model is centred on its anchor. */
  offset: Vec3;
}

/**
 * Model files live in public/models/. The creature falls back to a procedural stand-in if its file is missing;
 * the first-person hands always come from player-hands.glb.
 * If a model shows up lying the wrong way, adjust `rotation` here; scale is fitted automatically.
 */
export const ASSETS = {
  creature: {
    url: "/models/frankenstein.glb",
    fitSize: 2.05,
    rotation: [-Math.PI / 2, 0, -Math.PI / 2],
    offset: [0, 0, 0],
  } satisfies ModelConfig,
  hands: {
    url: "/models/player-hands.glb",
    fitSize: 0.85,
    rotation: [0, Math.PI, 0],
    offset: [0, -0.32, -0.45],
  } satisfies ModelConfig,
};
