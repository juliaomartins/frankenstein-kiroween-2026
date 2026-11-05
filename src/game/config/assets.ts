export type Vec3 = [number, number, number];

export interface ModelConfig {
  url: string;
  /** Set to false to ignore the file and use the built-in procedural version. */
  enabled?: boolean;
  /** Largest bounding-box dimension the model is scaled to, in metres. */
  fitSize: number;
  /** Rotation applied before fitting, in radians. */
  rotation: Vec3;
  /** Offset applied after the model is centred on its anchor. */
  offset: Vec3;
}

/**
 * Drop the downloaded Sketchfab .glb files into public/models/ under these names.
 * Until a file exists the game renders a procedural stand-in, so the game runs either way.
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
    enabled: false,
    fitSize: 0.85,
    rotation: [0, Math.PI, 0],
    offset: [0, -0.32, -0.45],
  } satisfies ModelConfig,
};
