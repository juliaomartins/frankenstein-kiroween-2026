"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface ArcProps {
  from: THREE.Vector3Tuple;
  to: THREE.Vector3Tuple;
  segments?: number;
  jitter?: number;
  color?: string;
  intensity?: number;
  /** 0..1 chance per refresh that the arc is visible. */
  activity?: number | (() => number);
  rate?: number;
}

export function Arc({
  from,
  to,
  segments = 14,
  jitter = 0.25,
  color = "#9fc4ff",
  intensity = 6,
  activity = 0.6,
  rate = 18,
}: ArcProps) {
  const timer = useRef(0);
  const { geometry, material, line, a, b } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((segments + 1) * 3), 3));
    const m = new THREE.LineBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false, transparent: true });
    const l = new THREE.Line(g, m);
    l.frustumCulled = false;
    return { geometry: g, material: m, line: l, a: new THREE.Vector3(...from), b: new THREE.Vector3(...to) };
  }, [from, to, segments, color, intensity]);

  useFrame((_, dt) => {
    timer.current -= dt;
    if (timer.current > 0) return;
    timer.current = 1 / rate;
    const chance = typeof activity === "function" ? activity() : activity;
    const visible = Math.random() < chance;
    line.visible = visible;
    if (!visible) return;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const p = new THREE.Vector3();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      p.lerpVectors(a, b, t);
      const edge = i === 0 || i === segments ? 0 : 1;
      const amp = jitter * Math.sin(Math.PI * t) * edge;
      p.x += (Math.random() - 0.5) * amp * 2;
      p.y += (Math.random() - 0.5) * amp * 2;
      p.z += (Math.random() - 0.5) * amp * 2;
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    pos.needsUpdate = true;
    material.opacity = 0.6 + Math.random() * 0.4;
  });

  return <primitive object={line} />;
}
