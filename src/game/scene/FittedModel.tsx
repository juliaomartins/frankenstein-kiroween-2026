"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { ModelConfig } from "../config/assets";
import { usePrecompiled } from "./usePrecompiled";

interface Props {
  config: ModelConfig;
  /** "bottom" rests the model on the anchor; "center" centres it on the anchor. */
  align?: "bottom" | "center";
  playAnimation?: string | boolean;
  castShadow?: boolean;
  /** Called on the cloned scene before fitting; may pose it and return the orientation to use instead of `config.rotation`. */
  orient?: (scene: THREE.Object3D) => THREE.Quaternion | null;
  /** Skip raycasting against the model's meshes (use a cheap proxy instead). */
  noRaycast?: boolean;
  onReady?: (root: THREE.Object3D) => void;
  /** Called once the model's shaders are compiled and it is shown. */
  onVisible?: () => void;
}

const skipRaycast = () => undefined;

export function FittedModel({ config, align = "bottom", playAnimation = false, castShadow = true, orient, noRaycast = false, onReady, onVisible }: Props) {
  const gltf = useGLTF(config.url);
  const group = useRef<THREE.Group>(null);
  const root = useMemo(() => {
    const scene = cloneSkinned(gltf.scene);
    const holder = new THREE.Group();
    holder.add(scene);
    const oriented = orient?.(scene) ?? null;
    if (oriented) scene.quaternion.copy(oriented);
    else scene.rotation.set(...config.rotation);
    holder.updateMatrixWorld(true);
    scene.traverse((o) => (o as THREE.SkinnedMesh).isSkinnedMesh && (o as THREE.SkinnedMesh).skeleton.update());
    const box = new THREE.Box3().setFromObject(holder);
    const size = box.getSize(new THREE.Vector3());
    const scale = config.fitSize / Math.max(size.x, size.y, size.z, 1e-6);
    holder.scale.setScalar(scale);
    holder.updateMatrixWorld(true);
    box.setFromObject(holder);
    const center = box.getCenter(new THREE.Vector3());
    holder.position.set(
      -center.x + config.offset[0],
      (align === "bottom" ? -box.min.y : -center.y) + config.offset[1],
      -center.z + config.offset[2],
    );
    holder.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = castShadow;
        o.receiveShadow = true;
        o.frustumCulled = false;
        if (noRaycast) o.raycast = skipRaycast;
      }
    });
    return holder;
  }, [gltf.scene, config, align, castShadow, orient, noRaycast]);

  const ready = usePrecompiled(root);
  const { actions, names } = useAnimations(gltf.animations, group);

  useEffect(() => {
    if (ready) onVisible?.();
  }, [ready, onVisible]);

  useEffect(() => {
    onReady?.(root);
  }, [root, onReady]);

  useEffect(() => {
    if (!playAnimation || names.length === 0) return;
    const name = typeof playAnimation === "string" && names.includes(playAnimation) ? playAnimation : names[0];
    const action = actions[name];
    action?.reset().fadeIn(0.4).play();
    return () => {
      action?.fadeOut(0.3);
    };
  }, [playAnimation, actions, names]);

  return (
    <group ref={group} visible={ready}>
      <primitive object={root} />
    </group>
  );
}
