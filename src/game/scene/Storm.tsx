"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { crackle, thunder } from "../audio";
import { Arc } from "./Arc";
import { ROOM } from "./layout";
import { stormState } from "./stormState";

const BOLT_Z = ROOM.minZ - 1.3;
const boltActivity = () => (stormState.flash > 0.35 ? 1 : 0);
const BOLTS: [THREE.Vector3Tuple, THREE.Vector3Tuple][] = [
  [[-1.2, 8.5, BOLT_Z], [0.6, 3.2, BOLT_Z]],
  [[1.6, 8.2, BOLT_Z], [0.9, 4.4, BOLT_Z]],
];

export function Storm() {
  const moon = useRef<THREE.DirectionalLight>(null);
  const next = useRef(3);
  const pulses = useRef<number[]>([]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (t > next.current) {
      next.current = t + 6 + Math.random() * 9;
      pulses.current = [t, t + 0.12 + Math.random() * 0.1, t + 0.35 + Math.random() * 0.2];
      thunder(0.6 + Math.random() * 0.4);
      crackle(0.15, 0.08);
    }
    let target = 0;
    for (const p of pulses.current) {
      const d = t - p;
      if (d >= 0 && d < 0.18) target = Math.max(target, 1 - d / 0.18);
    }
    stormState.flash = Math.max(target, stormState.flash - dt * 4);
    if (moon.current) moon.current.intensity = 0.35 + stormState.flash * 5;
  });

  return (
    <group>
      <directionalLight ref={moon} position={[1, 7, ROOM.minZ - 4]} color="#7d9cff" intensity={0.35} />
      {BOLTS.map(([from, to], i) => (
        <Arc key={i} from={from} to={to} segments={22} jitter={0.9} color="#dfe8ff" intensity={8} activity={boltActivity} rate={30} />
      ))}
      <Sparkles count={160} scale={[16, 5, 18]} position={[0, 2.5, -2]} size={1.6} speed={0.15} opacity={0.35} color="#d8c8a8" />
    </group>
  );
}
