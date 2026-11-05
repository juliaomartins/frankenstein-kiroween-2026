"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import type * as THREE from "three";

/**
 * Compiles an object's shaders in the background (KHR_parallel_shader_compile where available)
 * and reports when it can be shown without stalling a frame.
 */
export function usePrecompiled(object: THREE.Object3D | null): boolean {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!object) return;
    let alive = true;
    setReady(false);
    gl.compileAsync(object, camera, scene)
      .catch(() => object)
      .then(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [object, gl, camera, scene]);

  return ready;
}
