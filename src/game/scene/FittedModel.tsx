"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { ModelConfig } from "../config/assets";

interface Props {
  config: ModelConfig;
  /** "bottom" rests the model on the anchor; "center" centres it on the anchor. */
  align?: "bottom" | "center";
  playAnimation?: string | boolean;
  castShadow?: boolean;
  onReady?: (root: THREE.Object3D) => void;
}

export function FittedModel({ config, align = "bottom", playAnimation = false, castShadow = true, onReady }: Props) {
  const gltf = useGLTF(config.url);
  const group = useRef<THREE.Group>(null);
  const root = useMemo(() => {
    const scene = cloneSkinned(gltf.scene);
    const holder = new THREE.Group();
    scene.rotation.set(...config.rotation);
    holder.add(scene);
    holder.updateMatrixWorld(true);
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
      }
    });
    return holder;
  }, [gltf.scene, config, align, castShadow]);

  const { actions, names } = useAnimations(gltf.animations, group);

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
    <group ref={group}>
      <primitive object={root} />
    </group>
  );
}
